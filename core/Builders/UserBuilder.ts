interface TokenMinWager {
    [key: string]: number;
  }
  
  const MIN_WAGERS: TokenMinWager = {
    ETH: 0.01,
    XRP: 10,
    SOL: 0.1,
    ALGO: 1,
    TRX: 100,
    SHIB: 100000,
    DOGE: 10,
    Xahau: 1,
    Bitcoin: 0.05,
    Cardano: 1,
    Algorand: 1,
    HBAR: 1,
    USD: 1,
    // Add more tokens as needed
  };
  
  class UserBuilder {
    private props: {
      address?: string;
      blockchain?: string;
      token?: string;
      wagerAmount?: number;
      gamesPlayed?: number;
      gamesWon?: number;
      currentMove?: "rock" | "paper" | "scissors";
      votedToken?: string;
      wagerTimestamp?: string;
    } = {};
  
    constructor() {
      this.props = { gamesPlayed: 0, gamesWon: 0 };
    }
  
    withAddress(address: string) {
      this.props.address = address;
      return this;
    }
  
    withBlockchain(blockchain: string) {
      this.props.blockchain = blockchain;
      return this;
    }
  
    withToken(token: string) {
      this.props.token = token;
      return this;
    }
  
    withWagerAmount(amount: number) {
      const token = this.props.token || "unknown"; // Default to "unknown" if token not set
      const minWager = MIN_WAGERS[token] || 0.01; // Fallback to 0.01 if token not in map
      if (amount < minWager) {
        throw new Error(`Wager must be at least ${minWager} ${token}`);
      }
      this.props.wagerAmount = amount;
      return this;
    }
  
  
    withMove(move: "rock" | "paper" | "scissors") {
      const validMoves: ("rock" | "paper" | "scissors")[] = ["rock", "paper", "scissors"];
      if (!validMoves.includes(move)) {
        throw new Error("Invalid choice selected: must be rock, paper, or scissors");
      }
      this.props.currentMove = move;
      return this;
    }
  
    // New method to set games played fluently
    withGamesPlayed(games: number) {
      this.props.gamesPlayed = games;
      return this;
    }
  
    incrementGamesPlayed(): UserBuilder {
      const newBuilder = new UserBuilder();
      Object.assign(newBuilder, this);
      newBuilder.props.gamesPlayed = (this.props.gamesPlayed || 0) + 1;
      return newBuilder;
    }
  
    // New method to set the wager submission timestamp
    atTime(timestamp: string) {
      this.props.wagerTimestamp = timestamp;
      return this;
    }
  
    build() {
      return {
        address: this.props.address || "",
        blockchain: this.props.blockchain || "",
        token: this.props.token || "",
        wagerAmount: this.props.wagerAmount || 0,
        gamesPlayed: this.props.gamesPlayed || 0,
        gamesWon: this.props.gamesWon || 0,
        currentMove: this.props.currentMove,
        votedToken: this.props.votedToken,
        wagerTimestamp: this.props.wagerTimestamp || "",
      };
    }
  }
  
  export default UserBuilder;
  