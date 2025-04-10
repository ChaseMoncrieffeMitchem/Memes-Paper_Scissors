import { ethers } from "hardhat";

async function main() {
  const subscriptionId = "58637910779827876803596604279324847032578563370178762987567537698610436648405";
  
  const RockPaperScissors = await ethers.getContractFactory("RockPaperScissors");
  // Pass subscriptionId as the argument, followed by an empty overrides object
  const rps = await RockPaperScissors.deploy(subscriptionId);
  await rps.waitForDeployment();
  
  const address = await rps.getAddress();
  console.log("Contract deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});