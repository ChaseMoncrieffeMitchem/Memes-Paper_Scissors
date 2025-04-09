# productContext.md

## Why This Project Exists
The rock-paper-scissors dApp exists to bring a fun, accessible, and rewarding gaming experience to blockchain users across multiple ecosystems. Blockchain gaming often lacks seamless cross-chain interoperability, limiting players to single networks and their native tokens. This dApp breaks those barriers by leveraging Avalanche as a fast, scalable hub and Axelar as a cross-chain messaging system, connecting over 50 blockchains. It aims to make gaming inclusive for users on chains like XRPL and Ethereum, while introducing a unique escrow reward system to incentivize participation and build a vibrant community.

## Problems It Solves
- **Cross-Chain Isolation**: Most blockchain games are confined to one network, excluding users from other ecosystems. This dApp lets players from any Axelar-supported chain join the fun without switching networks.
- **Token Flexibility**: Users want to play and get paid in their preferred tokens (e.g., XRP, ETH), but gas fees and payouts often force them into unfamiliar tokens. This dApp accepts native token payments and delivers custom payouts.
- **Engagement Gaps**: Traditional games lack long-term incentives beyond immediate winnings. The escrow system rewards consistent players with periodic payouts from a community-voted token pool, encouraging ongoing participation.
- **Accessibility**: Blockchain gaming can feel complex with wallet setups and token swaps. This dApp simplifies the experience with a unified interface and cross-chain support.

## How It Should Work
From a user’s perspective, the dApp offers a straightforward yet powerful experience:
1. **Joining a Game**: A user connects their wallet (e.g., MetaMask) on their native chain (say, XRPL), selects their preferred token (e.g., XRP), and pays a small fee to play rock-paper-scissors via a gateway contract. Axelar’s GMP sends their move to the main dApp on Avalanche.
2. **Playing the Game**: The Avalanche-based dApp matches players, uses Chainlink Oracle for fair random outcomes, and determines winners. Real-time updates (via Socket.io) keep the experience engaging.
3. **Receiving Payouts**: Winners get their winnings in their preferred token (e.g., XRP on XRPL) through Axelar’s cross-chain transfers, with the dApp handling wrapped token conversions behind the scenes.
4. **Escrow Rewards**: A portion of each fee goes to an escrow account on Avalanche. The community votes (e.g., via a simple governance mechanism) on a set of tokens (like AVAX or USDC) to hold in escrow. Periodically, these tokens are distributed to players based on their total games played, tracked by the dApp.
5. **User Interface**: A Next.js frontend with Tailwind CSS provides an intuitive dashboard to play, track winnings, view escrow status, and vote on token preferences, all secured by Clerk authentication.

From a business perspective, the dApp generates value by:
- Collecting fees to sustain development and escrow rewards.
- Building a self-sustaining community that drives token voting and participation.
- Showcasing Avalanche and Axelar’s capabilities for enterprise-grade cross-chain applications.

## User Experience Goals
- **Seamless Cross-Chain Play**: Users should feel like they’re playing a single game, not navigating blockchain complexities. Gateway contracts and Axelar make cross-chain interaction invisible.
- **Intuitive Token Management**: Paying fees and receiving payouts in native tokens should be effortless, with conversions (e.g., to community-voted escrow tokens) handled automatically.
- **Rewarding Participation**: The escrow system should feel fair and exciting, with clear visibility (via Supabase data) into participation stats and upcoming distributions.
- **Fast and Reliable**: Avalanche’s speed, Cloudflare’s protection, and Vercel’s deployment ensure a smooth, secure experience even with millions of users.
- **Engaging and Transparent**: Real-time updates (Socket.io), analytics (Posthog), and error tracking (Sentry) keep users informed and the platform trustworthy.

---

This `productContext.md` fleshes out the user and business rationale for your dApp, setting the stage for technical details in `systemPatterns.md` or `techContext.md`. It’s written to align with the Memory Bank’s emphasis on clarity and context preservation. Let me know if you’d like to tweak the tone, add more specifics, or move to the next file!