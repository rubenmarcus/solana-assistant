import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { getMint } from '@solana/spl-token';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mint = searchParams.get('mint');

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

    // Get mint information
    const mintInfo = await getMint(connection, new PublicKey(mint));

    // Get token metadata
    const metadataAccount = await connection.getParsedAccountInfo(
      new PublicKey(mint)
    );

    // Get token supply
    const supply = mintInfo.supply.toString();

    // Get token holders count
    const tokenAccounts = await connection.getTokenLargestAccounts(
      new PublicKey(mint)
    );

    // Calculate distribution
    const holders = tokenAccounts.value.length;
    const totalSupply = Number(supply);
    const averageBalance = totalSupply / holders;

    return NextResponse.json({
      mint,
      metadata: metadataAccount.value?.data,
      supply: {
        total: supply,
        decimals: mintInfo.decimals,
      },
      distribution: {
        holders,
        averageBalance,
      },
      mintAuthority: mintInfo.mintAuthority?.toString(),
      freezeAuthority: mintInfo.freezeAuthority?.toString(),
    });

  } catch (error) {
    console.error('Error fetching token metadata:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token metadata' },
      { status: 500 }
    );
  }
}