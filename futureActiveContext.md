# activeContext.md

## Current Work Focus
I’m currently focused on transitioning the rock-paper-scissors dApp from core code completion to infrastructure integration. This includes:
- **Deployed Contract**: Successfully deployed the `RockPaperScissors` contract to Avalanche Fuji testnet at `0x33e080070a7846cBc63D52cdD68df472492cb778`.
- **Hardhat Tests**: Converting existing Jest tests to Hardhat tests to validate the deployed contract’s functionality.
- **Frontend Setup**: Building a Next.js frontend to interact with the deployed contract.

The priority is ensuring the deployed contract works as expected on Fuji, integrating it with a user interface, and preparing for further enhancements like Chainlink VRF and Axelar cross-chain support.

## Recent Changes
- **Contract Deployment**: Deployed the core `RockPaperScissors` contract to Fuji on April 08, 2025, resolving compilation issues with OpenZeppelin imports and TypeScript deployment script errors.
- **Feature Refinement**: Split initial feature files into smaller, modular units (e.g., `gameplay.feature`, `payout.feature`, `escrow.feature`) for clarity and testability—now ready for blockchain validation.
- **Builder Updates**: Refactored Builders to use dependency injection for mock inputs, which facilitated testing and will ease integration with real blockchain data.

## Next Steps
1. **Hardhat Testing**: Convert Jest tests (e.g., `gameplay.test.js`) to Hardhat tests, targeting the deployed contract at `0x33e080070a7846cBc63D52cdD68df472492cb778`.
2. **Frontend Development**: Set up a Next.js app in `frontend/` with Ethers.js to connect to the Fuji contract, focusing on seamless UX per `productContext.md`.
3. **MVP Validation**: Test the end-to-end flow (create game, join, make moves, resolve) on Fuji via the frontend.
4. **Enhancements**: Add Chainlink VRF for randomness (Day 3), Axelar cross-chain support (Day 4-5), and escrow/token conversion (Week 2), per the MVP timeline.

## Active Decisions and Considerations
- **Token Conversion Logic**: Decided to keep Builders abstract for now; real token conversion will be handled in contracts or a DEX later.
- **Randomness**: Current contract uses `block.timestamp` for mock randomness in ties; planning to integrate Chainlink VRF next for production-grade randomness.
- **Error Handling**: Adding blockchain-specific error checks (e.g., insufficient funds, transaction reverts) in Hardhat tests and frontend.
- **Scalability Trade-Off**: Contract tracks player stats on-chain, which works for MVP but needs optimization for millions of users—deferring to Week 2.

## Important Patterns and Preferences
- **TDD (Test-Driven Development)**: Transitioning Jest TDD to Hardhat tests to ensure contract reliability on-chain.
- **Modular Design**: Deployed contract mirrors modular Builders (`GameBuilder`, `PayoutBuilder`), facilitating future cross-chain extensions.
- **Loose Coupling**: Contract avoids hard dependencies on Axelar or Chainlink yet, maintaining flexibility for MVP scope.
- **Mock-First Approach**: Used mocks in Builders; now shifting to real blockchain interactions with Fuji deployment.

## Learnings and Project Insights
- **Deployment Challenges**: Resolved OpenZeppelin import errors and TypeScript issues, highlighting the importance of dependency management and updated tooling (Ethers v6).
- **Abstraction Pays Off**: Core code’s independence from infrastructure simplified debugging and deployment, validating the mock-first strategy.
- **Hardhat Power**: Hardhat’s compilation and deployment workflow, once configured, streamlined on-chain progress—key for rapid iteration.
- **Builder Flexibility**: Dependency injection in Builders eased the shift to a deployed contract, suggesting this pattern’s value through production.