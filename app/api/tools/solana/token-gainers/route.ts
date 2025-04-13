import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { getMint } from '@solana/spl-token';
import axios from 'axios';

interface TokenInfo {
  mint: string;
  symbol: string;
  name: string;
  isMemecoin?: boolean;
  age: number;
}

interface TokenGainer {
  mint: string;
  symbol: string;
  name: string;
  priceChange: number;
  currentPrice: number;
  previousPrice: number;
  volume: number;
  marketCap: number;
  isMemecoin: boolean;
  age: number;
}

const JUPITER_PRICE_API = 'https://price.jup.ag/v4/price';
const JUPITER_HISTORICAL_API = 'https://price.jup.ag/v4/historical';

async function getTokenPrice(mint: PublicKey): Promise<number> {
  try {
    const response = await axios.get(JUPITER_PRICE_API, {
      params: {
        ids: mint.toString()
      }
    });
    return response.data.data[mint.toString()]?.price || 0;
  } catch (error) {
    console.error('Error fetching token price:', error);
    return 0;
  }
}

async function getHistoricalTokenPrice(mint: PublicKey, timestamp: number): Promise<number> {
  try {
    const response = await axios.get(JUPITER_HISTORICAL_API, {
      params: {
        id: mint.toString(),
        timestamp
      }
    });
    return response.data.data.price || 0;
  } catch (error) {
    console.error('Error fetching historical price:', error);
    return 0;
  }
}

async function getTokenMetadata(mint: string): Promise<{ symbol: string; name: string }> {
  try {
    const response = await axios.get(`https://api.solscan.io/token/meta?mint=${mint}`);
    return {
      symbol: response.data.symbol || 'Unknown',
      name: response.data.name || 'Unknown Token'
    };
  } catch (error) {
    console.error('Error fetching token metadata:', error);
    return { symbol: 'Unknown', name: 'Unknown Token' };
  }
}

async function calculateTokenVolume(mint: PublicKey, startTime: number): Promise<number> {
  try {
    const response = await axios.get(`https://api.solscan.io/amm/market?mint=${mint.toString()}`);
    return response.data.volume24h || 0;
  } catch (error) {
    console.error('Error calculating volume:', error);
    return 0;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get('hours') || '24');
    const limit = parseInt(searchParams.get('limit') || '10');
    const onlyMemecoins = searchParams.get('onlyMemecoins') === 'true';
    const maxAge = parseInt(searchParams.get('maxAge') || '30');
    const minVolume = parseFloat(searchParams.get('minVolume') || '1000');
    const minPriceChange = parseFloat(searchParams.get('minPriceChange') || '10');
    const minMarketCap = parseFloat(searchParams.get('minMarketCap') || '10000');

    // Initialize Solana connection
    const connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
    );

    // Get recent token mints
    const recentTokens: TokenInfo[] = await connection.getProgramAccounts(
      new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      {
        filters: [
          {
            dataSize: 165,
          },
        ],
      }
    ).then(async (accounts) => {
      const tokens = await Promise.all(
        accounts.slice(0, 100).map(async (account) => {
          const mint = account.pubkey.toString();
          const metadata = await getTokenMetadata(mint);
          return {
            mint,
            symbol: metadata.symbol,
            name: metadata.name,
            isMemecoin: metadata.name.toLowerCase().includes('meme') ||
                       metadata.symbol.toLowerCase().includes('meme'),
            age: Math.floor((Date.now() - account.account.lamports) / (1000 * 60 * 60 * 24))
          };
        })
      );
      return tokens.filter(token => token.age <= maxAge);
    });

    // Filter tokens based on criteria
    const filteredTokens = recentTokens.filter(token =>
      (!onlyMemecoins || token.isMemecoin) &&
      token.age <= maxAge
    );

    // Track token price movements
    const tokenGainers: TokenGainer[] = await Promise.all(
      filteredTokens.map(async (token) => {
        const mint = new PublicKey(token.mint);
        const currentTime = Math.floor(Date.now() / 1000);
        const startTime = currentTime - (hours * 3600);

        const [currentPrice, previousPrice, volume, mintInfo] = await Promise.all([
          getTokenPrice(mint),
          getHistoricalTokenPrice(mint, startTime),
          calculateTokenVolume(mint, startTime),
          getMint(connection, mint)
        ]);

        const marketCap = currentPrice * (Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals));
        const priceChange = ((currentPrice - previousPrice) / previousPrice) * 100;

        return {
          mint: token.mint,
          symbol: token.symbol,
          name: token.name,
          priceChange,
          currentPrice,
          previousPrice,
          volume,
          marketCap,
          isMemecoin: token.isMemecoin || false,
          age: token.age
        };
      })
    );

    // Filter and sort
    const filteredGainers = tokenGainers
      .filter(token =>
        token.volume >= minVolume &&
        token.priceChange >= minPriceChange &&
        token.marketCap >= minMarketCap
      )
      .sort((a, b) => b.priceChange - a.priceChange)
      .slice(0, limit);

    return NextResponse.json({
      period: `${hours} hours`,
      filters: {
        onlyMemecoins,
        maxAge,
        minVolume,
        minPriceChange,
        minMarketCap
      },
      tokens: filteredGainers
    });

  } catch (error) {
    console.error('Error fetching token gainers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token gainers information' },
      { status: 500 }
    );
  }
}