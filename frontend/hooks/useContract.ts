import { ethers, Eip1193Provider } from "ethers";
import RockPaperScissorsABI from "../src/abi/RockPaperScissors.json";
import { useCallback } from "react";

const CONTRACT_ADDRESS = "0x22F40879c31b6e8246A555131F4BFb430ef8F991";
const ABI = RockPaperScissorsABI.abi;

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

export const useContract = () => {
  const getContract = useCallback(async () => {
    console.log("Checking for MetaMask...");
    if (typeof window.ethereum === "undefined") {
      console.log("MetaMask not detected!");
      throw new Error("Please install MetaMask and connect to Fuji");
    }
    console.log("MetaMask detected, setting up...");
    const provider = new ethers.BrowserProvider(window.ethereum);
    await window.ethereum.request({ method: "eth_requestAccounts" });
    const signer = await provider.getSigner();
    console.log("Signer address:", await signer.getAddress());
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    console.log("Contract initialized with signer:", CONTRACT_ADDRESS);
    return contract;
  }, []); // Empty deps since no external dependencies

  return { getContract };
};