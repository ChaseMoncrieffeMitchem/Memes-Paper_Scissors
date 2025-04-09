import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer, Contract, ContractTransactionResponse, ContractTransactionReceipt, Interface } from "ethers";

interface RockPaperScissorsContract {
    connect(signer: Signer): RockPaperScissorsContract;
    interface: Interface; // For parsing logs
    createGame(overrides?: { value: bigint }): Promise<ContractTransactionResponse>;
    joinGame(gameId: bigint, overrides?: { value: bigint }): Promise<ContractTransactionResponse>;
    makeMove(gameId: bigint, move: number): Promise<ContractTransactionResponse>;
    getPlayerStats(player: string): Promise<[bigint, bigint]>;
}

describe("RockPaperScissors on Local Network", function () {
  let rps: RockPaperScissorsContract;
  let owner: Signer;
  let player1: Signer;
  let player2: Signer;
  const WAGER_AMOUNT = ethers.parseEther("0.01"); // Same as Fuji test

  const ROCK = 1;
  const PAPER = 2;
  const SCISSORS = 3;

  before(async function () {
    // Use Hardhat's pre-funded accounts instead of testnet private keys
    [owner, player1, player2] = await ethers.getSigners();

    // Deploy a fresh contract locally instead of attaching to a Fuji address
    const RockPaperScissors = await ethers.getContractFactory("RockPaperScissors");
    rps = (await RockPaperScissors.deploy()) as unknown as RockPaperScissorsContract;
    await (rps as unknown as Contract).waitForDeployment();

    // Log player addresses (for debugging, similar to your Fuji test)
    console.log("Player1 address:", await player1.getAddress());
    console.log("Player2 address:", await player2.getAddress());

    // Check balances (Hardhat accounts have 10,000 ETH by default)
    const player1Balance = await ethers.provider.getBalance(player1);
    const player2Balance = await ethers.provider.getBalance(player2);
    console.log("Player1 balance:", ethers.formatEther(player1Balance), "ETH");
    console.log("Player2 balance:", ethers.formatEther(player2Balance), "ETH");
    expect(player1Balance).to.be.gte(WAGER_AMOUNT, "Player1 needs ETH");
    expect(player2Balance).to.be.gte(WAGER_AMOUNT, "Player2 needs ETH");
  });

  // Tests for the MVP two-player RockPaperScissors on local network; multi-chain and escrow deferred
  describe("Head-to-Head Game Scenarios", function () {
    it("Player1 wins against Player2 (Rock vs Scissors)", async function () {
      const txCreate = await rps.connect(player1).createGame({ value: WAGER_AMOUNT });
      const receiptCreate = await txCreate.wait() as ContractTransactionReceipt;
      const event = rps.interface.parseLog(receiptCreate.logs[0]);
      const gameId = event?.args.gameId as bigint;
      await expect(txCreate)
        .to.emit(rps, "GameCreated")
        .withArgs(gameId, await player1.getAddress(), WAGER_AMOUNT);

      const txJoin = await rps.connect(player2).joinGame(gameId, { value: WAGER_AMOUNT });
      await txJoin.wait();

      const txMove1 = await rps.connect(player1).makeMove(gameId, ROCK);
      await expect(txMove1).to.emit(rps, "MoveMade").withArgs(gameId, await player1.getAddress(), ROCK);

      const txMove2 = await rps.connect(player2).makeMove(gameId, SCISSORS);
      await txMove2.wait();

      await expect(txMove2)
        .to.emit(rps, "GameResolved")
        .withArgs(gameId, await player1.getAddress(), WAGER_AMOUNT * 2n, ROCK, SCISSORS);

      const [won1, played1] = await rps.getPlayerStats(await player1.getAddress());
      const [won2, played2] = await rps.getPlayerStats(await player2.getAddress());
      expect(won1).to.equal(1n);
      expect(played1).to.equal(1n);
      expect(won2).to.equal(0n);
      expect(played2).to.equal(1n);
    });

    it("Game ends in a tie (Rock vs Rock)", async function () {
      const txCreate = await rps.connect(player1).createGame({ value: WAGER_AMOUNT });
      const receiptCreate = await txCreate.wait() as ContractTransactionReceipt;
      const event = rps.interface.parseLog(receiptCreate.logs[0]);
      const gameId = event?.args.gameId as bigint;

      const txJoin = await rps.connect(player2).joinGame(gameId, { value: WAGER_AMOUNT });
      await txJoin.wait();

      const txMove1 = await rps.connect(player1).makeMove(gameId, ROCK);
      await txMove1.wait();
      const txMove2 = await rps.connect(player2).makeMove(gameId, ROCK);
      await txMove2.wait();

      const player1BalanceBefore = await ethers.provider.getBalance(await player1.getAddress());
      const player2BalanceBefore = await ethers.provider.getBalance(await player2.getAddress());

      await expect(txMove2)
        .to.emit(rps, "GameResolved")
        .withArgs(gameId, ethers.ZeroAddress, 0, ROCK, ROCK);

      const player1BalanceAfter = await ethers.provider.getBalance(await player1.getAddress());
      const player2BalanceAfter = await ethers.provider.getBalance(await player2.getAddress());

      expect(player1BalanceAfter).to.be.closeTo(
        player1BalanceBefore + WAGER_AMOUNT,
        ethers.parseEther("0.01")
      );
      expect(player2BalanceAfter).to.be.closeTo(
        player2BalanceBefore + WAGER_AMOUNT,
        ethers.parseEther("0.01")
      );
    });

    it("Reverts if invalid move is made", async function () {
      const txCreate = await rps.connect(player1).createGame({ value: WAGER_AMOUNT });
      const receiptCreate = await txCreate.wait() as ContractTransactionReceipt;
      const event = rps.interface.parseLog(receiptCreate.logs[0]);
      const gameId = event?.args.gameId as bigint;
    
      const txJoin = await rps.connect(player2).joinGame(gameId, { value: WAGER_AMOUNT });
      await txJoin.wait();
    
      try {
        const txMove = await rps.connect(player1).makeMove(gameId, 4);
        await txMove.wait();
        throw new Error("Transaction should have reverted");
      } catch (error) {
        console.log("Revert error:", error);
        expect((error as Error).message).to.include("Invalid move");
      }
    });

    it("Reverts if wager amount doesn't match when joining", async function () {
      const txCreate = await rps.connect(player1).createGame({ value: WAGER_AMOUNT });
      const receiptCreate = await txCreate.wait() as ContractTransactionReceipt;
      const event = rps.interface.parseLog(receiptCreate.logs[0]);
      const gameId = event?.args.gameId as bigint;

      await expect(
        rps.connect(player2).joinGame(gameId, { value: ethers.parseEther("0.005") })
      ).to.be.revertedWith("Must match wager amount");
    });

    it("Reverts if player tries to play against themselves", async function () {
      const txCreate = await rps.connect(player1).createGame({ value: WAGER_AMOUNT });
      const receiptCreate = await txCreate.wait() as ContractTransactionReceipt;
      const event = rps.interface.parseLog(receiptCreate.logs[0]);
      const gameId = event?.args.gameId as bigint;

      await expect(
        rps.connect(player1).joinGame(gameId, { value: WAGER_AMOUNT })
      ).to.be.revertedWith("Cannot play against yourself");
    });
  });
});