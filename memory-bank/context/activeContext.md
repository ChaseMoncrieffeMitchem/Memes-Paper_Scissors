# activeContext.md

## Current Work Focus
Converting core game logic to a focused MVP on Fuji testnet:
- **MVP Scope**: Single-chain game, AVAX payouts, mock randomness, Next.js frontend
- **Deferred Features**: Axelar cross-chain, escrow system, multi-token support
- **Timeline**: Tests (Day 1), Frontend (Day 2), Chainlink VRF (Day 3), Axelar (Day 4-5), escrow (Week 2)

## Immediate Tasks (Day 1)
1. **Hardhat Tests**:
   - Convert gameplay.test.js to Hardhat format
   - Focus on core game mechanics and AVAX payouts
   - Test against local hardhat network first
   - Deploy to Fuji once tests pass

2. **Frontend Setup (Prep)**:
   - Create Next.js project structure
   - Install dependencies (ethers, etc.)
   - Plan basic UI components

## Next Steps (Day 2)
1. **Frontend Development**:
   - Basic game interface
   - MetaMask connection
   - Game creation/joining
   - Move submission
   - Result display

## Active Decisions
- **Randomness**: Using block.timestamp for MVP; Chainlink VRF planned for Day 3
- **Token Support**: AVAX only for MVP; multi-token support deferred
- **Testing Priority**: Local Hardhat tests first, then Fuji deployment
- **Frontend Focus**: Essential gameplay UI before advanced features

## Technical Patterns
- **Testing**: Hardhat native testing with ethers
- **Frontend**: Next.js + ethers for Web3 interaction
- **Contract**: Single-chain focus with upgrade path to cross-chain