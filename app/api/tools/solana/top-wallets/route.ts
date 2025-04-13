import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';

interface AccountInfo {
  address: string;
  balance: number;
  transactionCount: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Initialize Solana connection
    const connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
    );

    // Get largest accounts
    const largestAccounts = await connection.getLargestAccounts({
      commitment: 'confirmed'
    });

    // Get account information for each address
    const accounts = await Promise.all(
      largestAccounts.value.map(async (account) => {
        const address = account.address.toString();
        const balance = account.lamports / 1e9; // Convert lamports to SOL

        // Get transaction count
        const transactionCount = await connection.getTransactionCount({
          commitment: 'confirmed'
        });

        return {
          address,
          balance,
          transactionCount,
        } as AccountInfo;
      })
    );

    // Sort by balance in descending order
    accounts.sort((a: AccountInfo, b: AccountInfo) => b.balance - a.balance);

    return NextResponse.json({
      total: largestAccounts.value.length,
      accounts,
    });

  } catch (error) {
    console.error('Error fetching top wallets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top wallets information' },
      { status: 500 }
    );
  }
}