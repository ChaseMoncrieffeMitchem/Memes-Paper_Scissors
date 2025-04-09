# techContext.md

## Technologies Used
- **Avalanche**: Main blockchain for the dApp, chosen for high throughput and low gas costs.
- **Axelar**: Cross-chain messaging system using Axelar SDK for GMP and Interchain Token Service (ITS) for token transfers.
- **Solidity**: Smart contract language for the main dApp and gateway contracts.
- **Next.js**: Frontend framework for a responsive web interface.
- **Tailwind CSS**: Styling framework for rapid, consistent UI design.
- **Web3.js or Ethers.js**: Libraries for blockchain interaction with Avalanche and other chains.
- **XRPL.js**: Library for XRP Ledger-specific interactions (e.g., fee submission on XRPL).
- **MetaMask SDK**: Wallet integration for user authentication and transactions.
- **Socket.io**: Real-time communication for game updates and notifications.
- **Chainlink Oracle**: Provides tamper-proof randomness for game outcomes.
- **Supabase**: Backend database and API for off-chain data (e.g., participation tracking).
- **Clerk**: Authentication service for user management.
- **Cloudflare**: CDN and DDoS protection for the frontend.
- **Vercel**: Deployment platform for the Next.js frontend.
- **Hardhat**: Development environment for compiling, testing, and deploying contracts.
- **Zod**: Runtime type checking and validation for data integrity.
- **Posthog**: Analytics tool for tracking user behavior and game metrics.
- **Sentry**: Error monitoring for debugging frontend and backend issues.
- **GitHub**: Version control and collaboration platform.

## Development Setup
- **Smart Contracts**: Hardhat is used to write, test, and deploy Solidity contracts to Avalanche’s testnet (e.g., Fuji) and mainnet. Scripts manage gateway contract deployment across chains.
- **Frontend**: Next.js app initialized with Tailwind CSS, hosted on Vercel. Local dev server runs with Socket.io for real-time testing.
- **Cross-Chain Integration**: Axelar SDK and ITS configured via npm packages, with testnet endpoints for GMP and token transfers.
- **Wallet**: MetaMask SDK integrated into Next.js for wallet connectivity, tested with Avalanche C-Chain and other networks.
- **Backend**: Supabase project set up with tables for game participation and API keys for secure access. Clerk integrated for auth flows.
- **Infrastructure**: Cloudflare domain and security settings applied to Vercel deployment. GitHub repo with branch protection and CI/CD via Vercel and Hardhat tasks.
- **Testing**: Hardhat for unit tests on contracts; Posthog and Sentry configured for monitoring during development.

## Technical Constraints
- **Gas Costs**: Avalanche is low-cost, but cross-chain swaps (e.g., XRP to ETH) and Axelar GMP calls add overhead. Optimization required for high transaction volumes.
- **Cross-Chain Latency**: Axelar’s GMP introduces slight delays (seconds to minutes), impacting real-time gameplay responsiveness.
- **Token Liquidity**: Converting loser’s wager (e.g., XRP) to winner’s token (e.g., ETH) depends on DEX liquidity on Avalanche, potentially affecting payout speed or cost.
- **Randomness Delay**: Chainlink Oracle requests may take a few blocks to resolve, requiring a buffering mechanism in game logic.
- **Scalability Limits**: Supabase’s free tier has row limits; scaling to millions of users may require a paid plan or custom solution.

## Dependencies
- **Core Libraries**: `@axelar-network/axelarjs-sdk`, `web3.js` or `ethers.js`, `xrpl.js`, `@metamask/sdk`, `socket.io`, `@chainlink/contracts`.
- **Frontend**: `next`, `tailwindcss`, `zod`.
- **Backend**: `@supabase/supabase-js`, `@clerk/nextjs`.
- **Dev Tools**: `hardhat`, `@nomiclabs/hardhat-ethers`, `dotenv` (for env vars).
- **Monitoring**: `@posthog/posthog-js`, `@sentry/nextjs`.
- **Infra**: Cloudflare DNS records, Vercel CLI.

## Tool Usage Patterns
- **Hardhat**: Run `npx hardhat compile` for contracts, `npx hardhat test` for unit tests, and `npx hardhat run scripts/deploy.js --network avalanche` for deployment.
- **Axelar SDK**: Used in scripts to send GMP messages (e.g., `callContract`) and ITS for token transfers (e.g., `sendToken`).
- **Next.js**: Pages and API routes handle game UI and backend calls; Socket.io server runs in `/api/socket` for real-time updates.
- **Web3.js/Ethers.js**: Instantiated in frontend to call contract functions (e.g., `submitMove`) and listen to events (e.g., `GameResolved`).
- **XRPL.js**: Used in gateway contract logic for XRPL-specific fee handling, wrapped into Axelar messages.
- **Chainlink**: VRF (Verifiable Random Function) contract deployed on Avalanche, called via `requestRandomness`.
- **Supabase**: REST API queries participation data (e.g., `select count(*) from games where user_id = X`) for escrow distribution.
- **Clerk**: Middleware protects routes (e.g., `/dashboard`), with hooks for user state (e.g., `useUser`).
- **Posthog**: Tracks events like `game_started`, `payout_received` for analytics dashboards.
- **Sentry**: Captures errors (e.g., `Sentry.captureException`) with custom tags for blockchain context.

---

This `techContext.md` provides a detailed technical foundation, aligning with your tech stack and the Memory Bank’s focus on clarity for future context rebuilding. It sets you up for implementation by specifying how each tool fits into the project. Next steps could be `activeContext.md` (for active development) or `progress.md` (for tracking), depending on where you are in the process. Let me know what you think or where you’d like to go next!