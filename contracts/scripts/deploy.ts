import { ethers } from "hardhat";

async function main() {
  // Get the contract factory
  const RockPaperScissors = await ethers.getContractFactory("RockPaperScissors");
  
  // Deploy the contract and wait for the transaction to be mined
  const rps = await RockPaperScissors.deploy();
  await rps.waitForDeployment(); // Replaces .deployed()
  
  // Get the deployed contract address
  const address = await rps.getAddress(); // Replaces .address
  
  console.log("Contract deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});