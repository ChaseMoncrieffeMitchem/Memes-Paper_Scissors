const { ethers } = require("hardhat");

async function main() {
  const player1Signer = new ethers.Wallet("0x6d3be9da6b55f3f0e93911ce59495fac92e097ca04a64573542f1694815556b4", ethers.provider); // Replace with Player 1's key
  const player2Signer = new ethers.Wallet("544e9ec727ebce965abb7ca0cb1874a96f6e1c1fa35e3baba65528320a72908f", ethers.provider); // Replace with Player 2's key
  const rps = await ethers.getContractAt("RockPaperScissors", "0x6e7ED11cc01e3e28F8eCD28bF553F83161d45D17", player1Signer);

  // Create game
  const createTx = await rps.createGame({ value: ethers.parseEther("0.0000001") });
  const createReceipt = await createTx.wait();
  const gameId = createReceipt.logs[0].args[0].toString();
  console.log("Game created, ID:", gameId);

  // Player 2 joins
  const rpsPlayer2 = rps.connect(player2Signer);
  const joinTx = await rpsPlayer2.joinGame(gameId, { value: ethers.parseEther("0.0000001") });
  await joinTx.wait();
  console.log("Player 2 joined");

  // Player 1 submits move
  const move1Tx = await rps.makeMove(gameId, 1);
  await move1Tx.wait();
  console.log("Player 1 submitted move");

  // Player 2 submits move
  const move2Tx = await rpsPlayer2.makeMove(gameId, 3);
  console.log("Player 2 Tx hash:", move2Tx.hash);
  await move2Tx.wait();

  // Check final state
  const game = await rps.getGame(gameId);
  console.log("Game after move:", {
    player1: game[0],
    player2: game[1],
    move1: game[2].toString(),
    move2: game[3].toString(),
    state: game[4].toString(),
    randomRequestId: game[5].toString()
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});