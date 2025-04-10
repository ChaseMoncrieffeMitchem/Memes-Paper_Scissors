// import Image from "next/image";

// export default function Home() {
//   return (
//     <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
//       <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
//         <Image
//           className="dark:invert"
//           src="/next.svg"
//           alt="Next.js logo"
//           width={180}
//           height={38}
//           priority
//         />
//         <ol className="list-inside list-decimal text-sm/6 text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
//           <li className="mb-2 tracking-[-.01em]">
//             Get started by editing{" "}
//             <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-[family-name:var(--font-geist-mono)] font-semibold">
//               src/app/page.tsx
//             </code>
//             .
//           </li>
//           <li className="tracking-[-.01em]">
//             Save and see your changes instantly.
//           </li>
//         </ol>

//         <div className="flex gap-4 items-center flex-col sm:flex-row">
//           <a
//             className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
//             href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             <Image
//               className="dark:invert"
//               src="/vercel.svg"
//               alt="Vercel logomark"
//               width={20}
//               height={20}
//             />
//             Deploy now
//           </a>
//           <a
//             className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
//             href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             Read our docs
//           </a>
//         </div>
//       </main>
//       <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
//         <a
//           className="flex items-center gap-2 hover:underline hover:underline-offset-4"
//           href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           <Image
//             aria-hidden
//             src="/file.svg"
//             alt="File icon"
//             width={16}
//             height={16}
//           />
//           Learn
//         </a>
//         <a
//           className="flex items-center gap-2 hover:underline hover:underline-offset-4"
//           href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           <Image
//             aria-hidden
//             src="/window.svg"
//             alt="Window icon"
//             width={16}
//             height={16}
//           />
//           Examples
//         </a>
//         <a
//           className="flex items-center gap-2 hover:underline hover:underline-offset-4"
//           href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           <Image
//             aria-hidden
//             src="/globe.svg"
//             alt="Globe icon"
//             width={16}
//             height={16}
//           />
//           Go to nextjs.org →
//         </a>
//       </footer>
//     </div>
//   );
// }

"use client";
import { useContract } from "../../hooks/useContract";
import { JSX, useEffect, useState } from "react";
import { Contract, ethers } from "ethers";

interface Game {
  player1: string;
  player2: string;
  player1Move: number;
  player2Move: number;
  wagerAmount: string;
  status: number;
  timestamp: string;
}

interface GameResult {
  winner: string;
  payout: string;
  player1Move: number;
  player2Move: number;
}

export default function Home(): JSX.Element {
  const [contract, setContract] = useState<Contract | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [move, setMove] = useState<string>("");
  const [gameStatus, setGameStatus] = useState<string>("");
  const [player2Joined, setPlayer2Joined] = useState<boolean>(false);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<string | null>(null);
  const { getContract } = useContract();

  useEffect(() => {
    const initContract = async () => {
      const contractInstance: Contract = await getContract();
      setContract(contractInstance);
      // Get the current player's address
      if (!window.ethereum) throw new Error("No ethereum provider found");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setCurrentPlayer(address);
    };
    initContract();
  }, [getContract]);

  useEffect(() => {
    const fetchGameStatus = async () => {
      if (!contract || !gameId) return;
      try {
        console.log("Fetching game state for gameId:", gameId);
        const game: Game = await contract.getGame(gameId);
        console.log("Game state:", game);
        const statusMap = ["Pending", "Completed", "Tied"];
        setGameStatus(statusMap[game.status]);
        setPlayer2Joined(game.player2 !== ethers.ZeroAddress);

        if (game.status !== 0) {
          console.log("Raw moves from contract:", {
            player1Move: game.player1Move,
            player2Move: game.player2Move,
          });

          const player1Move = Number(game.player1Move);
          const player2Move = Number(game.player2Move);

          console.log("Converted moves:", { player1Move, player2Move });

          let winner = ethers.ZeroAddress;
          if (player1Move !== player2Move) {
            if (
              (player1Move === 1 && player2Move === 3) || // Rock beats Scissors
              (player1Move === 2 && player2Move === 1) || // Paper beats Rock
              (player1Move === 3 && player2Move === 2)    // Scissors beats Paper
            ) {
              winner = game.player1;
            } else {
              winner = game.player2;
            }
          }
          const payout = game.status === 2 ? "0" : (parseFloat(ethers.formatEther(game.wagerAmount.toString())) * 2).toString();
          setGameResult({
            winner,
            payout,
            player1Move,
            player2Move,
          });
        }
      } catch (error) {
        console.error("Error fetching game status:", error);
        setGameStatus("Error");
      }
    };

    fetchGameStatus();

    const interval = setInterval(() => {
      fetchGameStatus();
    }, 5000);

    if (contract && gameId) {
      const listener = (
        resolvedGameId: string,
        winner: string,
        payout: string,
        player1Move: number,
        player2Move: number
      ) => {
        console.log("GameResolved event received:", { resolvedGameId, winner, payout, player1Move, player2Move });
        if (resolvedGameId.toString() === gameId) {
          setGameResult({
            winner,
            payout: ethers.formatEther(payout.toString()),
            player1Move,
            player2Move,
          });
        }
      };
      contract.on("GameResolved", listener);

      return () => {
        contract.off("GameResolved", listener);
        clearInterval(interval);
      };
    }
  }, [contract, gameId]);

  const createGame = async () => {
    if (!contract) return;
    const tx = await contract.createGame({ value: ethers.parseEther("0.0000001") });
    const receipt = await tx.wait();
    const newGameId = receipt.logs[0].args[0].toString();
    console.log("Created game with ID:", newGameId);
    setGameId(newGameId);
    setGameResult(null);
  };

  const joinGame = async () => {
    if (!contract || !gameId) return;
    console.log("Joining game with ID:", gameId);
    const tx = await contract.joinGame(gameId, { value: ethers.parseEther("0.0000001") });
    await tx.wait();
    const game: Game = await contract.getGame(gameId);
    setPlayer2Joined(game.player2 !== ethers.ZeroAddress);
  };

  const submitMove = async () => {
    if (!contract || !gameId || !move) return;
    console.log("Submitting move for gameId:", gameId, "move:", move);
    const tx = await contract.makeMove(gameId, move);
    await tx.wait();
    await new Promise(resolve => setTimeout(resolve, 2000));
    const game: Game = await contract.getGame(gameId);
    console.log("Game state after move:", game);
    const statusMap = ["Pending", "Completed", "Tied"];
    setGameStatus(statusMap[game.status]);
    const updatedGame: Game = await contract.getGame(gameId);
    if (updatedGame.status !== 0) {
      const player1Move = Number(updatedGame.player1Move);
      const player2Move = Number(updatedGame.player2Move);
      let winner = ethers.ZeroAddress;
      if (player1Move !== player2Move) {
        if (
          (player1Move === 1 && player2Move === 3) ||
          (player1Move === 2 && player2Move === 1) ||
          (player1Move === 3 && player2Move === 2)
        ) {
          winner = updatedGame.player1;
        } else {
          winner = updatedGame.player2;
        }
      }
      const payout = updatedGame.status === 2 ? "0" : (parseFloat(ethers.formatEther(updatedGame.wagerAmount.toString())) * 2).toString();
      setGameResult({
        winner,
        payout,
        player1Move,
        player2Move,
      });
    }
  };

  const refreshGameStatus = async () => {
    if (!contract || !gameId) return;
    const game: Game = await contract.getGame(gameId);
    const statusMap = ["Pending", "Completed", "Tied"];
    setGameStatus(statusMap[game.status]);
    setPlayer2Joined(game.player2 !== ethers.ZeroAddress);
  };

  const moveToString = (move: number) => {
    const moves = ["None", "Rock", "Paper", "Scissors"];
    return moves[move] || "Unknown";
  };

  const isWinner = () => {
    if (!gameResult || !currentPlayer) return false;
    return gameResult.winner.toLowerCase() === currentPlayer.toLowerCase();
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold">Rock Paper Scissors</h1>
      <p>Contract: {contract ? "Connected" : "Loading..."}</p>
      <button className="mt-4 bg-blue-500 text-white p-2 rounded" onClick={createGame}>
        Create Game (0.0000001 AVAX)
      </button>
      {gameId && (
        <>
          <p>Game ID: {gameId}</p>
          <p>Game Status: {gameStatus || "Loading..."}</p>
          <p>{player2Joined ? "Both players joined" : "Waiting for Player 2"}</p>
          <button
            className="mt-2 bg-yellow-500 text-white p-2 rounded"
            onClick={refreshGameStatus}
          >
            Refresh Game Status
          </button>
          {gameResult && gameStatus !== "Pending" && (
            <div className="mt-4">
              <p>
                Result: {gameResult.winner === ethers.ZeroAddress ? "Tie" : (isWinner() ? `Winner: ${gameResult.winner}` : "Loser")}
              </p>
              {gameResult.winner !== ethers.ZeroAddress && (
                <p>Payout: {isWinner() ? `${gameResult.payout} AVAX` : "None"}</p>
              )}
              <p>Player 1 Move: {moveToString(gameResult.player1Move)}</p>
              <p>Player 2 Move: {moveToString(gameResult.player2Move)}</p>
            </div>
          )}
          <input
            type="number"
            placeholder="Enter Game ID"
            onChange={(e) => setGameId(e.target.value)}
            className="mt-2 p-2 border rounded w-full"
          />
          <button className="mt-2 bg-green-500 text-white p-2 rounded" onClick={joinGame}>
            Join Game (0.0000001 AVAX)
          </button>
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
          <button className="mt-2 bg-purple-500 text-white p-2 rounded" onClick={submitMove}>
            Submit Move
          </button>
        </>
      )}
    </div>
  );
}