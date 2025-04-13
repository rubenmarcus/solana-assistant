import { NextResponse } from 'next/server';
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  TransactionInstruction,
  Keypair
} from '@solana/web3.js';
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from '@solana/spl-token';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      type,
      fromAddress,
      toAddress,
      amount,
      mintAddress,
      memo
    } = body;

    if (!type || !fromAddress) {
      return NextResponse.json(
        { error: 'Type and fromAddress are required' },
        { status: 400 }
      );
    }

    // Initialize Solana connection
    const connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
    );

    // Validate addresses
    let fromPublicKey: PublicKey;
    let toPublicKey: PublicKey | undefined;
    let mintPublicKey: PublicKey | undefined;

    try {
      fromPublicKey = new PublicKey(fromAddress);
      if (toAddress) toPublicKey = new PublicKey(toAddress);
      if (mintAddress) mintPublicKey = new PublicKey(mintAddress);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid address provided' },
        { status: 400 }
      );
    }

    // Create a new transaction
    const transaction = new Transaction();

    switch (type) {
      case 'transfer':
        if (!toPublicKey || !amount) {
          return NextResponse.json(
            { error: 'toAddress and amount are required for transfer' },
            { status: 400 }
          );
        }
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: fromPublicKey,
            toPubkey: toPublicKey,
            lamports: amount * 1e9 // Convert SOL to lamports
          })
        );
        break;

      case 'tokenTransfer':
        if (!toPublicKey || !mintPublicKey || !amount) {
          return NextResponse.json(
            { error: 'toAddress, mintAddress, and amount are required for token transfer' },
            { status: 400 }
          );
        }
        // Get associated token accounts
        const fromTokenAccount = await getAssociatedTokenAddress(
          mintPublicKey,
          fromPublicKey,
          false,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        );
        const toTokenAccount = await getAssociatedTokenAddress(
          mintPublicKey,
          toPublicKey,
          false,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        );

        // Add token transfer instruction
        transaction.add(
          createTransferInstruction(
            fromTokenAccount,
            toTokenAccount,
            fromPublicKey,
            BigInt(amount)
          )
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid transaction type' },
          { status: 400 }
        );
    }

    // Add memo if provided
    if (memo) {
      transaction.add(
        new TransactionInstruction({
          keys: [],
          programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
          data: Buffer.from(memo)
        })
      );
    }

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPublicKey;

    return NextResponse.json({
      transaction: transaction.serialize().toString('base64'),
      message: 'Transaction generated successfully',
      details: {
        type,
        from: fromAddress,
        to: toAddress,
        amount,
        mint: mintAddress,
        memo
      }
    });

  } catch (error) {
    console.error('Error generating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to generate transaction' },
      { status: 500 }
    );
  }
}