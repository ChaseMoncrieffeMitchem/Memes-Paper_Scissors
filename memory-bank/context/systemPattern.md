# systemPatterns.md

## System Architecture
The rock-paper-scissors dApp uses Avalanche as its central hub, with Axelar’s General Message Passing (GMP) connecting the main dApp to gateway contracts on supported chains (e.g., XRPL, Ethereum). The architecture is modular and event-driven, ensuring scalability and real-time interaction for millions of users.

- **Main dApp Contract (Avalanche)**: Deployed on Avalanche, it handles core game logic, token conversion, escrow management, and payout initiation. Written in Solidity, optimized for gas efficiency.
- **Gateway Contracts (Supported Chains)**: Lightweight contracts on each chain (e.g., XRPL, Ethereum) handle user inputs (moves, fees) and communicate with the main dApp via Axelar’s GMP. Also manage payout receipt.
- **Axelar Network**: Facilitates cross-chain messaging and token transfers between Avalanche and other chains using the Axelar SDK and Interchain Token Service (ITS).
- **Frontend (Next.js)**: A responsive web interface styled with Tailwind CSS, integrated with MetaMask SDK for wallet connectivity and Socket.io for real-time game updates.
- **External Services**: Chainlink Oracle provides randomness for game outcomes; Supabase stores participation data; Clerk manages authentication.

## Key Technical Decisions
- **Avalanche as Base Chain**: Chosen for its high throughput, low gas costs, and scalability, ideal for handling millions of transactions.
- **Axelar for Cross-Chain**: GMP enables secure, Turing-complete messaging; ITS handles wrapped token transfers (e.g., wETH, eXRP) for payouts.
- **Token Conversion**: Fees in native tokens are converted on Avalanche into community-voted tokens (e.g., AVAX, USDC) via a swap mechanism (potentially integrated with a DEX), stored in the escrow account.
- **Randomness via Chainlink**: Ensures fair, tamper-proof game outcomes, critical for trust in a competitive dApp.
- **Event-Driven Updates**: Socket.io pushes real-time game states (e.g., opponent moves, results) to the frontend, enhancing user experience.
- **Escrow Distribution**: A scheduled smart contract function calculates participation percentages (from Supabase data) and triggers cross-chain payouts via Axelar.

## Design Patterns
- **Modular Contracts**: Separate concerns (game logic, escrow, payouts) into distinct contracts for maintainability and upgradability.
- **Event-Driven Architecture**: Events emitted by contracts (e.g., `GamePlayed`, `PayoutSent`) trigger frontend updates and off-chain processes (e.g., Supabase logging).
- **Factory Pattern**: A gateway contract factory deploys instances on supported chains, reducing deployment overhead.
- **Governance Module**: A simple voting system (inspired by DAO patterns) lets users propose and vote on escrow tokens, stored on-chain.
- **Retry Mechanism**: Failed cross-chain messages (via Axelar) are retried with exponential backoff to ensure reliability.

## Component Relationships
- **Frontend ↔ Main dApp**: Next.js interacts with the Avalanche contract via Web3.js/Ethers.js (general chains) or XRPL.js (XRPL-specific), using MetaMask SDK for user transactions.
- **Main dApp ↔ Gateway Contracts**: Axelar’s GMP relays moves and fees from gateways to Avalanche, and payout instructions back to gateways.
- **Main dApp ↔ Escrow**: A sub-contract on Avalanche holds community-voted tokens, updated by the main dApp after fee conversions.
- **Main dApp ↔ Chainlink**: Requests randomness for each game round, with results fed back via a callback function.
- **Main dApp ↔ Supabase**: Logs game participation off-chain (via API calls), queried for escrow distribution.
- **Infrastructure**: Cloudflare secures and accelerates the frontend; Vercel hosts it; Sentry tracks errors; Posthog analyzes usage.

## Critical Implementation Paths
1. **Gameplay Flow**:
   - User submits move and fee to gateway contract.
   - Gateway sends GMP message to main dApp with move and fee (wrapped token).
   - Main dApp requests randomness from Chainlink, resolves game, emits result event.
   - Socket.io updates frontend; winner flagged for payout.
2. **Payout Flow**:
   - Main dApp receives the loser’s wager (e.g., XRP from XRPL) as a wrapped token (eXRP) via Axelar.
   - Escrow on Avalanche converts the loser’s wager (e.g., eXRP) into the winner’s preferred token (e.g., ETH) using a swap mechanism (e.g., DEX integration).
   - Main dApp initiates cross-chain transfer via Axelar ITS, sending the converted token (e.g., wETH) to the winner’s gateway on their chain (e.g., Ethereum).
   - Gateway unwraps the token (e.g., wETH → ETH) and sends it to the winner’s address.
3. **Escrow Management**:
   - Fees collected, converted to voted tokens (e.g., AVAX) via swap.
   - Tokens deposited in escrow contract.
   - Periodic function (triggered by a cron-like mechanism) queries Supabase, calculates shares, and distributes via Axelar.
4. **Token Voting**:
   - Users submit token proposals to governance contract via frontend.
   - Voting period runs; highest-voted tokens set as escrow targets.