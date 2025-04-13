import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';

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

    // Get account information
    const accountInfo = await connection.getAccountInfo(publicKey);
    const balance = await connection.getBalance(publicKey);

    // Get token accounts
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
      programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
    });

    // Get transaction count
    const transactionCount = await connection.getTransactionCount({
      commitment: 'confirmed'
    });

    // Get recent transactions
    const recentTransactions = await connection.getSignaturesForAddress(publicKey, {
      limit: 5
    });

    // Get NFT holdings
    const nftAccounts = tokenAccounts.value.filter(account =>
      account.account.data.parsed.info.tokenAmount.decimals === 0 &&
      account.account.data.parsed.info.tokenAmount.amount === '1'
    );

    return NextResponse.json({
      address: address,
      balance: balance / 1e9, // Convert lamports to SOL
      isExecutable: accountInfo?.executable || false,
      tokenAccounts: tokenAccounts.value.map(account => ({
        mint: account.account.data.parsed.info.mint,
        amount: account.account.data.parsed.info.tokenAmount.amount,
        decimals: account.account.data.parsed.info.tokenAmount.decimals
      })),
      nftCount: nftAccounts.length,
      transactionCount,
      recentTransactions: recentTransactions.map(tx => ({
        signature: tx.signature,
        slot: tx.slot,
        blockTime: tx.blockTime,
        status: tx.err ? 'failed' : 'success'
      }))
    });

  } catch (error) {
    console.error('Error fetching address info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch address information' },
      { status: 500 }
    );
  }
}