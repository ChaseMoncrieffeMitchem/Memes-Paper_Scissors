# activeContext.md

## Current Work Focus
MVP on Fuji testnet - Core Functionality Complete:
- **Completed**: Single-chain game, AVAX payouts, mock randomness, Next.js frontend
- **Next Phase**: Chainlink VRF integration
- **Deferred Features**: Axelar cross-chain, escrow system, multi-token support

## Completed Tasks
1. **Core Contract**:
   - Implemented and tested RockPaperScissors.sol
   - Deployed to Fuji testnet
   - Verified contract

2. **Frontend Implementation**:
   - Next.js app deployed to Vercel
   - MetaMask integration working
   - Game flow tested and functional:
     - Game creation
     - Player joining
     - Move submission
     - Result display
     - AVAX payouts

## Next Steps (Day 3)
1. **Chainlink VRF Integration**:
   - Replace mock randomness
   - Update contract for VRF
   - Test VRF integration

## Active Decisions
- **Randomness**: Currently using block.timestamp; ready for VRF upgrade
- **Token Support**: AVAX-only implementation successful
- **Infrastructure**: Vercel deployment complete
- **Testing**: Contract and frontend integration verified

## Technical Patterns
- **Contract**: Functional on Fuji
- **Frontend**: Next.js + ethers successful
- **Deployment**: Vercel production environment