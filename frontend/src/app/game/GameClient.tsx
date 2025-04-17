"use client";
import { useContract } from "../../../hooks/useContract";
import { JSX, useEffect, useState } from "react";
import { Contract, ethers } from "ethers";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { io, Socket } from "socket.io-client";

interface Game {
  player1: string;
  player2: string;
  move1: number;
  move2: number;
  state: number;
  randomRequestId: string;
}

interface GameResult {
  winner: string;
  payout: string;
  player1Move: number;
  player2Move: number;
}

export default function GameClient(): JSX.Element {
  const [contract, setContract] = useState<Contract | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [move, setMove] = useState<string>("");
  const [gameStatus, setGameStatus] = useState<string>("");
  const [liveUpdate, setLiveUpdate] = useState<string>("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [player2Joined, setPlayer2Joined] = useState<boolean>(false);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isPlayer1, setIsPlayer1] = useState<boolean>(false);
  const { getContract } = useContract();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const initContract = async () => {
      try {
        if (!window.ethereum) throw new Error("MetaMask not installed");
        const contractInstance: Contract = await getContract();
        setContract(contractInstance);
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setCurrentPlayer(address);
        console.log("Contract initialized, player:", address);
        setErrorMessage("");
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : "Failed to connect wallet";
        console.error("initContract error:", errMsg);
        setErrorMessage(errMsg);
      }
    };
    initContract();

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
    console.log(`Attempting Socket.IO connection to ${socketUrl}`);
    const newSocket = io(socketUrl, { autoConnect: true });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Socket.IO connected, ID:", newSocket.id);
      setErrorMessage("");
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket.IO connect error:", err.message);
      setErrorMessage(`Socket.IO connection failed: ${err.message}`);
    });

    newSocket.on("connect_timeout", () => {
      console.error("Socket.IO connect timeout");
      setErrorMessage("Socket.IO connection timed out");
    });

    const gameIdFromUrl = searchParams.get("gameId");
    const initialLiveUpdate = searchParams.get("liveUpdate");
    if (gameIdFromUrl) {
      setGameId(gameIdFromUrl);
      console.log(`Joining game room: ${gameIdFromUrl}`);
      newSocket.emit("joinGame", gameIdFromUrl);
      if (initialLiveUpdate) {
        setLiveUpdate(decodeURIComponent(initialLiveUpdate));
        console.log("Set initial liveUpdate from URL:", initialLiveUpdate);
      }
    }

    return () => {
      console.log("Disconnecting Socket.IO");
      newSocket.disconnect();
    };
  }, [getContract, searchParams]);

  useEffect(() => {
    if (!contract || !gameId || !socket || !currentPlayer) {
      console.log("Skipping fetchGameState, missing:", { contract, gameId, socket, currentPlayer });
      return;
    }
  
    const fetchGameState = async () => {
      try {
        console.log(`Fetching game state for gameId: ${gameId}`);
        const game: Game = await contract.getGame(gameId);
        console.log("Game state received:", game);
        setPlayer2Joined(game.player2 !== ethers.ZeroAddress);
  
        const isPlayer1Check = currentPlayer.toLowerCase() === game.player1.toLowerCase();
        setIsPlayer1(isPlayer1Check);
        console.log(`isPlayer1: ${isPlayer1Check}`);
  
        let status = "";
        const isPlayer2 = currentPlayer.toLowerCase() === game.player2.toLowerCase();
  
        const state = Number(game.state); // Convert BigInt to number
        if (state === 0) {
          if (isPlayer1Check) {
            if (game.move1 === 0) {
              status = "Waiting for your move submission";
            } else {
              status = game.player2 === ethers.ZeroAddress
                ? "Waiting for Player 2 to join"
                : "Waiting for Player 2's move";
            }
          } else if (isPlayer2) {
            status = game.move2 === 0
              ? "Lobby full, submit your move"
              : "Waiting for resolution";
          } else {
            status = "Game started, join to play";
          }
        } else if (state === 1) {
          status = "All moves submitted, awaiting resolution";
        } else if (state === 2) {
          status = "Game resolved";
          setLiveUpdate("Game Resolved"); // Sync liveUpdate with resolution
          const player1Move = Number(game.move1);
          const player2Move = Number(game.move2);
          let winner = ethers.ZeroAddress;
          if (player1Move !== player2Move) {
            if (
              (player1Move === 1 && player2Move === 3) ||
              (player1Move === 2 && player2Move === 1) ||
              (player1Move === 3 && player2Move === 2)
            ) {
              winner = game.player1;
            } else {
              winner = game.player2;
            }
          }
          const payout = winner === ethers.ZeroAddress ? "0" : "0.0000002";
          setGameResult({ winner, payout, player1Move, player2Move });
        } else {
          console.warn(`Unexpected game state: ${state}`);
          status = "Unknown state, please refresh";
        }
  
        console.log(`Setting gameStatus: ${status}`);
        setGameStatus(status);
        setErrorMessage("");
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : "Failed to fetch game state";
        console.error("fetchGameState error:", errMsg);
        setErrorMessage(errMsg);
      }
    };
  
    fetchGameState();
  
    const handleMovesSubmitted = (eventGameId: bigint) => {
      console.log(`MovesSubmitted event for gameId: ${eventGameId}`);
      if (eventGameId.toString() === gameId) fetchGameState();
    };
  
    const handleGameResolved = (eventGameId: bigint) => {
      console.log(`GameResolved event for gameId: ${eventGameId}`);
      if (eventGameId.toString() === gameId) fetchGameState();
    };
  
    contract.on("MovesSubmitted", handleMovesSubmitted);
    contract.on("GameResolved", handleGameResolved);
  
    socket.on("gameUpdate", (data) => {
      console.log(`Received gameUpdate:`, data);
      if (data.gameId === gameId) {
        if (data.action === "joined") {
          setPlayer2Joined(true);
          const update = currentPlayer.toLowerCase() === data.playerAddress?.toLowerCase()
            ? "Both players in game, waiting for Player 2 move submission"
            : "Player 2 has joined game, waiting for Player 2 move submission";
          console.log(`Setting liveUpdate: ${update}`);
          setLiveUpdate(update);
        } else if (data.action === "move1Submitted") {
          const update = currentPlayer.toLowerCase() === data.playerAddress?.toLowerCase()
            ? "Player 1 move submitted, waiting for Player 2 to join the game"
            : "Player 1 is in this game, waiting for you to join";
          console.log(`Setting liveUpdate: ${update}`);
          setLiveUpdate(update);
        } else if (data.action === "move2Submitted") {
          console.log(`Setting liveUpdate: Both players have submitted...`);
          setLiveUpdate("Both players have submitted their moves, waiting for game resolution");
        }
      }
    });
  
    socket.on("checkGameStatus", (response: { player1Exists: boolean; move1Submitted: boolean }) => {
      console.log(`Received checkGameStatus:`, response);
      if (response.player1Exists) {
        const update = response.move1Submitted
          ? "Player 1 is in this game, waiting for you to join"
          : "Waiting for Player 1's move";
        console.log(`Setting liveUpdate from checkGameStatus: ${update}`);
        setLiveUpdate(update);
      }
    });
  
    socket.on("error", ({ message }) => {
      console.error("Socket.IO error:", message);
      setErrorMessage(message || "Socket.IO error");
    });
  
    console.log(`Emitting checkGameStatus for gameId: ${gameId}`);
    socket.emit("checkGameStatus", gameId);
  
    const interval = setInterval(() => {
      console.log(`Polling fetchGameState for gameId: ${gameId}`);
      fetchGameState();
    }, 5000);
  
    return () => {
      console.log("Cleaning up listeners");
      contract.off("MovesSubmitted", handleMovesSubmitted);
      contract.off("GameResolved", handleGameResolved);
      socket.off("gameUpdate");
      socket.off("checkGameStatus");
      socket.off("error");
      clearInterval(interval);
    };
  }, [contract, gameId, socket, currentPlayer]);

  const joinGame = async () => {
    if (!contract) {
      setErrorMessage("Contract not initialized");
      return;
    }
    if (!gameId) {
      setErrorMessage("Please enter a Game ID");
      return;
    }
    if (!socket) {
      setErrorMessage("Socket.IO not connected");
      return;
    }
    try {
      console.log(`Joining game ${gameId}`);
      const tx = await contract.joinGame(gameId, {
        value: ethers.parseEther("0.0000001"),
        gasLimit: 200000,
      });
      await tx.wait();
      console.log(`Emitting gameUpdate: joined, gameId: ${gameId}`);
      socket.emit("gameUpdate", { gameId, action: "joined", playerAddress: currentPlayer });
      setPlayer2Joined(true);
      setLiveUpdate("Both players in game, waiting for Player 2 move submission");
      setErrorMessage("");
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Failed to join game";
      console.error("joinGame error:", errMsg);
      setErrorMessage(errMsg);
    }
  };

  const submitMove = async () => {
    if (!contract) {
      setErrorMessage("Contract not initialized");
      return;
    }
    if (!gameId) {
      setErrorMessage("Please enter a Game ID");
      return;
    }
    if (!move) {
      setErrorMessage("Please select a move");
      return;
    }
    if (!socket) {
      setErrorMessage("Socket.IO not connected");
      return;
    }
    try {
      console.log(`Submitting move ${move} for game ${gameId}`);
      const gameBefore: Game = await contract.getGame(gameId);
      if (gameBefore.state.toString() !== "0") {
        throw new Error("Game not pending");
      }
      if (
        gameBefore.player1.toLowerCase() !== currentPlayer?.toLowerCase() &&
        gameBefore.player2.toLowerCase() !== currentPlayer?.toLowerCase()
      ) {
        throw new Error("You are not a player");
      }
      if (
        gameBefore.player1.toLowerCase() === currentPlayer?.toLowerCase() &&
        gameBefore.move1.toString() !== "0"
      ) {
        throw new Error("Move already submitted");
      }
      if (
        gameBefore.player2.toLowerCase() === currentPlayer?.toLowerCase() &&
        gameBefore.move2.toString() !== "0"
      ) {
        throw new Error("Move already submitted");
      }
      const tx = await contract.makeMove(gameId, move, { gasLimit: 200000 });
      await tx.wait();
      const action = gameBefore.player1.toLowerCase() === currentPlayer?.toLowerCase()
        ? "move1Submitted"
        : "move2Submitted";
      console.log(`Emitting gameUpdate: ${action}, gameId: ${gameId}`);
      socket.emit("gameUpdate", { gameId, action, playerAddress: currentPlayer });
      const update = action === "move1Submitted"
        ? "Player 1 move submitted, waiting for Player 2 to join the game"
        : "Both players have submitted their moves, waiting for game resolution";
      console.log(`Setting liveUpdate: ${update}`);
      setLiveUpdate(update);
      setErrorMessage("");
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Failed to submit move";
      console.error("submitMove error:", errMsg);
      setErrorMessage(errMsg);
    }
  };

  const refreshGameStatus = async () => {
    if (!contract) {
      setErrorMessage("Contract not initialized");
      return;
    }
    if (!gameId) {
      setErrorMessage("Please enter a Game ID");
      return;
    }
    try {
      console.log(`Refreshing game status for gameId: ${gameId}`);
      const game: Game = await contract.getGame(gameId);
      console.log("Refresh game state:", game);
      let status = "";
      const isPlayer1Check = currentPlayer?.toLowerCase() === game.player1.toLowerCase();
      setIsPlayer1(isPlayer1Check);
      console.log(`isPlayer1: ${isPlayer1Check}`);
      const isPlayer2 = currentPlayer?.toLowerCase() === game.player2.toLowerCase();

      const state = Number(game.state);
      if (state === 0) {
        if (isPlayer1Check) {
          if (game.move1 === 0) {
            status = "Waiting for your move submission";
          } else {
            status = game.player2 === ethers.ZeroAddress
              ? "Waiting for Player 2 to join"
              : "Waiting for Player 2's move";
          }
        } else if (isPlayer2) {
          status = game.move2 === 0
            ? "Lobby full, submit your move"
            : "Waiting for resolution";
        } else {
          status = "Game started, join to play";
        }
      } else if (state === 1) {
        status = "All moves submitted, awaiting resolution";
      } else if (state === 2) {
        status = "Game resolved";
        const player1Move = Number(game.move1);
        const player2Move = Number(game.move2);
        let winner = ethers.ZeroAddress;
        if (player1Move !== player2Move) {
          if (
            (player1Move === 1 && player2Move === 3) ||
            (player1Move === 2 && player2Move === 1) ||
            (player1Move === 3 && player2Move === 2)
          ) {
            winner = game.player1;
          } else {
            winner = game.player2;
          }
        }
        const payout = winner === ethers.ZeroAddress ? "0" : "0.0000002";
        setGameResult({ winner, payout, player1Move, player2Move });
      } else {
        console.warn(`Unexpected game state on refresh: ${state}`);
        status = "Unknown state, please refresh";
      }
      console.log(`Setting gameStatus on refresh: ${status}`);
      setGameStatus(status);
      setPlayer2Joined(game.player2 !== ethers.ZeroAddress);
      setErrorMessage("");
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Failed to refresh game status";
      console.error("refreshGameStatus error:", errMsg);
      setErrorMessage(errMsg);
    }
  };

  const moveToString = (move: number) => {
    const moves = ["None", "Rock", "Paper", "Scissors"];
    return moves[move] || "Unknown";
  };

  const isWinner = () => {
    if (!gameResult || !currentPlayer) return false;
    return gameResult.winner.toLowerCase() === currentPlayer?.toLowerCase();
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Game</h1>
      <p>Contract: {contract ? "Connected" : "Loading..."}</p>
      {currentPlayer ? (
        <p className="text-sm mb-4">
          Player: {currentPlayer.slice(0, 6)}...{currentPlayer.slice(-4)}
        </p>
      ) : (
        <p className="text-sm mb-4">Connecting wallet...</p>
      )}
      <Link href="/" className="text-blue-500 hover:underline mb-4 block">
        Back to Home
      </Link>
      <input
        type="text"
        placeholder="Enter Game ID"
        value={gameId || ""}
        onChange={(e) => {
          const newGameId = e.target.value || null;
          setGameId(newGameId);
          if (newGameId && socket) {
            console.log(`Emitting joinGame: ${newGameId}`);
            socket.emit("joinGame", newGameId);
            router.push(`/game?gameId=${newGameId}`);
          } else {
            router.push("/game");
            setLiveUpdate("");
          }
        }}
        className="mt-2 p-2 border rounded w-full"
      />
      {gameId && (
        <>
          {!isPlayer1 && (
            <button
              className="mt-2 bg-green-500 text-white p-2 rounded hover:bg-green-600"
              onClick={joinGame}
            >
              Join Game (0.0000001 AVAX)
            </button>
          )}
          <p className="mt-2">Game ID: {gameId}</p>
          <p className="mt-2">Game Status: {gameStatus || "Loading..."}</p>
          <p className="mt-2 text-green-600 italic">
            Live Update: {liveUpdate || "Waiting for updates..."}
          </p>
          <button
            className="mt-2 bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600"
            onClick={refreshGameStatus}
          >
            Refresh Game Status
          </button>
          {gameStatus === "All moves submitted, awaiting resolution" && (
            <p className="mt-2 text-yellow-600">
              Resolution may take a moment. Try refreshing.
            </p>
          )}
          {gameResult && gameStatus === "Game resolved" && (
            <div className="mt-4 p-4 border rounded">
              <p>
                Result:{" "}
                {gameResult.winner === ethers.ZeroAddress
                  ? "Tie"
                  : `Winner: ${gameResult.winner.slice(0, 6)}...${isWinner() ? " (You)" : ""}`}
              </p>
              {gameResult.winner !== ethers.ZeroAddress && (
                <p>Payout: {isWinner() ? `${gameResult.payout} AVAX` : "None"}</p>
              )}
              <p>Player 1 Move: {moveToString(gameResult.player1Move)}</p>
              <p>Player 2 Move: {moveToString(gameResult.player2Move)}</p>
            </div>
          )}
          <select
            value={move}
            onChange={(e) => setMove(e.target.value)}
            className="mt-2 p-2 border rounded w-full"
          >
            <option value="">Select Move</option>
            <option value="1">Rock</option>
            <option value="2">Paper</option>
            <option value="3">Scissors</option>
          </select>
          <button
            className="mt-2 bg-purple-500 text-white p-2 rounded hover:bg-purple-600"
            onClick={submitMove}
          >
            Submit Move
          </button>
        </>
      )}
      {errorMessage && (
        <p className="mt-4 p-2 bg-red-100 text-red-700 border border-red-300 rounded">
          Error: {errorMessage}
        </p>
      )}
    </div>
  );
}