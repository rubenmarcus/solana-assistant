import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import axios from 'axios';

export const dynamic = 'force-dynamic';

const DEXSCREENER_API = 'https://api.dexscreener.com/latest/dex/tokens';
const JUPITER_TOKEN_LIST_API = 'https://token.jup.ag/all';

async function getTokenMetadata(mint: string): Promise<{ symbol: string; name: string }> {
  try {
    const response = await axios.get(JUPITER_TOKEN_LIST_API);
    const token = response.data.find((t: any) => t.address === mint);
    return {
      symbol: token?.symbol || 'Unknown',
      name: token?.name || 'Unknown Token'
    };
  } catch (error) {
    console.error('Error fetching token metadata:', error);
    return { symbol: 'Unknown', name: 'Unknown Token' };
  }
}

async function getTokenPriceWithRetry(mint: string, retries = 2): Promise<number> {
  try {
    const dexscreenerResponse = await axios.get(`${DEXSCREENER_API}/${mint}`);
    const pairs = dexscreenerResponse.data.pairs;

    if (pairs && pairs.length > 0) {
      // Get the price from the most liquid pair (highest volume)
      const mostLiquidPair = pairs.reduce((max: any, pair: any) =>
        pair.volume24h > max.volume24h ? pair : max, pairs[0]);
      return parseFloat(mostLiquidPair.priceUsd);
    }

    return 0;
  } catch (error) {
    console.error(`Error fetching price for ${mint}:`, error);
    if (retries > 0) {
      // Wait 1 second before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
      return getTokenPriceWithRetry(mint, retries - 1);
    }
    return 0;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400 }
      );
    }

    // Initialize Solana connection
    const connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
    );

    // Validate and create PublicKey
    let publicKey: PublicKey;
    try {
      publicKey = new PublicKey(address);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid Solana address' },
        { status: 400 }
      );
    }

    // Get SOL balance and price
    const solBalance = await connection.getBalance(publicKey);
    const solPrice = await getTokenPriceWithRetry('So11111111111111111111111111111111111111112');
    const solValueUSD = (solBalance / 1e9) * solPrice;

    // Get token accounts
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
      programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
    });

    // Get all token mints first
    const mints = tokenAccounts.value.map(account =>
      account.account.data.parsed.info.mint
    );

    // Fetch all token metadata and prices in parallel with batching
    const batchSize = 5; // Reduced batch size to avoid rate limiting
    const tokenMetadata = await Promise.all(mints.map(mint => getTokenMetadata(mint)));

    // Process prices in batches to avoid rate limiting
    const tokenPrices: number[] = [];
    for (let i = 0; i < mints.length; i += batchSize) {
      const batch = mints.slice(i, i + batchSize);
      const batchPrices = await Promise.all(batch.map(mint => getTokenPriceWithRetry(mint)));
      tokenPrices.push(...batchPrices);
      // Add delay between batches to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Process token accounts with prices and metadata
    const tokenHoldings = tokenAccounts.value.map((account, index) => {
      const mint = account.account.data.parsed.info.mint;
      const amount = account.account.data.parsed.info.tokenAmount.uiAmount;
      const decimals = account.account.data.parsed.info.tokenAmount.decimals;
      const price = tokenPrices[index];
      const metadata = tokenMetadata[index];
      const valueUSD = amount * price;

      return {
        contractAddress: mint,
        symbol: metadata.symbol,
        name: metadata.name,
        amount: amount.toString(),
        decimals,
        priceUSD: price,
        valueUSD
      };
    });

    // Get NFT holdings
    const nftAccounts = tokenAccounts.value.filter(account =>
      account.account.data.parsed.info.tokenAmount.decimals === 0 &&
      account.account.data.parsed.info.tokenAmount.amount === '1'
    );

    // Calculate total portfolio value
    const totalValueUSD = solValueUSD + tokenHoldings.reduce((sum, token) => sum + token.valueUSD, 0);

    return NextResponse.json({
      address,
      solBalance: {
        amount: solBalance / 1e9,
        valueUSD: solValueUSD
      },
      tokenHoldings,
      nftHoldings: nftAccounts.length,
      totalValueUSD
    });

  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio information' },
      { status: 500 }
    );
  }
}