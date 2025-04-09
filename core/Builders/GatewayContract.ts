// src/shared/builders/gatewayContractBuilder.ts
import UserBuilder from "./UserBuilder";

class GatewayContractBuilder {
  public user: ReturnType<UserBuilder["build"]>;
  public lockedWager = 0; // 90% of the wager, held locally
  private chain: string; // e.g., "Ethereum", "Solana"
  private payoutReceived = 0; // New field to track payout
//   private delayTimeoutId?: NodeJS.Timeout; // Store the timeout ID
  private lockedEscrowFee = 0;
  private requiredConfirmations = 0; // New: Track required confirmations

  constructor(user: ReturnType<UserBuilder["build"]>) {
    this.user = user;
    this.chain = user.blockchain;
  }

  lockWager(wagerAmount: number, lockCallback?: () => void): GatewayContractBuilder {
    try {
      if (lockCallback) lockCallback(); // Simulate blockchain failure if provided
      this.lockedWager = wagerAmount * 0.9; // Lock 90% of the wager
    } catch (error) {
      throw new Error(`Failed to lock wager: ${error.message}`);
    }
    return this;
  }

//   lockWagerWithDelay(wagerAmount: number, delaySeconds: number): NodeJS.Timeout {
//     this.lockedWager = 0; // Initially not locked
//     this.delayTimeoutId = setTimeout(() => {
//       this.lockedWager = wagerAmount * 0.9; // Lock after delay
//     }, delaySeconds * 1000);
//     return this.delayTimeoutId; // Return the timeout ID for cleanup
//   }

  confirmDelayedLock(): void {
    if (this.lockedWager === 0) {
      this.lockedWager = this.user.wagerAmount * 0.9; // Confirm lock
    }
  }

  refundWager(): void {
    this.payoutReceived = this.lockedWager; // Simulate refund as payout
    this.lockedWager = 0;
  }

  sendEscrowFee(toEscrow: (user: ReturnType<UserBuilder["build"]>, amount: number) => void) {
    // Simulate sending 10% to the escrow on Axelar via GMP
    const escrowFee = this.user.wagerAmount * 0.1;
    toEscrow(this.user, escrowFee);
    return this;
  }

  forwardMove(toMainHub: (user: ReturnType<UserBuilder["build"]>, move: "rock" | "paper" | "scissors") => void) {
    // Simulate forwarding the user's move to the Main dApp on Axelar via GMP
    if (!this.user.currentMove) throw new Error("User has no move set");
    toMainHub(this.user, this.user.currentMove);
    return this;
  }

  executePayout(payoutInstruction: { winner: ReturnType<UserBuilder["build"]>; amount: number }) {
    if (payoutInstruction.winner.address === this.user.address) {
      this.payoutReceived = payoutInstruction.amount;
      return { winner: this.user, amount: payoutInstruction.amount };
    }
    return { winner: this.user, amount: 0 };
  }
  getLockedWager() {
    return this.lockedWager;
  }

  // New method to retrieve payout received
  getPayoutReceived() {
    return this.payoutReceived;
  }

  forwardVote(token: string, callback: (gateway: GatewayContractBuilder, token: string) => void): void {
    callback(this, token); // Gateway forwards User's vote to MainHub
  }

  getEscrowFee() {
    return this.user.wagerAmount * 0.1;
  }

  lockEscrowFeeForCrossChainTransfer(
    toEscrow: (user: ReturnType<UserBuilder["build"]>, amount: number) => void,
  ) {
    const escrowFee = this.user.wagerAmount * 0.1;
    this.lockedEscrowFee = escrowFee;
    toEscrow(this.user, escrowFee);
    return this;
  }

  getLockedEscrowFee() {
    return this.lockedEscrowFee;
  }

  getRequiredConfirmations(): number {
    return this.requiredConfirmations;
  }

}

export default GatewayContractBuilder;