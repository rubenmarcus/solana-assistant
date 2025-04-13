import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';

export const dynamic = 'force-dynamic';

interface WalletProfit {
  address: string;
  profit: number;
  transactions: number;
  startBalance: number;
  endBalance: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Initialize Solana connection
    const connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
    );

    // Get current slot and calculate start slot (roughly 7 days ago)
    const currentSlot = await connection.getSlot();
    const slotsPerDay = 432000; // Approximate slots per day
    const startSlot = currentSlot - (slotsPerDay * days);

    // Get largest accounts
    const largestAccounts = await connection.getLargestAccounts();

    // Track wallet profits
    const walletProfits: WalletProfit[] = await Promise.all(
      largestAccounts.value.slice(0, limit).map(async (account) => {
        const address = account.address.toString();

        // Get historical balance at start slot
        const startBalance = await connection.getBalance(
          new PublicKey(address),
          { commitment: 'confirmed', minContextSlot: startSlot }
        );

        // Get current balance
        const endBalance = await connection.getBalance(
          new PublicKey(address),
          { commitment: 'confirmed' }
        );

        // Get transaction count in period
        const signatures = await connection.getSignaturesForAddress(
          new PublicKey(address),
          { limit: 1000, minContextSlot: startSlot }
        );

        return {
          address,
          profit: (endBalance - startBalance) / 1e9, // Convert lamports to SOL
          transactions: signatures.length,
          startBalance: startBalance / 1e9,
          endBalance: endBalance / 1e9
        };
      })
    );

    // Sort by profit in descending order
    walletProfits.sort((a, b) => b.profit - a.profit);

    return NextResponse.json({
      period: `${days} days`,
      wallets: walletProfits
    });

  } catch (error) {
    console.error('Error fetching profitable wallets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profitable wallets information' },
      { status: 500 }
    );
  }
}