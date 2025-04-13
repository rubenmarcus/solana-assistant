import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { getMint } from '@solana/spl-token';

export const dynamic = 'force-dynamic';

// Revalidate every 30 seconds
export const revalidate = 30;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const mint = searchParams.get('mint');

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

    if (mint) {
      // Get specific token information
      try {
        const mintPublicKey = new PublicKey(mint);
        const mintInfo = await getMint(connection, mintPublicKey);
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
          mint: mintPublicKey
        });

        return NextResponse.json({
          mint: mint,
          decimals: mintInfo.decimals,
          supply: mintInfo.supply.toString(),
          tokenAccounts: tokenAccounts.value.map(account => ({
            address: account.pubkey.toString(),
            amount: account.account.data.parsed.info.tokenAmount.amount,
            decimals: account.account.data.parsed.info.tokenAmount.decimals
          }))
        });
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid token mint address' },
          { status: 400 }
        );
      }
    } else {
      // Get all token accounts
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
      });

      // Get mint information for each token
      const tokenInfo = await Promise.all(
        tokenAccounts.value.map(async (account) => {
          try {
            const mintInfo = await getMint(
              connection,
              new PublicKey(account.account.data.parsed.info.mint)
            );
            return {
              mint: account.account.data.parsed.info.mint,
              decimals: mintInfo.decimals,
              supply: mintInfo.supply.toString(),
              amount: account.account.data.parsed.info.tokenAmount.amount,
              isNFT: mintInfo.decimals === 0 && account.account.data.parsed.info.tokenAmount.amount === '1'
            };
          } catch (error) {
            return {
              mint: account.account.data.parsed.info.mint,
              error: 'Failed to fetch mint information'
            };
          }
        })
      );

      return NextResponse.json({
        address,
        tokens: tokenInfo,
        totalTokens: tokenAccounts.value.length
      });
    }

  } catch (error) {
    console.error('Error fetching token information:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token information' },
      { status: 500 }
    );
  }
}