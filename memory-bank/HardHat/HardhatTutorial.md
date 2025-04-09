# Hardhat Tutorial for Beginners

## 1. Introduction

This tutorial will help you get set up to build Ethereum contracts and dApps from scratch using Hardhat, a development environment for Ethereum.

## 2. Setting up the environment

### Installing Node.js
Make sure you have Node.js version 18.0+ installed:

**Ubuntu:**
```bash
sudo apt update
sudo apt install curl git
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**MacOS:**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
nvm install 22
nvm use 22
nvm alias default 22
npm install npm --global # Upgrade npm to the latest version
```

**Windows:**
Use Windows Subsystem for Linux (WSL 2) for best results.

## 3. Creating a new Hardhat project

Create a project folder and initialize:
```bash
mkdir hardhat-tutorial
cd hardhat-tutorial
npm init
npm install --save-dev hardhat
npx hardhat init
```

Select "Create an empty hardhat.config.js" when prompted.

### Hardhat's architecture

Install the recommended toolbox plugin:
```bash
npm install --save-dev @nomicfoundation/hardhat-toolbox
```

Add this to your hardhat.config.js:
```js
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
};
```

## 4. Writing and compiling smart contracts

Create a directory for contracts:
```bash
mkdir contracts
```

Create a file called Token.sol in the contracts directory:

```solidity
//SPDX-License-Identifier: UNLICENSED

// Solidity files have to start with this pragma.
// It will be used by the Solidity compiler to validate its version.
pragma solidity ^0.8.0;


// This is the main building block for smart contracts.
contract Token {
    // Some string type variables to identify the token.
    string public name = "My Hardhat Token";
    string public symbol = "MHT";

    // The fixed amount of tokens, stored in an unsigned integer type variable.
    uint256 public totalSupply = 1000000;

    // An address type variable is used to store ethereum accounts.
    address public owner;

    // A mapping is a key/value map. Here we store each account's balance.
    mapping(address => uint256) balances;

    // The Transfer event helps off-chain applications understand
    // what happens within your contract.
    event Transfer(address indexed _from, address indexed _to, uint256 _value);

    /**
     * Contract initialization.
     */
    constructor() {
        // The totalSupply is assigned to the transaction sender, which is the
        // account that is deploying the contract.
        balances[msg.sender] = totalSupply;
        owner = msg.sender;
    }

    /**
     * A function to transfer tokens.
     *
     * The `external` modifier makes a function *only* callable from *outside*
     * the contract.
     */
    function transfer(address to, uint256 amount) external {
        // Check if the transaction sender has enough tokens.
        // If `require`'s first argument evaluates to `false`, the
        // transaction will revert.
        require(balances[msg.sender] >= amount, "Not enough tokens");

        // Transfer the amount.
        balances[msg.sender] -= amount;
        balances[to] += amount;

        // Notify off-chain applications of the transfer.
        emit Transfer(msg.sender, to, amount);
    }

    /**
     * Read only function to retrieve the token balance of a given account.
     *
     * The `view` modifier indicates that it doesn't modify the contract's
     * state, which allows us to call it without executing a transaction.
     */
    function balanceOf(address account) external view returns (uint256) {
        return balances[account];
    }
}
```

Compile the contract:
```bash
npx hardhat compile
```

## 5. Testing contracts

Create a test directory and a Token.js file inside it:
```bash
mkdir test
```

Basic test example:
```javascript
const { expect } = require("chai");

describe("Token contract", function () {
  it("Deployment should assign the total supply of tokens to the owner", async function () {
    const [owner] = await ethers.getSigners();
    const hardhatToken = await ethers.deployContract("Token");
    const ownerBalance = await hardhatToken.balanceOf(owner.address);
    expect(await hardhatToken.totalSupply()).to.equal(ownerBalance);
  });
});
```

Run tests:
```bash
npx hardhat test
```

### Using fixtures for reusing test setups

```javascript
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

describe("Token contract", function () {
  async function deployTokenFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const hardhatToken = await ethers.deployContract("Token");
    return { hardhatToken, owner, addr1, addr2 };
  }

  it("Should assign the total supply of tokens to the owner", async function () {
    const { hardhatToken, owner } = await loadFixture(deployTokenFixture);
    const ownerBalance = await hardhatToken.balanceOf(owner.address);
    expect(await hardhatToken.totalSupply()).to.equal(ownerBalance);
  });

  it("Should transfer tokens between accounts", async function () {
    const { hardhatToken, owner, addr1, addr2 } = await loadFixture(
      deployTokenFixture
    );

    // Transfer 50 tokens from owner to addr1
    await expect(
      hardhatToken.transfer(addr1.address, 50)
    ).to.changeTokenBalances(hardhatToken, [owner, addr1], [-50, 50]);

    // Transfer 50 tokens from addr1 to addr2
    await expect(
      hardhatToken.connect(addr1).transfer(addr2.address, 50)
    ).to.changeTokenBalances(hardhatToken, [addr1, addr2], [-50, 50]);
  });
});
```

## 6. Debugging with Hardhat Network

Add console.log to your Solidity code:

```solidity
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Token {
  // ... existing code

  function transfer(address to, uint256 amount) external {
    require(balances[msg.sender] >= amount, "Not enough tokens");

    console.log(
        "Transferring from %s to %s %s tokens",
        msg.sender,
        to,
        amount
    );

    balances[msg.sender] -= amount;
    balances[to] += amount;

    emit Transfer(msg.sender, to, amount);
  }

  // ... rest of the contract
}
```

## 7. Deploying to a live network

Create a deployment module using Hardhat Ignition:

```bash
mkdir -p ignition/modules
```

Create `ignition/modules/Token.js`:
```javascript
const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const TokenModule = buildModule("TokenModule", (m) => {
  const token = m.contract("Token");
  return { token };
});

module.exports = TokenModule;
```

To deploy to a testnet like Sepolia, update your hardhat.config.js:

```javascript
require("@nomicfoundation/hardhat-toolbox");

// Ensure your configuration variables are set before executing the script
const { vars } = require("hardhat/config");

// Go to https://infura.io, sign up, create a new API key
const INFURA_API_KEY = vars.get("INFURA_API_KEY");

// Add your Sepolia account private key to the configuration variables
const SEPOLIA_PRIVATE_KEY = vars.get("SEPOLIA_PRIVATE_KEY");

module.exports = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [SEPOLIA_PRIVATE_KEY],
    },
  },
};
```

Deploy to Sepolia network:
```bash
npx hardhat ignition deploy ./ignition/modules/Token.js --network sepolia
```

## 8. Managing Test Accounts

### Local Testing Accounts
When running tests locally, Hardhat automatically provides 20 test accounts:
```javascript
const [owner, player1, player2] = await ethers.getSigners();
```

### Creating Test Accounts for Live Networks
To create and manage accounts for testnet (e.g., Fuji):

1. Open Hardhat console connected to network:
```bash
npx hardhat console --network fuji
```

2. Generate new random wallets:
```javascript
// Create wallets
const wallet1 = ethers.Wallet.createRandom();
const wallet2 = ethers.Wallet.createRandom();

// Log details
console.log("Player 1:");
console.log("Address:", wallet1.address);
console.log("Private Key:", wallet1.privateKey);

console.log("\nPlayer 2:");
console.log("Address:", wallet2.address);
console.log("Private Key:", wallet2.privateKey);
```

3. Add private keys to .env:
```env
TEST_PRIVATE_KEY1="private_key_1_here"
TEST_PRIVATE_KEY2="private_key_2_here"
```

4. Use in tests:
```typescript
describe("Contract on Testnet", function () {
  let player1: Signer;
  let player2: Signer;

  before(async function () {
    [owner] = await ethers.getSigners();
    player1 = new ethers.Wallet(process.env.TEST_PRIVATE_KEY1!, ethers.provider);
    player2 = new ethers.Wallet(process.env.TEST_PRIVATE_KEY2!, ethers.provider);
    
    // Check balances
    const player1Balance = await ethers.provider.getBalance(player1);
    const player2Balance = await ethers.provider.getBalance(player2);
    console.log("Player1 balance:", ethers.formatEther(player1Balance));
    console.log("Player2 balance:", ethers.formatEther(player2Balance));
  });
});
```

5. Check balances in console:
```javascript
// In hardhat console
const balance = await ethers.provider.getBalance("WALLET_ADDRESS");
console.log("Balance:", ethers.formatEther(balance), "AVAX");
```

Remember to:
- Fund test accounts from a faucet before testing
- Keep test private keys secure but separate from production keys
- Use lower amounts for testnet transactions
- Check balances before running tests that require funds

## Additional Resources

- Hardhat's documentation: [https://hardhat.org/docs](https://hardhat.org/docs)
- Hardhat Toolbox documentation
- Hardhat Ignition documentation
- Ethers.js Documentation
- Solidity Documentation

To get testnet ETH, use faucets like:
- Alchemy Sepolia Faucet
- Coinbase Sepolia Faucet
- Infura Sepolia Faucet
- Chainstack Sepolia Faucet
- QuickNode Sepolia Faucet
