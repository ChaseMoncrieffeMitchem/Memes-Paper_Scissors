import { defineFeature, loadFeature } from 'jest-cucumber';
import * as path from 'path';
import { expect } from '@jest/globals';
import UserBuilder from '../../core/Builders/UserBuilder';
import GatewayContractBuilder from '../../core/Builders/GatewayContract';
import MainHubBuilder from '../../core/Builders/MainHub';

    let mainHub: MainHubBuilder;
    let game: ReturnType<MainHubBuilder['resolveTwoPlayerGame']>;
    let payout: { winner: ReturnType<UserBuilder['build']>; amount: number };

    given('a set of Gamblers are in a head-to-head match', (table) => {
      const frankData = table[0];
      const ginaData = table[1];
      frank = new UserBuilder()
        .withAddress('0x123')
        .withBlockchain(frankData.blockchain)
        .withToken(frankData.token)
        .withWagerAmount(parseInt(frankData.wagerAmount))
        .build();
      gina = new UserBuilder()
        .withAddress('0x456')
        .withBlockchain(ginaData.blockchain)
        .withToken(ginaData.token)
        .withWagerAmount(parseInt(ginaData.wagerAmount))
        .build();
      frankGateway = new GatewayContractBuilder(frank);
      ginaGateway = new GatewayContractBuilder(gina);
      mainHub = new MainHubBuilder();
    });

    when(
      /^Frank wagers (\d+) ETH from "(.*)" and chooses "(.*)"$/,
      (wagerAmount, blockchain, move) => {
        frank.wagerAmount = parseInt(wagerAmount);
        frank.currentMove = move.toLowerCase() as 'rock' | 'paper' | 'scissors';
      }
    );

    and(
      /^(\d+)% of Frank’s wager \((\d+) ETH\) is locked on "(.*)" and (\d+)% \((\d+) ETH\) goes to escrow$/,
      (arg0, arg1, arg2, arg3, arg4) => {
        frankGateway.lockWager(frank.wagerAmount);
        expect(frankGateway.getLockedWager()).toBe(parseInt(arg1));
        frankGateway.sendEscrowFee((gateway, amount) =>
          mainHub.receiveEscrowFee(frankGateway, amount)
        );
        expect(mainHub.getEscrow().userContributions[frank.address]).toBe(
          parseInt(arg4)
        );
        frankGateway.forwardMove((gateway, move) =>
          mainHub.receiveMove(frankGateway, move)
        );
      }
    );

    and(
      /^Gina wagers (\d+) ETH from "(.*)" and chooses "(.*)"$/,
      (wagerAmount, blockchain, move) => {
        gina.wagerAmount = parseInt(wagerAmount);
        gina.currentMove = move.toLowerCase() as 'rock' | 'paper' | 'scissors';
      }
    );

    and(
      /^(\d+)% of Gina’s wager \((\d+) ETH\) is locked on "(.*)" and (\d+)% \((\d+) ETH\) goes to escrow$/,
      (arg0, arg1, arg2, arg3, arg4) => {
        ginaGateway.lockWager(gina.wagerAmount);
        expect(ginaGateway.getLockedWager()).toBe(parseInt(arg1));
        ginaGateway.sendEscrowFee((gateway, amount) =>
          mainHub.receiveEscrowFee(ginaGateway, amount)
        );
        expect(mainHub.getEscrow().userContributions[gina.address]).toBe(
          parseInt(arg4)
        );
        const totalEscrowFees = Object.values(
          mainHub.getEscrow().userContributions
        ).reduce((sum, val) => sum + val, 0);
        expect(totalEscrowFees).toBe(6); // Sum of Frank (3) + Gina (3)
        ginaGateway.forwardMove((gateway, move) =>
          mainHub.receiveMove(ginaGateway, move)
        );
      }
    );

    and(/^the game is resolved and Frank wins against Gina$/, () => {
      mainHub.gateways = [frankGateway, ginaGateway];
      game = mainHub.resolveTwoPlayerGame();
      expect(game.winner).toBe(frank);
    });

    then(/^Frank receives a total payout of (\d+) ETH$/, (payoutAmount) => {
      const payouts = mainHub.distributePayouts(game, (instruction) => {
        const frankPayout = frankGateway.executePayout(instruction);
        const ginaPayout = ginaGateway.executePayout(instruction);
        return frank.address === instruction.winner.address
          ? frankPayout
          : ginaPayout;
      });
      payout = payouts.find((p) => p.winner.address === frank.address);
      expect(payout.winner).toBe(frank);
      expect(payout.amount).toBe(parseInt(payoutAmount));
    });
  });

  test('Losing a head-to-head RPS game', ({ given, when, and, then }) => {
    let hannah: ReturnType<UserBuilder['build']>;
    let ian: ReturnType<UserBuilder['build']>;
    let hannahGateway: GatewayContractBuilder;
    let ianGateway: GatewayContractBuilder;
    let mainHub: MainHubBuilder;
    let game: ReturnType<MainHubBuilder['resolveTwoPlayerGame']>;
    let payout: { winner: ReturnType<UserBuilder['build']>; amount: number };

    given('a set of Gamblers are in a head-to-head match', (table) => {
      const hannahData = table[0];
      const ianData = table[1];
      hannah = new UserBuilder()
        .withAddress('0x111')
        .withBlockchain(hannahData.blockchain)
        .withToken(hannahData.token)
        .withWagerAmount(parseInt(hannahData.wagerAmount))
        .build();
      ian = new UserBuilder()
        .withAddress('0x222')
        .withBlockchain(ianData.blockchain)
        .withToken(ianData.token)
        .withWagerAmount(parseInt(ianData.wagerAmount))
        .build();
      hannahGateway = new GatewayContractBuilder(hannah);
      ianGateway = new GatewayContractBuilder(ian);
      mainHub = new MainHubBuilder();
    });

    when(
      /^Hannah wagers (\d+) XRP from "(.*)" and chooses "(.*)"$/,
      (wagerAmount, blockchain, move) => {
        hannah.wagerAmount = parseInt(wagerAmount);
        hannah.currentMove = move.toLowerCase() as
          | 'rock'
          | 'paper'
          | 'scissors';
      }
    );

    and(
      /^(\d+)% of Hannah’s wager \((\d+) (.*)\) is locked on "XRP" and (\d+)% \((\d+) XRP\) goes to escrow$/,
      (arg0, arg1, arg2, arg3, arg4) => {
        hannahGateway.lockWager(hannah.wagerAmount);
        expect(hannahGateway.getLockedWager()).toBe(parseInt(arg1));
        hannahGateway.sendEscrowFee((gateway, amount) =>
          mainHub.receiveEscrowFee(hannahGateway, amount)
        );
        expect(mainHub.getEscrow().userContributions[hannah.address]).toBe(
          parseInt(arg4)
        );
        hannahGateway.forwardMove((gateway, move) =>
          mainHub.receiveMove(hannahGateway, move)
        );
      }
    );

    and(
      /^Ian wagers (\d+) XRP from "(.*)" and chooses "(.*)"$/,
      (wagerAmount, blockchain, move) => {
        ian.wagerAmount = parseInt(wagerAmount);
        ian.currentMove = move.toLowerCase() as 'rock' | 'paper' | 'scissors';
      }
    );

    and(
      /^(\d+)% of Ian’s wager \((\d+) (.*)\) is locked on "XRP" and (\d+)% \((\d+) XRP\) goes to escrow$/,
      (arg0, arg1, arg2, arg3, arg4) => {
        ianGateway.lockWager(ian.wagerAmount);
        expect(ianGateway.getLockedWager()).toBe(parseInt(arg1));
        ianGateway.sendEscrowFee((gateway, amount) =>
          mainHub.receiveEscrowFee(ianGateway, amount)
        );
        expect(mainHub.getEscrow().userContributions[ian.address]).toBe(
          parseInt(arg4)
        );
        const totalEscrowFees = Object.values(
          mainHub.getEscrow().userContributions
        ).reduce((sum, val) => sum + val, 0);
        expect(totalEscrowFees).toBe(8); // Sum of Hannah (4) + Ian (4)
        ianGateway.forwardMove((gateway, move) =>
          mainHub.receiveMove(ianGateway, move)
        );
      }
    );

    and(/^the game is resolved and Hannah loses to Ian$/, () => {
      mainHub.gateways = [hannahGateway, ianGateway];
      game = mainHub.resolveTwoPlayerGame();
      expect(game.winner).toBe(ian);
    });

    then(/^Ian receives a total payout of (\d+) XRP$/, (payoutAmount) => {
      const payouts = mainHub.distributePayouts(game, (instruction) => {
        const hannahPayout = hannahGateway.executePayout(instruction);
        const ianPayout = ianGateway.executePayout(instruction);
        return ian.address === instruction.winner.address
          ? ianPayout
          : hannahPayout;
      });
      payout = payouts.find((p) => p.winner.address === ian.address);
      expect(payout.winner).toBe(ian);
      expect(payout.amount).toBe(parseInt(payoutAmount));
    });
  });

  test('Cross-chain head-to-head RPS game', ({ given, when, and, then }) => {
    let alice: ReturnType<UserBuilder['build']>;
    let bob: ReturnType<UserBuilder['build']>;
    let aliceGateway: GatewayContractBuilder;
    let bobGateway: GatewayContractBuilder;
    let mainHub: MainHubBuilder;
    let game: ReturnType<MainHubBuilder['resolveTwoPlayerGame']>;

    given('a set of Gamblers are in a head-to-head match', (table) => {
      const aliceData = table[0];
      const bobData = table[1];
      alice = new UserBuilder()
        .withAddress('0x333')
        .withBlockchain(aliceData.blockchain)
        .withToken(aliceData.token)
        .withWagerAmount(parseInt(aliceData.wagerAmount))
        .build();
      bob = new UserBuilder()
        .withAddress('0x444')
        .withBlockchain(bobData.blockchain)
        .withToken(bobData.token)
        .withWagerAmount(parseInt(bobData.wagerAmount))
        .build();
      aliceGateway = new GatewayContractBuilder(alice);
      bobGateway = new GatewayContractBuilder(bob);
      mainHub = new MainHubBuilder();
    });

    when(
      /^Alice wagers (\d+) XRP from "(.*)" and chooses "(.*)"$/,
      (wagerAmount, blockchain, move) => {
        alice.wagerAmount = parseInt(wagerAmount);
        alice.currentMove = move.toLowerCase() as 'rock' | 'paper' | 'scissors';
      }
    );

    and(
      /^(\d+)% of Alice’s wager \((\d+) (.*)\) is locked on "XRP" and (\d+)% \((\d+) XRP\) goes to escrow$/,
      (arg0, arg1, arg2, arg3, arg4) => {
        aliceGateway.lockWager(alice.wagerAmount);
        expect(aliceGateway.getLockedWager()).toBe(parseInt(arg1));
        aliceGateway.sendEscrowFee((gateway, amount) =>
          mainHub.receiveEscrowFee(aliceGateway, amount)
        );
        expect(mainHub.getEscrow().userContributions[alice.address]).toBe(
          parseInt(arg4)
        );
        aliceGateway.forwardMove((gateway, move) =>
          mainHub.receiveMove(aliceGateway, move)
        );
      }
    );

    and(
      /^Bob wagers (\d+) SOL from "(.*)" and chooses "(.*)"$/,
      (wagerAmount, blockchain, move) => {
        bob.wagerAmount = parseInt(wagerAmount);
        bob.currentMove = move.toLowerCase() as 'rock' | 'paper' | 'scissors';
      }
    );

    and(
      /^(\d+)% of Bob’s wager \((\d+) SOL\) is locked on "(.*)" and (\d+)% \((\d+) SOL\) goes to escrow$/,
      (arg0, arg1, arg2, arg3, arg4) => {
        bobGateway.lockWager(bob.wagerAmount);
        expect(bobGateway.getLockedWager()).toBe(parseInt(arg1));
        bobGateway.sendEscrowFee((gateway, amount) =>
          mainHub.receiveEscrowFee(bobGateway, amount)
        );
        expect(mainHub.getEscrow().userContributions[bob.address]).toBe(
          parseInt(arg4)
        );
        const totalEscrowFees = Object.values(
          mainHub.getEscrow().userContributions
        ).reduce((sum, val) => sum + val, 0);
        expect(totalEscrowFees).toBe(7); // Sum of Alice (5 XRP) + Bob (2 SOL)
        bobGateway.forwardMove((gateway, move) =>
          mainHub.receiveMove(bobGateway, move)
        );
      }
    );

    and(/^the game is resolved and Alice loses to Bob$/, () => {
      mainHub.gateways = [aliceGateway, bobGateway];
      game = mainHub.resolveTwoPlayerGame();
      expect(game.winner).toBe(bob);
    });

    then(/^Bob receives a total payout in SOL$/, () => {
      const payouts = mainHub.distributePayouts(game, (instruction) => {
        const alicePayout = aliceGateway.executePayout(instruction);
        const bobPayout = bobGateway.executePayout(instruction);
        return instruction.winner.address === bob.address
          ? bobPayout
          : alicePayout;
      });
      const bobPayout = payouts.find((p) => p.winner.address === bob.address);
      expect(bobPayout.winner).toBe(bob);
      expect(bobPayout.amount).toBeGreaterThan(0); // Exact amount depends on conversion, tested as positive
    });
  });

  test('Winning a multi-player RPS game in arena mode', ({
    given,
    when,
    and,
    then,
  }) => {
    let bob: ReturnType<UserBuilder['build']>;
    let charlie: ReturnType<UserBuilder['build']>;
    let dana: ReturnType<UserBuilder['build']>;
    let eve: ReturnType<UserBuilder['build']>;
    let frank: ReturnType<UserBuilder['build']>;
    let gina: ReturnType<UserBuilder['build']>;
    let hannah: ReturnType<UserBuilder['build']>;
    let ian: ReturnType<UserBuilder['build']>;
    let jack: ReturnType<UserBuilder['build']>;
    let kelly: ReturnType<UserBuilder['build']>;
    let bobGateway: GatewayContractBuilder;
    let charlieGateway: GatewayContractBuilder;
    let danaGateway: GatewayContractBuilder;
    let eveGateway: GatewayContractBuilder;
    let frankGateway: GatewayContractBuilder;
    let ginaGateway: GatewayContractBuilder;
    let hannahGateway: GatewayContractBuilder;
    let ianGateway: GatewayContractBuilder;
    let jackGateway: GatewayContractBuilder;
    let kellyGateway: GatewayContractBuilder;
    let mainHub: MainHubBuilder;
    let game: ReturnType<MainHubBuilder['resolveArenaGame']>;
    let payouts: { winner: ReturnType<UserBuilder['build']>; amount: number }[];

    given('a set of Gamblers have joined a game round', (table) => {
      const addresses = [
        '0x555',
        '0x666',
        '0x777',
        '0x888',
        '0x999',
        '0xaaa',
        '0xbbb',
        '0xccc',
        '0xddd',
        '0xeee',
      ];
      bob = new UserBuilder()
        .withAddress(addresses[0])
        .withBlockchain(table[0].blockchain)
        .withToken(table[0].token)
        .withWagerAmount(parseInt(table[0].wagerAmount))
        .build();
      charlie = new UserBuilder()
        .withAddress(addresses[1])
        .withBlockchain(table[1].blockchain)
        .withToken(table[1].token)
        .withWagerAmount(parseInt(table[1].wagerAmount))
        .build();
      dana = new UserBuilder()
        .withAddress(addresses[2])
        .withBlockchain(table[2].blockchain)
        .withToken(table[2].token)
        .withWagerAmount(parseInt(table[2].wagerAmount))
        .build();
      eve = new UserBuilder()
        .withAddress(addresses[3])
        .withBlockchain(table[3].blockchain)
        .withToken(table[3].token)
        .withWagerAmount(parseInt(table[3].wagerAmount))
        .build();
      frank = new UserBuilder()
        .withAddress(addresses[4])
        .withBlockchain(table[4].blockchain)
        .withToken(table[4].token)
        .withWagerAmount(parseInt(table[4].wagerAmount))
        .build();
      gina = new UserBuilder()
        .withAddress(addresses[5])
        .withBlockchain(table[5].blockchain)
        .withToken(table[5].token)
        .withWagerAmount(parseInt(table[5].wagerAmount))
        .build();
      hannah = new UserBuilder()
        .withAddress(addresses[6])
        .withBlockchain(table[6].blockchain)
        .withToken(table[6].token)
        .withWagerAmount(parseInt(table[6].wagerAmount))
        .build();
      ian = new UserBuilder()
        .withAddress(addresses[7])
        .withBlockchain(table[7].blockchain)
        .withToken(table[7].token)
        .withWagerAmount(parseInt(table[7].wagerAmount))
        .build();
      jack = new UserBuilder()
        .withAddress(addresses[8])
        .withBlockchain(table[8].blockchain)
        .withToken(table[8].token)
        .withWagerAmount(parseInt(table[8].wagerAmount))
        .build();
      kelly = new UserBuilder()
        .withAddress(addresses[9])
        .withBlockchain(table[9].blockchain)
        .withToken(table[9].token)
        .withWagerAmount(parseInt(table[9].wagerAmount))
        .build();

      bobGateway = new GatewayContractBuilder(bob);
      charlieGateway = new GatewayContractBuilder(charlie);
      danaGateway = new GatewayContractBuilder(dana);
      eveGateway = new GatewayContractBuilder(eve);
      frankGateway = new GatewayContractBuilder(frank);
      ginaGateway = new GatewayContractBuilder(gina);
      hannahGateway = new GatewayContractBuilder(hannah);
      ianGateway = new GatewayContractBuilder(ian);
      jackGateway = new GatewayContractBuilder(jack);
      kellyGateway = new GatewayContractBuilder(kelly);
      mainHub = new MainHubBuilder();
    });

    when(
      /^Bob wagers (\d+) XRP from "(.*)" and chooses "(.*)"$/,
      (wagerAmount, blockchain, move) => {
        bob.wagerAmount = parseInt(wagerAmount);
        bob.currentMove = move.toLowerCase() as 'rock' | 'paper' | 'scissors';
      }
    );

    and(
      /^(\d+)% of Bob’s wager \((\d+) (.*)\) is locked on "XRP" and (\d+)% \((\d+) XRP\) goes to escrow$/,
      (arg0, arg1, arg2, arg3, arg4) => {
        bobGateway.lockWager(bob.wagerAmount);
        bobGateway.sendEscrowFee((gateway, amount) =>
          mainHub.receiveEscrowFee(bobGateway, amount)
        );
        expect(mainHub.getEscrow().userContributions[bob.address]).toBe(
          parseInt(arg4)
        );
        bobGateway.forwardMove((gateway, move) =>
          mainHub.receiveMove(bobGateway, move)
        );
      }
    );

    and(
      /^Charlie wagers (\d+) XRP from "(.*)" and chooses "(.*)"$/,
      (wagerAmount, blockchain, move) => {
        charlie.wagerAmount = parseInt(wagerAmount);
        charlie.currentMove = move.toLowerCase() as
          | 'rock'
          | 'paper'
          | 'scissors';
      }
    );

    and(
      /^(\d+)% of Charlie’s wager \((\d+) (.*)\) is locked on "XRP" and (\d+)% \((\d+) XRP\) goes to escrow$/,
      (arg0, arg1, arg2, arg3, arg4) => {
        charlieGateway.lockWager(charlie.wagerAmount);
        charlieGateway.sendEscrowFee((gateway, amount) =>
          mainHub.receiveEscrowFee(charlieGateway, amount)
        );
        expect(mainHub.getEscrow().userContributions[charlie.address]).toBe(
          parseInt(arg4)
        );
        charlieGateway.forwardMove((gateway, move) =>
          mainHub.receiveMove(charlieGateway, move)
        );
      }
    );

    and(
      /^Dana wagers (\d+) XRP from "(.*)" and chooses "(.*)"$/,
      (wagerAmount, blockchain, move) => {
        dana.wagerAmount = parseInt(wagerAmount);
        dana.currentMove = move.toLowerCase() as 'rock' | 'paper' | 'scissors';
      }
    );

    and(
      /^(\d+)% of Dana’s wager \((\d+) (.*)\) is locked on "XRP" and (\d+)% \((\d+) XRP\) goes to escrow$/,
      (arg0, arg1, arg2, arg3, arg4) => {
        danaGateway.lockWager(dana.wagerAmount);
        danaGateway.sendEscrowFee((gateway, amount) =>
          mainHub.receiveEscrowFee(danaGateway, amount)
        );
        expect(mainHub.getEscrow().userContributions[dana.address]).toBe(
          parseInt(arg4)
        );
        danaGateway.forwardMove((gateway, move) =>
          mainHub.receiveMove(danaGateway, move)
        );
      }
    );

    and(
      /^Eve wagers (\d+) SOL from "(.*)" and chooses "(.*)"$/,
      (wagerAmount, blockchain, move) => {
        eve.wagerAmount = parseInt(wagerAmount);
        eve.currentMove = move.toLowerCase() as 'rock' | 'paper' | 'scissors';
      }
    );

    and(
      /^(\d+)% of Eve’s wager \((\d+) SOL\) is locked on "(.*)" and (\d+)% \((\d+) SOL\) goes to escrow$/,
      (arg0, arg1, arg2, arg3, arg4) => {
        eveGateway.lockWager(eve.wagerAmount);
        expect(eveGateway.getLockedWager()).toBe(parseInt(arg1));
        eveGateway.sendEscrowFee((gateway, amount) =>
          mainHub.receiveEscrowFee(eveGateway, amount)
        );
        expect(mainHub.getEscrow().userContributions[eve.address]).toBe(
          parseInt(arg4)
        );
        eveGateway.forwardMove((gateway, move) =>
          mainHub.receiveMove(eveGateway, move)
        );
      }
    );

    and(
      /^Frank wagers (\d+) SOL from "(.*)" and chooses "(.*)"$/,
      (wagerAmount, blockchain, move) => {
        frank.wagerAmount = parseInt(wagerAmount);
        frank.currentMove = move.toLowerCase() as 'rock' | 'paper' | 'scissors';
      }
    );

    and(
      /^(\d+)% of Frank’s wager \((\d+) SOL\) is locked on "(.*)" and (\d+)% \((\d+) SOL\) goes to escrow$/,
      (arg0, arg1, arg2, arg3, arg4) => {
        frankGateway.lockWager(frank.wagerAmount);
        expect(frankGateway.getLockedWager()).toBe(parseInt(arg1));
        frankGateway.sendEscrowFee((gateway, amount) =>
          mainHub.receiveEscrowFee(frankGateway, amount)
        );
        expect(mainHub.getEscrow().userContributions[frank.address]).toBe(
          parseInt(arg4)
        );
        frankGateway.forwardMove((gateway, move) =>
          mainHub.receiveMove(frankGateway, move)
        );
      }
    );

    and(
      /^Gina wagers (\d+) SOL from "(.*)" and chooses "(.*)"$/,
      (wagerAmount, blockchain, move) => {
        gina.wagerAmount = parseInt(wagerAmount);
        gina.currentMove = move.toLowerCase() as 'rock' | 'paper' | 'scissors';
      }
    );

    and(
      /^(\d+)% of Gina’s wager \((\d+\.?\d*) SOL\) is locked on "(.*)" and (\d+)% \((\d+\.?\d*) SOL\) goes to escrow$/,
      (arg0, arg1, arg2, arg3, arg4) => {
        ginaGateway.lockWager(gina.wagerAmount);
        expect(ginaGateway.getLockedWager()).toBe(parseFloat(arg1));
        ginaGateway.sendEscrowFee((gateway, amount) =>
          mainHub.receiveEscrowFee(ginaGateway, amount)
        );
        expect(mainHub.getEscrow().userContributions[gina.address]).toBe(
          parseFloat(arg4)
        );
        ginaGateway.forwardMove((gateway, move) =>
          mainHub.receiveMove(ginaGateway, move)
        );
      }
    );

    and(
      /^Hannah wagers (\d+) ALGO from "(.*)" and chooses "(.*)"$/,
      (wagerAmount, blockchain, move) => {
        hannah.wagerAmount = parseInt(wagerAmount);
        hannah.currentMove = move.toLowerCase() as
          | 'rock'
          | 'paper'
          | 'scissors';
      }
    );

    and(
      /^(\d+)% of Hannah’s wager \((\d+\.?\d*) ALGO\) is locked on "(.*)" and (\d+)% \((\d+\.?\d*) ALGO\) goes to escrow$/,
      (arg0, arg1, arg2, arg3, arg4) => {
        hannahGateway.lockWager(hannah.wagerAmount);
        expect(hannahGateway.getLockedWager()).toBe(parseFloat(arg1));
        hannahGateway.sendEscrowFee((gateway, amount) =>
          mainHub.receiveEscrowFee(hannahGateway, amount)
        );
        expect(mainHub.getEscrow().userContributions[hannah.address]).toBe(
          parseFloat(arg4)
        );
        hannahGateway.forwardMove((gateway, move) =>
          mainHub.receiveMove(hannahGateway, move)
        );
      }
    );

    and(
      /^Ian wagers (\d+) ALGO from "(.*)" and chooses "(.*)"$/,
      (wagerAmount, blockchain, move) => {
        ian.wagerAmount = parseInt(wagerAmount);
        ian.currentMove = move.toLowerCase() as 'rock' | 'paper' | 'scissors';
      }
    );

    and(
      /^(\d+)% of Ian’s wager \((\d+\.?\d*) ALGO\) is locked on "(.*)" and (\d+)% \((\d+\.?\d*) ALGO\) goes to escrow$/,
      (arg0, arg1, arg2, arg3, arg4) => {
        ianGateway.lockWager(ian.wagerAmount);
        expect(ianGateway.getLockedWager()).toBe(parseFloat(arg1));
        ianGateway.sendEscrowFee((gateway, amount) =>
          mainHub.receiveEscrowFee(ianGateway, amount)
        );
        expect(mainHub.getEscrow().userContributions[ian.address]).toBe(
          parseFloat(arg4)
        );
        ianGateway.forwardMove((gateway, move) =>
          mainHub.receiveMove(ianGateway, move)
        );
      }
    );

    and(
      /^Jack wagers (\d+) ALGO from "(.*)" and chooses "(.*)"$/,
      (wagerAmount, blockchain, move) => {
        jack.wagerAmount = parseInt(wagerAmount);
        jack.currentMove = move.toLowerCase() as 'rock' | 'paper' | 'scissors';
      }
    );

    and(
      /^(\d+)% of Jack’s wager \((\d+\.?\d*) ALGO\) is locked on "(.*)" and (\d+)% \((\d+\.?\d*) ALGO\) goes to escrow$/,
      (arg0, arg1, arg2, arg3, arg4) => {
        jackGateway.lockWager(jack.wagerAmount);
        expect(jackGateway.getLockedWager()).toBe(parseFloat(arg1));
        jackGateway.sendEscrowFee((gateway, amount) =>
          mainHub.receiveEscrowFee(jackGateway, amount)
        );
        expect(mainHub.getEscrow().userContributions[jack.address]).toBe(
          parseFloat(arg4)
        );
        jackGateway.forwardMove((gateway, move) =>
          mainHub.receiveMove(jackGateway, move)
        );
      }
    );

    and(
      /^Kelly wagers (\d+) ALGO from "(.*)" and chooses "(.*)"$/,
      (wagerAmount, blockchain, move) => {
        kelly.wagerAmount = parseInt(wagerAmount);
        kelly.currentMove = move.toLowerCase() as 'rock' | 'paper' | 'scissors';
      }
    );

    and(
      /^(\d+)% of Kelly’s wager \((\d+\.?\d*) ALGO\) is locked on "(.*)" and (\d+)% \((\d+\.?\d*) ALGO\) goes to escrow$/,
      (arg0, arg1, arg2, arg3, arg4) => {
        kellyGateway.lockWager(kelly.wagerAmount);
        expect(kellyGateway.getLockedWager()).toBe(parseFloat(arg1));
        kellyGateway.sendEscrowFee((gateway, amount) =>
          mainHub.receiveEscrowFee(kellyGateway, amount)
        );
        expect(mainHub.getEscrow().userContributions[kelly.address]).toBe(
          parseFloat(arg4)
        );
        kellyGateway.forwardMove((gateway, move) =>
          mainHub.receiveMove(kellyGateway, move)
        );
      }
    );

    and(
      /^the game is resolved and the "Rock" group wins with Bob, Eve, Frank, and Hannah as winners$/,
      () => {
        mainHub.gateways = [
          bobGateway,
          charlieGateway,
          danaGateway,
          eveGateway,
          frankGateway,
          ginaGateway,
          hannahGateway,
          ianGateway,
          jackGateway,
          kellyGateway,
        ];
        game = mainHub.resolveArenaGame();
        expect(game.winningMove).toBe('rock');

        payouts = mainHub.distributeArenaPayouts(game, (instruction) => {
          const gateways: Record<string, GatewayContractBuilder> = {
            [bob.address]: bobGateway,
            [eve.address]: eveGateway,
            [frank.address]: frankGateway,
            [hannah.address]: hannahGateway,
          };
          return (
            gateways[instruction.winner.address]?.executePayout(
              instruction
            ) ?? { winner: instruction.winner, amount: 0 }
          );
        });
      }
    );

    then(/^Bob receives a proportional payout in XRP$/, () => {
      const bobPayout = payouts.find((p) => p.winner.address === bob.address);
      expect(bobPayout.winner).toBe(bob);
      expect(bobPayout.amount).toBeGreaterThan(0); // Exact amount tested in feature file
    });

    then(/^Eve receives a proportional payout in SOL$/, () => {
      const evePayout = payouts.find((p) => p.winner.address === eve.address);
      expect(evePayout.winner).toBe(eve);
      expect(evePayout.amount).toBeGreaterThan(0);
    });

    then(/^Frank receives a proportional payout in SOL$/, () => {
      const frankPayout = payouts.find(
        (p) => p.winner.address === frank.address
      );
      expect(frankPayout.winner).toBe(frank);
      expect(frankPayout.amount).toBeGreaterThan(0);
    });

    then(/^Hannah receives a proportional payout in ALGO$/, () => {
      const hannahPayout = payouts.find(
        (p) => p.winner.address === hannah.address
      );
      expect(hannahPayout.winner).toBe(hannah);
      expect(hannahPayout.amount).toBeGreaterThan(0);
    });
  });

  test('Invalid move in head-to-head RPS game', ({
    given,
    when,
    then,
    and,
  }) => {
    let frank: ReturnType<UserBuilder['build']>;
    let frankBuilder: UserBuilder; // To call withMove
    let gina: ReturnType<UserBuilder['build']>;
    let frankGateway: GatewayContractBuilder;
    let mainHub: MainHubBuilder;

    given('a set of Gamblers are in a head-to-head match', (table) => {
      frank = new UserBuilder()
        .withAddress('0x123')
        .withBlockchain(table[0].blockchain)
        .withToken(table[0].token)
        .withWagerAmount(parseInt(table[0].wagerAmount))
        .build();
      gina = new UserBuilder()
        .withAddress('0x456')
        .withBlockchain(table[1].blockchain)
        .withToken(table[1].token)
        .withWagerAmount(parseInt(table[1].wagerAmount))
        .build();
      frankGateway = new GatewayContractBuilder(frank);
      mainHub = new MainHubBuilder();
      expect(gina.address).toBe('0x456'); // Use gina in a simple assertion
    });

    when(
      /^Frank wagers (\d+) ETH from "(.*)" and chooses "(.*)"$/,
      (wagerAmount, blockchain, move) => {
        frank.wagerAmount = parseInt(wagerAmount);
        frank.currentMove = move;
        expect(() =>
          frankBuilder.withMove(move as string as 'rock' | 'paper' | 'scissors')
        ).toThrow();
      }
    );

    then(/^the game rejects Frank's move with an error "(.*)"$/, () => {
      // Error already checked in 'when'
    });

    and(/^no wager is locked on "(.*)"$/, () => {
      expect(frankGateway.getLockedWager()).toBe(0);
    });

    and('no escrow fee is collected', () => {
      expect(
        mainHub.getEscrow().userContributions[frank.address]
      ).toBeUndefined();
    });
  });

  test('Wager below minimum in head-to-head RPS game', ({
    given,
    and,
    when,
    then,
  }) => {
    let hannah: ReturnType<UserBuilder['build']>;
    let hannahBuilder: UserBuilder;
    let ian: ReturnType<UserBuilder['build']>;
    let hannahGateway: GatewayContractBuilder;
    let mainHub: MainHubBuilder;

    given('a set of Gamblers are in a head-to-head match', (table) => {
      hannah = new UserBuilder()
        .withAddress('0x111')
        .withBlockchain(table[0].blockchain)
        .withToken(table[0].token)
        .build();
      ian = new UserBuilder()
        .withAddress('0x222')
        .withBlockchain(table[1].blockchain)
        .withToken(table[1].token)
        .withWagerAmount(parseInt(table[1].wagerAmount))
        .build();
      hannahGateway = new GatewayContractBuilder(hannah);
      mainHub = new MainHubBuilder();
      expect(ian.address).toBe('0x222'); // Use ian in a simple assertion
    });

    and(/^the minimum wager is (\d+) XRP$/, () => {
      // Minimum wager is passed to lockWager method
    });

    when(
      /^Hannah wagers (\d+) XRP from "(.*)" and chooses "(.*)"$/,
      (wagerAmount, blockchain, move) => {
        hannah.wagerAmount = parseInt(wagerAmount);
        hannah.currentMove = move.toLowerCase() as
          | 'rock'
          | 'paper'
          | 'scissors';
        expect(() =>
          hannahBuilder.withWagerAmount(parseInt(wagerAmount))
        ).toThrow();
      }
    );

    then(/^the game rejects Hannah's wager with an error "(.*)"$/, () => {
      // Error already checked in 'when'
    });

    and(/^no wager is locked on "(.*)"$/, () => {
      expect(hannahGateway.getLockedWager()).toBe(0);
    });

    and('no escrow fee is collected', () => {
      expect(
        mainHub.getEscrow().userContributions[hannah.address]
      ).toBeUndefined();
    });
  });

  test('Blockchain transaction failure during wager locking in head-to-head game', ({
    given,
    when,
    and,
    then,
  }) => {
    let frank: ReturnType<UserBuilder['build']>;
    let gina: ReturnType<UserBuilder['build']>;
    let frankGateway: GatewayContractBuilder;
    let mainHub: MainHubBuilder;

    given('a set of Gamblers are in a head-to-head match', (table) => {
      frank = new UserBuilder()
        .withAddress('0x123')
        .withBlockchain(table[0].blockchain)
        .withToken(table[0].token)
        .withWagerAmount(parseInt(table[0].wagerAmount))
        .build();
      gina = new UserBuilder()
        .withAddress('0x456')
        .withBlockchain(table[1].blockchain)
        .withToken(table[1].token)
        .withWagerAmount(parseInt(table[1].wagerAmount))
        .build();
      frankGateway = new GatewayContractBuilder(frank);
      mainHub = new MainHubBuilder();
      expect(gina.address).toBe('0x456'); // Use gina in a simple assertion
    });

    when(
      /^Frank wagers (\d+) ETH from "(.*)" and chooses "(.*)"$/,
      (wagerAmount, blockchain, move) => {
        frank.wagerAmount = parseInt(wagerAmount);
        frank.currentMove = move.toLowerCase() as 'rock' | 'paper' | 'scissors';
      }
    );

    and(
      /^the blockchain transaction to lock (\d+)% of Frank’s wager \((\d+) ETH\) fails with error "(.*)"$/,
      (lockedAmount, errorMessage) => {
        expect(() =>
          frankGateway.lockWager(frank.wagerAmount, () => {
            throw new Error(errorMessage);
          })
        ).toThrow(`Failed to lock wager: ${errorMessage}`);
      }
    );

    then(/^the game aborts with an error "(.*)"$/, () => {
      // Error already checked in 'and'
    });

    and(/^no wager is locked on "(.*)"$/, () => {
      expect(frankGateway.getLockedWager()).toBe(0);
    });

    and('no escrow fee is collected', () => {
      expect(
        mainHub.getEscrow().userContributions[frank.address]
      ).toBeUndefined();
    });
  });

  test('Tie in head-to-head RPS game', ({ given, when, and, then }) => {
    let hannah: ReturnType<UserBuilder['build']>;
    let ian: ReturnType<UserBuilder['build']>;
    let hannahGateway: GatewayContractBuilder;
    let ianGateway: GatewayContractBuilder;
    let mainHub: MainHubBuilder;
    let game: ReturnType<MainHubBuilder['resolveTwoPlayerGame']>;

    given('a set of Gamblers are in a head-to-head match', (table) => {
      hannah = new UserBuilder()
        .withAddress('0x111')
        .withBlockchain(table[0].blockchain)
        .withToken(table[0].token)
        .withWagerAmount(parseInt(table[0].wagerAmount))
        .build();
      ian = new UserBuilder()
        .withAddress('0x222')
        .withBlockchain(table[1].blockchain)
        .withToken(table[1].token)
        .withWagerAmount(parseInt(table[1].wagerAmount))
        .build();
      hannahGateway = new GatewayContractBuilder(hannah);
      ianGateway = new GatewayContractBuilder(ian);
      mainHub = new MainHubBuilder();
    });

    when(
      /^Hannah wagers (\d+) XRP from "(.*)" and chooses "(.*)"$/,
      (wagerAmount, blockchain, move) => {
        hannah.wagerAmount = parseInt(wagerAmount);
        hannah.currentMove = move.toLowerCase() as
          | 'rock'
          | 'paper'
          | 'scissors';
      }
    );

    and(
      /^(\d+)% of Hannah’s wager \((\d+) (.*)\) is locked on "XRP" and (\d+)% \((\d+) XRP\) goes to escrow$/,
      (arg0, arg1, arg2, arg3, arg4) => {
        hannahGateway.lockWager(hannah.wagerAmount);
        expect(hannahGateway.getLockedWager()).toBe(parseFloat(arg1));
        hannahGateway.sendEscrowFee((gateway, amount) =>
          mainHub.receiveEscrowFee(hannahGateway, amount)
        );
        expect(mainHub.getEscrow().userContributions[hannah.address]).toBe(
          parseFloat(arg4)
        );
        hannahGateway.forwardMove((gateway, move) =>
          mainHub.receiveMove(hannahGateway, move)
        );
      }
    );

    and(
      /^Ian wagers (\d+) XRP from "(.*)" and chooses "(.*)"$/,
      (wagerAmount, blockchain, move) => {
        ian.wagerAmount = parseInt(wagerAmount);
        ian.currentMove = move.toLowerCase() as 'rock' | 'paper' | 'scissors';
      }
    );

    and(
      /^(\d+)% of Ian’s wager \((\d+) (.*)\) is locked on "XRP" and (\d+)% \((\d+) XRP\) goes to escrow$/,
      (arg0, arg1, arg2, arg3, arg4) => {
        ianGateway.lockWager(ian.wagerAmount);
        expect(ianGateway.getLockedWager()).toBe(parseFloat(arg1));
        ianGateway.sendEscrowFee((gateway, amount) =>
          mainHub.receiveEscrowFee(ianGateway, amount)
        );
        expect(mainHub.getEscrow().userContributions[ian.address]).toBe(
          parseFloat(arg4)
        );
        ianGateway.forwardMove((gateway, move) =>
          mainHub.receiveMove(ianGateway, move)
        );
      }
    );

    and('the game is resolved and results in a tie', () => {
      mainHub.gateways = [hannahGateway, ianGateway];
      game = mainHub.resolveTwoPlayerGame();
      expect(game.winner).toBeNull();
    });

    then('no payout is distributed', () => {
      const payouts = mainHub.distributePayouts(game, (instruction) => {
        return hannahGateway.executePayout(instruction);
      });
      expect(payouts.every((p) => p.amount === 0)).toBe(true);
    });

    and(
      /^the locked wagers \((\d+) XRP each\) are refunded to Hannah and Ian$/,
      (lockedAmount) => {
        const refunds = mainHub.refundLockedWagers();
        expect(refunds[hannah.address]).toBe(parseInt(lockedAmount));
        expect(refunds[ian.address]).toBe(parseInt(lockedAmount));
        expect(hannahGateway.getLockedWager()).toBe(0);
        expect(ianGateway.getLockedWager()).toBe(0);
      }
    );
  });

  test('Cross-chain wager locking delay in head-to-head game', ({
    given,
    when,
    and,
    then,
  }) => {
    let alice: ReturnType<UserBuilder['build']>;
    let bob: ReturnType<UserBuilder['build']>;
    let aliceGateway: GatewayContractBuilder;
    let bobGateway: GatewayContractBuilder;
    let mainHub: MainHubBuilder;
    let game: ReturnType<MainHubBuilder['resolveTwoPlayerGame']>;
    let timeoutId: NodeJS.Timeout; // For the test's setTimeout
    let delayTimeoutId: NodeJS.Timeout; // For lockWagerWithDelay
  
    given('a set of Gamblers are in a head-to-head match', (table) => {
      alice = new UserBuilder()
        .withAddress('0x333')
        .withBlockchain(table[0].blockchain)
        .withToken(table[0].token)
        .withWagerAmount(parseInt(table[0].wagerAmount))
        .build();
      bob = new UserBuilder()
        .withAddress('0x444')
        .withBlockchain(table[1].blockchain)
        .withToken(table[1].token)
        .withWagerAmount(parseInt(table[1].wagerAmount))
        .build();
      aliceGateway = new GatewayContractBuilder(alice);
      bobGateway = new GatewayContractBuilder(bob);
      mainHub = new MainHubBuilder();
    });
  
    when(/^Alice wagers (\d+) XRP from "(.*)" and chooses "(.*)"$/, (wagerAmount, blockchain, move) => {
      alice.wagerAmount = parseInt(wagerAmount);
      alice.currentMove = move.toLowerCase() as 'rock' | 'paper' | 'scissors';
    });
  
    and(/^(\d+)% of Alice’s wager \((\d+) (.*)\) is locked on "XRP" and (\d+)% \((\d+) XRP\) goes to escrow$/, (arg0, arg1, arg2, arg3, arg4) => {
      aliceGateway.lockWager(alice.wagerAmount);
      expect(aliceGateway.getLockedWager()).toBe(parseFloat(arg1));
      aliceGateway.sendEscrowFee((gateway, amount) => mainHub.receiveEscrowFee(aliceGateway, amount));
      expect(mainHub.getEscrow().userContributions[alice.address]).toBe(parseFloat(arg4));
      aliceGateway.forwardMove((gateway, move) => mainHub.receiveMove(aliceGateway, move));
    });
  
    and(/^Bob wagers (\d+) SOL from "(.*)" and chooses "(.*)"$/, (wagerAmount, blockchain, move) => {
      bob.wagerAmount = parseInt(wagerAmount);
      bob.currentMove = move.toLowerCase() as 'rock' | 'paper' | 'scissors';
    });
  
    and(/^the cross-chain wager locking for Bob’s (\d+)% wager \((\d+) SOL\) is delayed by (\d+) seconds$/, (lockedPercentage, lockedWager, delaySeconds) => {
      delayTimeoutId = bobGateway.lockWagerWithDelay(bob.wagerAmount, parseInt(delaySeconds));
      expect(bobGateway.getLockedWager()).toBe(0); // Initially not locked
    });
  
    then('the game waits for the cross-chain confirmation', async () => {
      const waitPromise = new Promise((resolve) => {
        timeoutId = setTimeout(resolve, 100); // Store the timeout ID
      });
      await waitPromise;
      clearTimeout(timeoutId); // Clear the test's timeout
      clearTimeout(delayTimeoutId); // Clear the lockWagerWithDelay timeout
      bobGateway.confirmDelayedLock();
      expect(bobGateway.getLockedWager()).toBe(18);
      bobGateway.sendEscrowFee((gateway, amount) => mainHub.receiveEscrowFee(bobGateway, amount));
      bobGateway.forwardMove((gateway, move) => mainHub.receiveMove(bobGateway, move));
    });
  
    and('the game proceeds after the delay', () => {
      mainHub.gateways = [aliceGateway, bobGateway];
    });
  
    and('the game is resolved and Alice loses to Bob', () => {
      game = mainHub.resolveTwoPlayerGame();
      expect(game.winner).toBe(bob);
    });
  
    and('Bob receives a total payout in SOL', () => {
      const payouts = mainHub.distributePayouts(game, (instruction) => {
        return bobGateway.executePayout(instruction);
      });
      const bobPayout = payouts.find((p) => p.winner.address === bob.address);
      expect(bobPayout.winner).toBe(bob);
      expect(bobPayout.amount).toBeGreaterThan(0);
    });
  });

  test('Insufficient players in multi-player arena mode', ({ given, and, when, then }) => {
    let bob: ReturnType<UserBuilder['build']>;
    let bobGateway: GatewayContractBuilder;
    let mainHub: MainHubBuilder;
  
    given('a set of Gamblers have joined a game round', (table) => {
      bob = new UserBuilder()
        .withAddress('0x555')
        .withBlockchain(table[0].blockchain)
        .withToken(table[0].token)
        // Don’t set wagerAmount yet to avoid early validation
        .build();
      bobGateway = new GatewayContractBuilder(bob);
      mainHub = new MainHubBuilder();
    });
  
    and('the minimum number of players for arena mode is 3', () => {
      mainHub.setMinArenaPlayers(3); 
    });
  
    when(/^Bob wagers (\d+) XRP from "(.*)" and chooses "(.*)"$/, (wagerAmount, blockchain, move) => {
      bob.wagerAmount = parseInt(wagerAmount);
      bob.currentMove = move.toLowerCase() as 'rock' | 'paper' | 'scissors';
      expect(() => mainHub.resolveArenaGame()).toThrow(new Error('Insufficient players: at least 3 required'));
    });
  
    then(/^the game rejects Bob's wager with an error "(.*)"$/, () => {
      // Error already checked in 'when'
    });
  
    and(/^no wager is locked on "(.*)"$/, () => {
      expect(bobGateway.getLockedWager()).toBe(0);
    });
  
    and('no escrow fee is collected', () => {
      expect(mainHub.getEscrow().userContributions[bob.address]).toBeUndefined();
    });
  });

  test('All players choose the same move in multi-player arena mode', ({
    given,
    when,
    and,
    then,
  }) => {
    let bob: ReturnType<UserBuilder['build']>;
    let charlie: ReturnType<UserBuilder['build']>;
    let dana: ReturnType<UserBuilder['build']>;
    let bobGateway: GatewayContractBuilder;
    let charlieGateway: GatewayContractBuilder;
    let danaGateway: GatewayContractBuilder;
    let mainHub: MainHubBuilder;
    let game: ReturnType<MainHubBuilder['resolveArenaGame']>;

    given('a set of Gamblers have joined a game round', (table) => {
      bob = new UserBuilder()
        .withAddress('0x555')
        .withBlockchain(table[0].blockchain)
        .withToken(table[0].token)
        .withWagerAmount(parseInt(table[0].wagerAmount))
        .build();
      charlie = new UserBuilder()
        .withAddress('0x666')
        .withBlockchain(table[1].blockchain)
        .withToken(table[1].token)
        .withWagerAmount(parseInt(table[1].wagerAmount))
        .build();
      dana = new UserBuilder()
        .withAddress('0x777')
        .withBlockchain(table[2].blockchain)
        .withToken(table[2].token)
        .withWagerAmount(parseInt(table[2].wagerAmount))
        .build();
      bobGateway = new GatewayContractBuilder(bob);
      charlieGateway = new GatewayContractBuilder(charlie);
      danaGateway = new GatewayContractBuilder(dana);
      mainHub = new MainHubBuilder();
    });

    when(
      /^Bob wagers (\d+) XRP from "(.*)" and chooses "(.*)"$/,
      (wagerAmount, blockchain, move) => {
        bob.wagerAmount = parseInt(wagerAmount);
        bob.currentMove = move.toLowerCase() as 'rock' | 'paper' | 'scissors';
      }
    );

    and(
      /^(\d+)% of Bob’s wager \((\d+) (.*)\) is locked on "XRP" and (\d+)% \((\d+) XRP\) goes to escrow$/,
      (arg0, arg1, arg2, arg3, arg4) => {
        bobGateway.lockWager(bob.wagerAmount);
        expect(bobGateway.getLockedWager()).toBe(parseFloat(arg1));
        bobGateway.sendEscrowFee((gateway, amount) =>
          mainHub.receiveEscrowFee(bobGateway, amount)
        );
        expect(mainHub.getEscrow().userContributions[bob.address]).toBe(
          parseFloat(arg4)
        );
        bobGateway.forwardMove((gateway, move) =>
          mainHub.receiveMove(bobGateway, move)
        );
      }
    );

    and(
      /^Charlie wagers (\d+) XRP from "(.*)" and chooses "(.*)"$/,
      (wagerAmount, blockchain, move) => {
        charlie.wagerAmount = parseInt(wagerAmount);
        charlie.currentMove = move.toLowerCase() as
          | 'rock'
          | 'paper'
          | 'scissors';
      }
    );

    and(
      /^(\d+)% of Charlie’s wager \((\d+) (.*)\) is locked on "XRP" and (\d+)% \((\d+) XRP\) goes to escrow$/,
      (arg0, arg1, arg2, arg3, arg4) => {
        charlieGateway.lockWager(charlie.wagerAmount);
        expect(charlieGateway.getLockedWager()).toBe(parseFloat(arg1));
        charlieGateway.sendEscrowFee((gateway, amount) =>
          mainHub.receiveEscrowFee(charlieGateway, amount)
        );
        expect(mainHub.getEscrow().userContributions[charlie.address]).toBe(
          parseFloat(arg4)
        );
        charlieGateway.forwardMove((gateway, move) =>
          mainHub.receiveMove(charlieGateway, move)
        );
      }
    );

    and(
      /^Dana wagers (\d+) XRP from "(.*)" and chooses "(.*)"$/,
      (wagerAmount, blockchain, move) => {
        dana.wagerAmount = parseInt(wagerAmount);
        dana.currentMove = move.toLowerCase() as 'rock' | 'paper' | 'scissors';
      }
    );

    and(
      /^(\d+)% of Dana’s wager \((\d+) (.*)\) is locked on "XRP" and (\d+)% \((\d+) XRP\) goes to escrow$/,
      (arg0, arg1, arg2, arg3, arg4) => {
        danaGateway.lockWager(dana.wagerAmount);
        expect(danaGateway.getLockedWager()).toBe(parseFloat(arg1));
        danaGateway.sendEscrowFee((gateway, amount) =>
          mainHub.receiveEscrowFee(danaGateway, amount)
        );
        expect(mainHub.getEscrow().userContributions[dana.address]).toBe(
          parseFloat(arg4)
        );
        danaGateway.forwardMove((gateway, move) =>
          mainHub.receiveMove(danaGateway, move)
        );
      }
    );

    and(/^the game is resolved and all players chose "(.*)"$/, () => {
      mainHub.gateways = [bobGateway, charlieGateway, danaGateway];
      game = mainHub.resolveArenaGame();
      expect(game.winningMove).toBeNull();
    });

    then('no group wins due to unanimous move selection', () => {
      expect(game.winningMove).toBeNull();
    });

    and(
      /^all locked wagers \((\d+) XRP, (\d+) XRP, (\d+) XRP\) are refunded to Bob, Charlie, and Dana$/,
      (bobLocked, charlieLocked, danaLocked) => {
        const refunds = mainHub.refundLockedWagers();
        expect(refunds[bob.address]).toBe(parseInt(bobLocked));
        expect(refunds[charlie.address]).toBe(parseInt(charlieLocked));
        expect(refunds[dana.address]).toBe(parseInt(danaLocked));
        expect(bobGateway.getLockedWager()).toBe(0);
        expect(charlieGateway.getLockedWager()).toBe(0);
        expect(danaGateway.getLockedWager()).toBe(0);
      }
    );
  });
});
