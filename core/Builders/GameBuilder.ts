import GatewayContractBuilder from "./GatewayContract";

export class GameBuilder {
    private players: GatewayContractBuilder[] = [];
    private moves: Map<string, "rock" | "paper" | "scissors"> = new Map();
    private minArenaPlayers = 3;
  
    /** Adds a player to the game. */
    addPlayer(player: GatewayContractBuilder) {
      this.players.push(player);
      return this;
    }
  
    /** Sets a player's move. */
    setMove(playerAddress: string, move: "rock" | "paper" | "scissors") {
      this.moves.set(playerAddress, move);
      return this;
    }
  
    /** Resolves a two-player game and returns the winner and stake amount. */
    resolveTwoPlayerGame() {
      if (this.players.length !== 2) {
        throw new Error("Two-player game requires exactly 2 players");
      }
      const player1 = this.players[0].user;
      const player2 = this.players[1].user;
      const move1 = this.moves.get(player1.address);
      const move2 = this.moves.get(player2.address);
  
      if (!move1 || !move2) {
        throw new Error("Missing moves for one or both players");
      }
  
      const winner = this.determineWinner(move1, move2);
      if (winner) {
        winner.gamesWon += 1;
      }
      player1.gamesPlayed += 1;
      player2.gamesPlayed += 1;
  
      return { winner, stakeAmount: player1.wagerAmount };
    }
  
    /** Resolves an arena game and returns the winning move and grouped players. */
    resolveArenaGame() {
      if (this.players.length < this.minArenaPlayers) {
        throw new Error(`Arena game requires at least ${this.minArenaPlayers} players`);
      }
  
      const moveGroups: Record<"rock" | "paper" | "scissors", { player: GatewayContractBuilder; wager: number }[]> = {
        rock: [],
        paper: [],
        scissors: []
      };
  
      // Group players by their moves
      this.players.forEach((player) => {
        const move = this.moves.get(player.user.address);
        if (move) {
          moveGroups[move].push({ player, wager: player.user.wagerAmount * 0.9 });
          player.user.gamesPlayed += 1;
        }
      });
  
      const groupSizes = {
        rock: moveGroups.rock.length,
        paper: moveGroups.paper.length,
        scissors: moveGroups.scissors.length
      };
      const totalPlayers = groupSizes.rock + groupSizes.paper + groupSizes.scissors;
  
      // Check for a tie (all players chose the same move)
      if (
        groupSizes.rock === totalPlayers ||
        groupSizes.paper === totalPlayers ||
        groupSizes.scissors === totalPlayers
      ) {
        return { winningMove: null, moveGroups };
      }
  
      // Determine the winning move (most popular)
      const maxSize = Math.max(groupSizes.rock, groupSizes.paper, groupSizes.scissors);
      const winningMove =
        groupSizes.rock === maxSize ? "rock" : groupSizes.paper === maxSize ? "paper" : "scissors";
  
      // Increment gamesWon for players in the winning group
      moveGroups[winningMove].forEach((entry) => (entry.player.user.gamesWon += 1));
  
      return { winningMove, moveGroups };
    }
  
    /** Determines the winner between two moves. Returns null for a tie. */
    private determineWinner(move1: "rock" | "paper" | "scissors", move2: "rock" | "paper" | "scissors") {
      if (move1 === move2) return null;
      if (
        (move1 === "rock" && move2 === "scissors") ||
        (move1 === "paper" && move2 === "rock") ||
        (move1 === "scissors" && move2 === "paper")
      ) {
        return this.players[0].user;
      }
      return this.players[1].user;
    }
  
    /** Builds and returns the game state. */
    build() {
      return {
        players: this.players,
        moves: this.moves
      };
    }
  }