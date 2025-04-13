# Solana Assistant API

A powerful backend API service specialized in providing detailed information and analysis about the Solana blockchain. This service provides various endpoints to interact with the Solana ecosystem.

## Features

- 🔍 Address Information: Get detailed information about any Solana address
- 📊 Transaction History: View and analyze transaction history
- 💼 Portfolio Tracking: Monitor asset holdings and portfolio value
- 📈 Blockchain Statistics: Access real-time Solana blockchain metrics
- 🏗️ Token Management: Interact with SPL tokens and NFTs
- 💸 Transaction Generation: Create and prepare Solana transactions
- 📊 Top Wallets: View the richest Solana addresses
- 👥 Token Holders: Analyze token distribution and holders
- 📝 Token Metadata: Get detailed token information and statistics
- 🤖 AI Agent Integration: Powered by Bitte AI Agent SDK

## Tech Stack

- Next.js 14
- TypeScript
- Solana Web3.js
- Metaplex Token Metadata
- Bitte AI Agent SDK
- Jest for testing
- ESLint for code quality

## Available Endpoints

### 1. Address Information
- Endpoint: `GET /api/tools/solana/address-info`
- Query Parameters:
  - `address`: Solana address to query
- Returns detailed information about a Solana address including:
  - Address balance
  - Token accounts
  - NFT holdings
  - Transaction count
  - Recent transactions

### 2. Transaction History
- Endpoint: `GET /api/tools/solana/transactions`
- Query Parameters:
  - `address`: Solana address to query
  - `limit`: Number of transactions to return (default: 10, max: 100)
- Returns transaction history including:
  - Transaction signatures
  - Timestamps
  - Status
  - Fees
  - Instructions

### 3. Portfolio Tracking
- Endpoint: `GET /api/tools/solana/portfolio`
- Query Parameters:
  - `address`: Solana address to query
- Returns portfolio information:
  - Total portfolio value in SOL
  - Token holdings
  - NFT collections
  - Individual asset balances

### 4. Blockchain Statistics
- Endpoint: `GET /api/tools/solana/stats`
- Returns real-time Solana blockchain metrics:
  - Current epoch
  - Transaction statistics
  - Supply information
  - Validator information
  - Network health metrics

### 5. Token Management
- Endpoint: `GET /api/tools/solana/tokens`
- Query Parameters:
  - `address`: Solana address to query
  - `mint`: (Optional) Specific token mint address
- Returns token information:
  - Token accounts
  - Mint details
  - Token metadata
  - NFT information

### 6. Transaction Generation
- Endpoint: `POST /api/tools/solana/generate-tx`
- Request Body:
  ```json
  {
    "type": "transfer" | "tokenTransfer",
    "fromAddress": "string",
    "toAddress": "string",
    "amount": number,
    "mintAddress": "string", // Required for tokenTransfer
    "memo": "string" // Optional
  }
  ```
- Returns:
  - Serialized transaction
  - Transaction details
  - Status message

### 7. Top Wallets
- Endpoint: `GET /api/tools/solana/top-wallets`
- Query Parameters:
  - `limit`: Number of wallets to return (default: 100)
  - `offset`: Offset for pagination (default: 0)
- Returns:
  - List of top wallets by SOL balance
  - Transaction counts
  - Total number of wallets

### 8. Token Holders
- Endpoint: `GET /api/tools/solana/token-holders`
- Query Parameters:
  - `mint`: Token mint address
  - `limit`: Number of holders to return (default: 100)
  - `offset`: Offset for pagination (default: 0)
- Returns:
  - List of token holders
  - Holder balances
  - Total number of holders

### 9. Token Metadata
- Endpoint: `GET /api/tools/solana/token-metadata`
- Query Parameters:
  - `mint`: Token mint address
- Returns:
  - Token metadata
  - Supply information
  - Distribution statistics
  - Mint and freeze authorities

## Quick Start

1. Clone this repository
2. Install dependencies:
```bash
pnpm install
```

3. Configure environment variables:
```bash
# Create a .env file with the following variables
SOLANA_RPC_URL='your-solana-rpc-url'  # Optional: Defaults to public RPC
AGENT_API_KEY='your-agent-api-key'    # Required for agent functionality
```

4. Start the development server:
```bash
pnpm run dev
```

## Development

### Running the Development Server
```bash
pnpm run dev          # Runs both Next.js and agent development servers
pnpm run dev:agent    # Runs only the agent development server
```

### Building the Project
```bash
pnpm run build        # Builds the Next.js application
pnpm run build:deploy # Builds and deploys the agent
```

### Cleaning
```bash
pnpm run clean        # Removes .next directory
pnpm run clean:all    # Removes .next, node_modules, and .turbo directories
```

### Testing
```bash
pnpm test            # Runs Jest tests
```

### Linting
```bash
pnpm run lint        # Runs ESLint
```

## Deployment

The project can be deployed using Vercel. The agent can be deployed using the `make-agent` CLI:

```bash
pnpm run build:deploy
```

## Dependencies

### Core Dependencies
- @bitte-ai/agent-sdk: ^0.1.9
- @metaplex-foundation/mpl-token-metadata: ^2.10.0
- @solana/spl-token: ^0.3.8
- @solana/web3.js: ^1.87.6
- next: 14.1.0

### Development Dependencies
- TypeScript: ^5.3.3
- Jest: ^29.1.1
- ESLint: ^8.56.0

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License
