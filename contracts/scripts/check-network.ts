import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Balance:", ethers.formatEther(balance), "AVAX");
    const network = await ethers.provider.getNetwork();
    console.log("Connected to network:", network.name, "Chain ID:", network.chainId);
  }
  
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
