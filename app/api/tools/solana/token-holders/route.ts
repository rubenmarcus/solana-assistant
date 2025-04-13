import { NextResponse } from 'next/server';
import { Connection, PublicKey, TokenAccountBalancePair } from '@solana/web3.js';

export const dynamic = 'force-dynamic';

interface TokenAccountData {
  parsed: {
    info: {
      owner: string;
    };
  };
}

interface TokenAmount {
  uiAmount: number;
  decimals: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mint = searchParams.get('mint');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!mint) {
      return NextResponse.json(
        { error: 'Mint address parameter is required' },
        { status: 400 }
      );
    }

    // Initialize Solana connection
    const connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
    );

    // Get largest token accounts for the specified mint
    const largestAccounts = await connection.getTokenLargestAccounts(
      new PublicKey(mint)
    );

    // Get account information for each holder
    const holders = await Promise.all(
      largestAccounts.value.map(async (account: TokenAccountBalancePair) => {
        const address = account.address.toString();
        const amount = Number(account.amount) || 0;

        // Get token account info
        const tokenAccount = await connection.getParsedAccountInfo(
          new PublicKey(address)
        );

        return {
          address,
          amount,
          owner: (tokenAccount.value?.data as TokenAccountData)?.parsed?.info?.owner,
        };
      })
    );

    // Sort by amount in descending order
    holders.sort((a, b) => b.amount - a.amount);

    return NextResponse.json({
      mint,
      total: largestAccounts.value.length,
      holders,
    });

  } catch (error) {
    console.error('Error fetching token holders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token holders information' },
      { status: 500 }
    );
  }
}