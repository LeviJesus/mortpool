# 🏠 Mortpool - On-Chain Mortgage Protocol

<h4 align="center">
  <a href="#features">Features</a> |
  <a href="#quickstart">Quick Start</a> |
  <a href="#demo">Demo</a>
</h4>

💰 **Get mortgages with better rates through decentralized liquidity pools.**

Mortpool connects borrowers directly with liquidity providers, eliminating traditional banking overhead. Borrowers get 5% APR mortgages while LPs earn 3.5% yield - better rates for everyone.

⚙️ Built using Scaffold-ETH 2: NextJS, RainbowKit, Hardhat, Wagmi, Viem, and Typescript.

## ✨ Features

- 🏡 **Tokenized Properties** - Real estate as NFTs with on-chain ownership tracking
- 💵 **Lower Interest Rates** - 5% APR vs 8% traditional mortgages
- 📈 **Earn Yield** - 3.5% APY for liquidity providers
- 📊 **Incremental Ownership** - Watch your ownership % grow with each payment
- 🔒 **Insurance Pool** - 2% reserve protects against defaults
- ⚡ **Instant Approval** - Smart contract automation
- 🎯 **Transparent** - All terms visible on-chain

- ✅ **Contract Hot Reload**: Your frontend auto-adapts to your smart contract as you edit it.
- 🪝 **[Custom hooks](https://docs.scaffoldeth.io/hooks/)**: Collection of React hooks wrapper around [wagmi](https://wagmi.sh/) to simplify interactions with smart contracts with typescript autocompletion.
- 🧱 [**Components**](https://docs.scaffoldeth.io/components/): Collection of common web3 components to quickly build your frontend.
- 🔥 **Burner Wallet & Local Faucet**: Quickly test your application with a burner wallet and local faucet.
- 🔐 **Integration with Wallet Providers**: Connect to different wallet providers and interact with the Ethereum network.

## Requirements

Before you begin, you need to install the following tools:

- [Node (>= v20.18.3)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)

## Quickstart

1. **Clone and install dependencies:**

```bash
git clone https://github.com/yourusername/mortpool.git
cd mortpool
yarn install
```

2. **Start local blockchain:**

```bash
yarn chain
```

3. **Deploy contracts (in new terminal):**

```bash
yarn deploy
```

4. **Start the frontend (in new terminal):**

```bash
yarn start
```

5. **Open your browser to:**
```
http://localhost:3000
```

## 📖 How It Works

### For Borrowers:
1. Browse available tokenized properties
2. Apply for a mortgage with 10-20% down payment
3. Get instant approval from smart contracts
4. Make monthly payments and track ownership growth
5. Own 100% of your property when paid off

### For Liquidity Providers:
1. Deposit ETH into the liquidity pool
2. Earn 3.5% APY from mortgage interest
3. Withdraw anytime (subject to liquidity)
4. Protected by 2% insurance reserve

## 🏗️ Smart Contracts

- **PropertyNFT.sol** - ERC-721 tokens representing real estate
- **MortgagePool.sol** - Liquidity pool for lenders with yield distribution
- **MortgageManager.sol** - Mortgage lifecycle management (applications, payments, defaults)

## 📚 Documentation

- Edit smart contracts in `packages/hardhat/contracts`
- Edit frontend in `packages/nextjs/app`
- Deploy scripts in `packages/hardhat/deploy`

For more on Scaffold-ETH 2, visit [docs.scaffoldeth.io](https://docs.scaffoldeth.io)

## 🤝 Contributing

Contributions welcome! Please check `CONTRIBUTING.md` for guidelines.

## 📄 License

MIT License - see LICENSE file for details

---

**Built with ❤️ using Scaffold-ETH 2**