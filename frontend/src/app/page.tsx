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