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
        setErrorMessage("");
      } catch (error: unknown) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to connect wallet");
      }
    };
    initContract();

    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001", {
      autoConnect: true,
    });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Socket.IO connected");
      setErrorMessage("");
    });

    newSocket.on("connect_error", () => {
      setErrorMessage("Socket.IO connection failed");
    });

    const gameIdFromUrl = searchParams.get("gameId");
    const initialLiveUpdate = searchParams.get("liveUpdate");
    if (gameIdFromUrl) {
      setGameId(gameIdFromUrl);
      newSocket.emit("joinGame", gameIdFromUrl);
      if (initialLiveUpdate) {
        setLiveUpdate(decodeURIComponent(initialLiveUpdate));
      }
    }

    return () => {
      newSocket.disconnect();
    };
  }, [getContract, searchParams]);

  useEffect(() => {
    if (!contract || !gameId || !socket || !currentPlayer) return;

    const fetchGameState = async () => {
      try {
        console.log(`Fetching game state for gameId: ${gameId}`);
        const game: Game = await contract.getGame(gameId);
        console.log("Game state:", game);
        setPlayer2Joined(game.player2 !== ethers.ZeroAddress);

        let status = "";
        const isPlayer1 = currentPlayer.toLowerCase() === game.player1.toLowerCase();
        const isPlayer2 = currentPlayer.toLowerCase() === game.player2.toLowerCase();

        if (game.state === 0) {
          if (isPlayer1) {
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
        } else if (game.state === 1) {
          status = "All moves submitted, awaiting resolution";
        } else if (game.state === 2) {
          status = "Game resolved";
          const player1Move = Number(game.move1);
          const player2Move = Number(game.move2);
          let winner = ethers.ZeroAddress;
          if (player1Move !== player2Move) {
            if (
              (player1Move === 1 && player2Move === 3) ||
              (player1Move === 2 && player2Move == 1) ||
              (player1Move === 3 && player2Move == 2)
            ) {
              winner = game.player1;
            } else {
              winner = game.player2;
            }
          }
          const payout = winner === ethers.ZeroAddress ? "0" : "0.0000002";
          setGameResult({ winner, payout, player1Move, player2Move });
        } else {
          console.warn(`Unexpected game state: ${game.state}`);
          status = "Unknown state";
        }

        setGameStatus(status);

        if (!liveUpdate && !isPlayer1 && !isPlayer2) {
          if (game.player1 !== ethers.ZeroAddress) {
            setLiveUpdate(
              game.move1 !== 0
                ? "Player 1 is in this game, waiting for you to join"
                : "Waiting for Player 1's move"
            );
          }
        }

        setErrorMessage("");
      } catch (error: unknown) {
        console.error("fetchGameState error:", error);
        setErrorMessage(error instanceof Error ? error.message : "Failed to fetch game state");
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
      if (data.gameId === gameId) {
        if (data.action === "joined") {
          setPlayer2Joined(true);
          setLiveUpdate(
            currentPlayer.toLowerCase() === data.playerAddress?.toLowerCase()
              ? "Both players in game, waiting for Player 2 move submission"
              : "Player 2 has joined game, waiting for Player 2 move submission"
          );
        } else if (data.action === "move1Submitted") {
          setLiveUpdate(
            currentPlayer.toLowerCase() === data.playerAddress?.toLowerCase()
              ? "Player 1 move submitted, waiting for Player 2 to join the game"
              : "Player 1 is in this game, waiting for you to join"
          );
        } else if (data.action === "move2Submitted") {
          setLiveUpdate("Both players have submitted their moves, waiting for game resolution");
        }
      }
    });

    socket.on("error", ({ message }) => {
      setErrorMessage(message || "Socket.IO error");
    });

    const interval = setInterval(fetchGameState, 5000);

    return () => {
      contract.off("MovesSubmitted", handleMovesSubmitted);
      contract.off("GameResolved", handleGameResolved);
      socket.off("gameUpdate");
      socket.off("error");
      clearInterval(interval);
    };
  }, [contract, gameId, socket, currentPlayer, liveUpdate]);

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
      socket.emit("gameUpdate", { gameId, action: "joined", playerAddress: currentPlayer });
      setPlayer2Joined(true);
      setLiveUpdate("Both players in game, waiting for Player 2 move submission");
      setErrorMessage("");
    } catch (error: unknown) {
      console.error("joinGame error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to join game");
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
      socket.emit("gameUpdate", { gameId, action, playerAddress: currentPlayer });
      setLiveUpdate(
        action === "move1Submitted"
          ? "Player 1 move submitted, waiting for Player 2 to join the game"
          : "Both players have submitted their moves, waiting for game resolution"
      );
      setErrorMessage("");
    } catch (error: unknown) {
      console.error("submitMove error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to submit move");
    }
  };

  const resolveGameManually = async () => {
    if (!contract) {
      setErrorMessage("Contract not initialized");
      return;
    }
    if (!gameId) {
      setErrorMessage("Please enter a Game ID");
      return;
    }
    try {
      console.log(`Manually resolving game ${gameId}`);
      const tx = await contract.fulfillRandomWords(gameId, [Math.floor(Math.random() * 1000)], {
        gasLimit: 200000,
      });
      await tx.wait();
      setErrorMessage("");
    } catch (error: unknown) {
      console.error("resolveGameManually error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to resolve game");
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
      let status = "";
      const isPlayer1 = currentPlayer?.toLowerCase() === game.player1.toLowerCase();
      const isPlayer2 = currentPlayer?.toLowerCase() === game.player2.toLowerCase();

      if (game.state === 0) {
        if (isPlayer1) {
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
      } else if (game.state === 1) {
        status = "All moves submitted, awaiting resolution";
      } else if (game.state === 2) {
        status = "Game resolved";
        const player1Move = Number(game.move1);
        const player2Move = Number(game.move2);
        let winner = ethers.ZeroAddress;
        if (player1Move !== player2Move) {
          if (
            (player1Move === 1 && player2Move === 3) ||
            (player1Move === 2 && player2Move == 1) ||
            (player1Move === 3 && player2Move == 2)
          ) {
            winner = game.player1;
          } else {
            winner = game.player2;
          }
        }
        const payout = winner === ethers.ZeroAddress ? "0" : "0.0000002";
        setGameResult({ winner, payout, player1Move, player2Move });
      }
      setGameStatus(status);
      setPlayer2Joined(game.player2 !== ethers.ZeroAddress);
      setErrorMessage("");
    } catch (error: unknown) {
      console.error("refreshGameStatus error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to refresh game status");
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
      <Link href="/guide.md" className="text-blue-500 hover:underline mb-4 block">
        How to Play
      </Link>
      <input
        type="text"
        placeholder="Enter Game ID"
        value={gameId || ""}
        onChange={(e) => {
          const newGameId = e.target.value || null;
          setGameId(newGameId);
          if (newGameId && socket) {
            socket.emit("joinGame", newGameId);
            router.push(`/game?gameId=${newGameId}`);
          } else {
            router.push("/game");
            setLiveUpdate("");
          }
        }}
        className="mt-2 p-2 border rounded w-full"
      />
      <button
        className="mt-2 bg-green-500 text-white p-2 rounded hover:bg-green-600"
        onClick={joinGame}
      >
        Join Game (0.0000001 AVAX)
      </button>
      {gameId && (
        <>
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
          <button
            className="mt-2 bg-red-500 text-white p-2 rounded hover:bg-red-600"
            onClick={resolveGameManually}
          >
            Resolve Game (Test)
          </button>
          {gameStatus === "All moves submitted, awaiting resolution" && (
            <p className="mt-2 text-yellow-600">
              Resolution may take a moment. Try refreshing or resolving manually.
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