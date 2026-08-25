# BOT Certificate Registry

On-chain certificate registry on **BOT Chain** (EVM Layer 1). Admin-approved issuers create verifiable credentials stored immutably on the blockchain. Certificates can be verified by anyone and revoked by their issuer.

## Features

- **Issuer Management** — Admin registers and removes trusted issuers
- **Certificate Issuance** — Issuers create certificates with title, details, and optional IPFS hash
- **Verification** — Anyone can verify a certificate's authenticity and revocation status
- **Revocation** — Issuers can revoke certificates they issued
- **Recipient Lookup** — Query all certificates issued to a given address
- **Demo Mode** — Fully functional frontend without MetaMask or live blockchain

## Quick Start

```bash
npm install
npx hardhat compile
npx hardhat test
```

## Deploy

1. Copy `.env.example` to `.env` and add your private key
2. Get testnet BOT from https://faucet.botchain.ai
3. Deploy:

```bash
# Testnet
npm run deploy:testnet

# Mainnet
npm run deploy:mainnet
```

4. Copy the deployed address into `frontend/index.html` (`CONTRACT_ADDRESS`)

## Networks

| Network | RPC | Chain ID | Explorer |
|---------|-----|----------|----------|
| Mainnet | https://rpc.botchain.ai | 677 | https://scan.botchain.ai |
| Testnet | https://rpc.bohr.life | 968 | https://scan.bohr.life |

## Frontend

Open `frontend/index.html` in a browser. Toggle between **Demo Mode** (default, no wallet needed) and **Live Blockchain** mode.

## License

MIT
