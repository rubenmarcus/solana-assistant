import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import axios from 'axios';

export const dynamic = 'force-dynamic';

interface TokenAmount {
  amount: string;
  decimals: number;
  uiAmount: number;
  uiAmountString: string;
}

const JUPITER_TOKEN_LIST_API = 'https://token.jup.ag/all';
const JUPITER_PRICE_API = 'https://price.jup.ag/v4/price';

async function findTokenByTicker(ticker: string): Promise<{ mint: string; marketCap: number } | null> {
  try {
    const response = await axios.get(JUPITER_TOKEN_LIST_API);
    const matchingTokens = response.data.filter((token: any) =>
      token.symbol.toLowerCase() === ticker.toLowerCase()
    );

    if (matchingTokens.length === 0) {
      return null;
    }

    // Get prices for all matching tokens
    const prices = await Promise.all(
      matchingTokens.map((token: any) =>
        axios.get(JUPITER_PRICE_API, {
          params: { ids: token.address }
        })
      )
    );

    // Calculate market caps and find the highest
    const tokensWithMarketCap = matchingTokens.map((token: any, index: number) => {
      const price = prices[index].data.data[token.address]?.price || 0;
      const marketCap = price * (token.supply / Math.pow(10, token.decimals));
      return {
        mint: token.address,
        marketCap
      };
    });

    return tokensWithMarketCap.reduce((max: any, token: any) =>
      token.marketCap > max.marketCap ? token : max
    );
  } catch (error) {
    console.error('Error finding token:', error);
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');
    const mint = searchParams.get('mint');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!ticker && !mint) {
      return NextResponse.json(
        { error: 'Either ticker or mint address is required' },
        { status: 400 }
      );
    }

    const connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
    );

    // If ticker is provided, find the token with highest market cap
    let tokenMint = mint;
    if (ticker) {
      const token = await findTokenByTicker(ticker);
      if (!token) {
        return NextResponse.json(
          { error: `No token found with ticker ${ticker}` },
          { status: 404 }
        );
      }
      tokenMint = token.mint;
    }

    if (!tokenMint) {
      return NextResponse.json(
        { error: 'Token mint address not found' },
        { status: 400 }
      );
    }

    // Get largest token accounts
    const largestAccounts = await connection.getTokenLargestAccounts(
      new PublicKey(tokenMint)
    );

    // Get account information for each holder
    const holders = await Promise.all(
      largestAccounts.value.slice(0, limit).map(async (account) => {
        const tokenAccount = await connection.getParsedAccountInfo(account.address);
        const data = tokenAccount.value?.data as any;
        const owner = data.parsed.info.owner;
        const amount = Number(account.amount) / Math.pow(10, data.parsed.info.tokenAmount.decimals);

        return {
          address: owner,
          amount: amount.toString(),
        };
      })
    );

    // Calculate total supply and percentages
    const totalSupply = holders.reduce((sum, holder) => sum + parseFloat(holder.amount), 0);

    const holdersWithPercentage = holders.map(holder => ({
      ...holder,
      percentage: ((parseFloat(holder.amount) / totalSupply) * 100).toFixed(2) + '%',
    }));

    return NextResponse.json({
      mint: tokenMint,
      holders: holdersWithPercentage,
      totalSupply: totalSupply.toString(),
    });
  } catch (error) {
    console.error('Error fetching top holders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top holders' },
      { status: 500 }
    );
  }
}