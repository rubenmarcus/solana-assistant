import { NextResponse } from 'next/server';
import { Connection, PublicKey, VersionedTransaction } from '@solana/web3.js';

// Helper function to delay execution
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to batch array into chunks
const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    // Default to 1 transaction if limit is not specified
    const limit = parseInt(searchParams.get('limit') || '1');

    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400 }
      );
    }

    // Initialize Solana connection with error handling
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    if (!rpcUrl) {
      return NextResponse.json(
        { error: 'Solana RPC URL is not configured' },
        { status: 500 }
      );
    }

    const connection = new Connection(rpcUrl, 'confirmed');

    // Validate and create PublicKey
    let publicKey: PublicKey;
    try {
      publicKey = new PublicKey(address);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid Solana address format' },
        { status: 400 }
      );
    }

    // Get transaction signatures with error handling
    let signatures;
    try {
      signatures = await connection.getSignaturesForAddress(publicKey, {
        limit: Math.min(limit, 100) // Cap at 100 transactions
      });
    } catch (error) {
      console.error('Error fetching signatures:', error);
      return NextResponse.json(
        { error: 'Failed to fetch transaction signatures from Solana network' },
        { status: 503 }
      );
    }

    // If no transactions found
    if (signatures.length === 0) {
      return NextResponse.json({
        address,
        transactions: [],
        total: 0,
        message: 'No transactions found for this address'
      });
    }

    // Process transactions in batches to avoid rate limiting
    const BATCH_SIZE = 5;
    const DELAY_MS = 1000; // 1 second delay between batches
    const signatureBatches = chunkArray(signatures, BATCH_SIZE);

    const transactions = [];
    for (const batch of signatureBatches) {
      const batchResults = await Promise.all(
        batch.map(async (signature) => {
          try {
            const tx = await connection.getTransaction(signature.signature, {
              maxSupportedTransactionVersion: 0
            });

            if (!tx) {
              return {
                signature: signature.signature,
                slot: signature.slot,
                blockTime: signature.blockTime,
                status: 'unknown',
                error: 'Transaction details not available'
              };
            }

            return {
              signature: signature.signature,
              slot: signature.slot,
              blockTime: signature.blockTime,
              status: signature.err ? 'failed' : 'success',
              fee: tx?.meta?.fee,
              preBalances: tx?.meta?.preBalances,
              postBalances: tx?.meta?.postBalances,
              instructions: tx?.transaction.message.compiledInstructions.map((ix: { programIdIndex: number; data: Uint8Array }) => ({
                programId: tx?.transaction.message.staticAccountKeys[ix.programIdIndex].toString(),
                data: Buffer.from(ix.data).toString('base64')
              }))
            };
          } catch (error) {
            console.error(`Error fetching transaction ${signature.signature}:`, error);
            return {
              signature: signature.signature,
              slot: signature.slot,
              blockTime: signature.blockTime,
              status: 'error',
              error: 'Failed to fetch transaction details'
            };
          }
        })
      );

      transactions.push(...batchResults);

      // Add delay between batches if there are more batches to process
      if (signatureBatches.indexOf(batch) < signatureBatches.length - 1) {
        await sleep(DELAY_MS);
      }
    }

    return NextResponse.json({
      address,
      transactions,
      total: signatures.length,
      message: limit === 1 ? 'Showing latest transaction' : `Showing ${transactions.length} transactions`
    });

  } catch (error) {
    console.error('Unexpected error in transaction history endpoint:', error);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred while fetching transaction history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}