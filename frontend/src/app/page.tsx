// "use client";
// import { useContract } from "../../hooks/useContract";
// import { JSX, useEffect, useState } from "react";
// import { Contract, ethers } from "ethers";

// interface Game {
//   player1: string;
//   player2: string;
//   move1: number;
//   move2: number;
//   state: number;
//   randomRequestId: string;
// }

// interface GameResult {
//   winner: string;
//   payout: string;
//   player1Move: number;
//   player2Move: number;
// }

// export default function Home(): JSX.Element {
//   const [contract, setContract] = useState<Contract | null>(null);
//   const [gameId, setGameId] = useState<string | null>(null);
//   const [move, setMove] = useState<string>("");
//   const [gameStatus, setGameStatus] = useState<string>("");
//   const [player2Joined, setPlayer2Joined] = useState<boolean>(false);
//   const [gameResult, setGameResult] = useState<GameResult | null>(null);
//   const [currentPlayer, setCurrentPlayer] = useState<string | null>(null);
//   const [errorMessage, setErrorMessage] = useState<string>(""); // New error state
//   const { getContract } = useContract();

//   useEffect(() => {
//     const initContract = async () => {
//       try {
//         if (!window.ethereum) throw new Error("MetaMask not installed");
//         const contractInstance: Contract = await getContract();
//         setContract(contractInstance);
//         const provider = new ethers.BrowserProvider(window.ethereum);
//         const signer = await provider.getSigner();
//         const address = await signer.getAddress();
//         setCurrentPlayer(address);
//         setErrorMessage(""); // Clear error on success
//       } catch (error: Error | unknown) {
//         setErrorMessage(error instanceof Error ? error.message : "Failed to initialize contract");
//       }
//     };
//     initContract();
//   }, [getContract]);

//   useEffect(() => {
//     if (!contract || !gameId) return;

//     const fetchGameState = async () => {
//       try {
//         const game: Game = await contract.getGame(gameId);
//         const statusMap = ["Pending", "MovesSubmitted", "Resolved"];
//         setGameStatus(statusMap[Number(game.state)]);
//         setPlayer2Joined(game.player2 !== ethers.ZeroAddress);

//         if (game.state.toString() === "2") {
//           const player1Move = Number(game.move1);
//           const player2Move = Number(game.move2);
//           let winner = ethers.ZeroAddress;
//           if (player1Move !== player2Move) {
//             if (
//               (player1Move === 1 && player2Move === 3) ||
//               (player1Move === 2 && player2Move === 1) ||
//               (player1Move === 3 && player2Move === 2)
//             ) {
//               winner = game.player1;
//             } else {
//               winner = game.player2;
//             }
//           }
//           const payout = winner === ethers.ZeroAddress ? "0" : "0.0000002";
//           setGameResult({ winner, payout, player1Move, player2Move });
//         }
//         setErrorMessage(""); // Clear error on success
//       } catch (error: Error | unknown) {
//         setErrorMessage(error instanceof Error ? error.message : "Failed to fetch game state");
//       }
//     };

//     fetchGameState();

//     contract.on("MovesSubmitted", (eventGameId: bigint) => {
//       if (eventGameId.toString() === gameId) fetchGameState();
//     });

//     contract.on("GameResolved", (eventGameId: bigint) => {
//       if (eventGameId.toString() === gameId) fetchGameState();
//     });

//     const interval = setInterval(fetchGameState, 10000);

//     return () => {
//       contract.removeAllListeners();
//       clearInterval(interval);
//     };
//   }, [contract, gameId]);

//   const createGame = async () => {
//     if (!contract) {
//       setErrorMessage("Contract not initialized");
//       return;
//     }
//     try {
//       const tx = await contract.createGame({
//         value: ethers.parseEther("0.0000001"),
//         gasLimit: 200000,
//       });
//       const receipt = await tx.wait();
//       const gameCreatedEvent = receipt.logs.find((log: ethers.Log) =>
//         contract.interface.parseLog(log)?.name === "GameCreated"
//       );
//       if (!gameCreatedEvent) throw new Error("GameCreated event not found");
//       const newGameId = gameCreatedEvent.args[0].toString();
//       setGameId(newGameId);
//       setGameResult(null);
//       setGameStatus("Pending");
//       setErrorMessage("");
//     } catch (error: Error | unknown) {
//       setErrorMessage(error instanceof Error ? error.message : "Failed to create game");
//     }
//   };

//   const joinGame = async () => {
//     if (!contract) {
//       setErrorMessage("Contract not initialized");
//       return;
//     }
//     if (!gameId) {
//       setErrorMessage("Please enter a Game ID");
//       return;
//     }
//     try {
//       const tx = await contract.joinGame(gameId, {
//         value: ethers.parseEther("0.0000001"),
//         gasLimit: 200000,
//       });
//       await tx.wait();
//       setPlayer2Joined(true);
//       setErrorMessage("");
//     } catch (error: Error | unknown) {
//       setErrorMessage(error instanceof Error ? error.message : "Failed to join game");
//     }
//   };

//   const submitMove = async () => {
//     if (!contract) {
//       setErrorMessage("Contract not initialized");
//       return;
//     }
//     if (!gameId) {
//       setErrorMessage("Please enter a Game ID");
//       return;
//     }
//     if (!move) {
//       setErrorMessage("Please select a move");
//       return;
//     }
//     try {
//       const gameBefore: Game = await contract.getGame(gameId);
//       if (gameBefore.state.toString() !== "0") {
//         throw new Error("Game is not pending");
//       }
//       if (
//         gameBefore.player1.toLowerCase() !== currentPlayer?.toLowerCase() &&
//         gameBefore.player2.toLowerCase() !== currentPlayer?.toLowerCase()
//       ) {
//         throw new Error("You are not a player");
//       }
//       if (
//         gameBefore.player1.toLowerCase() === currentPlayer?.toLowerCase() &&
//         gameBefore.move1.toString() !== "0"
//       ) {
//         throw new Error("Move already submitted");
//       }
//       if (
//         gameBefore.player2.toLowerCase() === currentPlayer?.toLowerCase() &&
//         gameBefore.move2.toString() !== "0"
//       ) {
//         throw new Error("Move already submitted");
//       }
//       const tx = await contract.makeMove(gameId, move, { gasLimit: 200000 });
//       await tx.wait();
//       setErrorMessage("");
//     } catch (error: Error | unknown) {
//       setErrorMessage(error instanceof Error ? error.message : "Failed to submit move");
//     }
//   };

//   const refreshGameStatus = async () => {
//     if (!contract) {
//       setErrorMessage("Contract not initialized");
//       return;
//     }
//     if (!gameId) {
//       setErrorMessage("Please enter a Game ID");
//       return;
//     }
//     try {
//       const game: Game = await contract.getGame(gameId);
//       const statusMap = ["Pending", "MovesSubmitted", "Resolved"];
//       setGameStatus(statusMap[game.state]);
//       setPlayer2Joined(game.player2 !== ethers.ZeroAddress);
//       setErrorMessage("");
//     } catch (error: Error | unknown) {
//       setErrorMessage(error instanceof Error ? error.message : "Failed to refresh game status");
//     }
//   };

//   const moveToString = (move: number) => {
//     const moves = ["None", "Rock", "Paper", "Scissors"];
//     return moves[move] || "Unknown";
//   };

//   const isWinner = () => {
//     if (!gameResult || !currentPlayer) return false;
//     return gameResult.winner.toLowerCase() === currentPlayer.toLowerCase();
//   };

//   return (
//     <div className="p-4 max-w-md mx-auto">
//       <h1 className="text-2xl font-bold mb-4">Rock Paper Scissors</h1>
//       <p>Contract: {contract ? "Connected" : "Loading..."}</p>
//       {currentPlayer ? (
//         <p className="text-sm mb-2">
//           Player: {currentPlayer.slice(0, 6)}...{currentPlayer.slice(-4)}
//         </p>
//       ) : (
//         <p className="text-sm mb-2">Connecting wallet...</p>
//       )}
//       <button
//         className="mt-2 bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
//         onClick={createGame}
//       >
//         Create Game (0.0000001 AVAX)
//       </button>
//       {gameId && (
//         <>
//           <p className="mt-2">Game ID: {gameId}</p>
//           <p className="mt-2">Game Status: {gameStatus || "Loading..."}</p>
//           <p className="mt-2">
//             {player2Joined ? "Both players joined" : "Waiting for Player 2"}
//           </p>
//           <button
//             className="mt-2 bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600"
//             onClick={refreshGameStatus}
//           >
//             Refresh Game Status
//           </button>
//           {gameResult && gameStatus === "Resolved" && (
//             <div className="mt-4 p-4 border rounded">
//               <p>
//                 Result:{" "}
//                 {gameResult.winner === ethers.ZeroAddress
//                   ? "Tie"
//                   : `Winner: ${gameResult.winner.slice(0, 6)}...${
//                       isWinner() ? " (You)" : ""
//                     }`}
//               </p>
//               {gameResult.winner !== ethers.ZeroAddress && (
//                 <p>Payout: {isWinner() ? `${gameResult.payout} AVAX` : "None"}</p>
//               )}
//               <p>Player 1 Move: {moveToString(gameResult.player1Move)}</p>
//               <p>Player 2 Move: {moveToString(gameResult.player2Move)}</p>
//             </div>
//           )}
//         </>
//       )}
//       <input
//         type="text"
//         placeholder="Enter Game ID"
//         value={gameId || ""}
//         onChange={(e) => setGameId(e.target.value || null)}
//         className="mt-4 p-2 border rounded w-full"
//       />
//       <button
//         className="mt-2 bg-green-500 text-white p-2 rounded hover:bg-green-600"
//         onClick={joinGame}
//       >
//         Join Game (0.0000001 AVAX)
//       </button>
//       <select
//         value={move}
//         onChange={(e) => setMove(e.target.value)}
//         className="mt-2 p-2 border rounded w-full"
//       >
//         <option value="">Select Move</option>
//         <option value="1">Rock</option>
//         <option value="2">Paper</option>
//         <option value="3">Scissors</option>
//       </select>
//       <button
//         className="mt-2 bg-purple-500 text-white p-2 rounded hover:bg-purple-600"
//         onClick={submitMove}
//       >
//         Submit Move
//       </button>
//       {errorMessage && (
//         <p className="mt-4 p-2 bg-red-100 text-red-700 border border-red-300 rounded">
//           Error: {errorMessage}
//         </p>
//       )}
//     </div>
//   );
// }

"use client";
import { useContract } from "../../hooks/useContract";
import { JSX, useEffect, useState } from "react";
import { Contract, ethers } from "ethers";
import { useRouter } from "next/navigation";

export default function Home(): JSX.Element {
  const [contract, setContract] = useState<Contract | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const { getContract } = useContract();
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
  }, [getContract]);

  const createGame = async () => {
    if (!contract) {
      setErrorMessage("Contract not initialized");
      return;
    }
    try {
      const tx = await contract.createGame({
        value: ethers.parseEther("0.0000001"),
        gasLimit: 200000,
      });
      const receipt = await tx.wait();
      const gameCreatedEvent = receipt.logs.find((log: ethers.Log) =>
        contract.interface.parseLog(log)?.name === "GameCreated"
      );
      if (!gameCreatedEvent) throw new Error("GameCreated event not found");
      const newGameId = gameCreatedEvent.args[0].toString();
      setErrorMessage("");
      // Pass initial liveUpdate via query param
      router.push(`/game?gameId=${newGameId}&liveUpdate=Waiting%20for%20your%20move%20submission`);
    } catch (error: unknown) {
      const ethersError = error as { reason?: string };
      setErrorMessage(error instanceof Error ? ethersError.reason || error.message : "Failed to create game");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Rock Paper Scissors</h1>
      <p>Contract: {contract ? "Connected" : "Loading..."}</p>
      {currentPlayer ? (
        <p className="text-sm mb-4">
          Player: {currentPlayer.slice(0, 6)}...{currentPlayer.slice(-4)}
        </p>
      ) : (
        <p className="text-sm mb-4">Connecting wallet...</p>
      )}
      <button
        className="mt-2 bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        onClick={createGame}
      >
        Create Game (0.0000001 AVAX)
      </button>
      {errorMessage && (
        <p className="mt-4 p-2 bg-red-100 text-red-700 border border-red-300 rounded">
          Error: {errorMessage}
        </p>
      )}
    </div>
  );
}