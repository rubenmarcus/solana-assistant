import { NextResponse } from 'next/server';
import { Connection } from '@solana/web3.js';

export async function GET() {
  try {
    // Initialize Solana connection
    const connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
    );

    // Get various blockchain metrics
    const [
      epochInfo,
      supply,
      recentPerformance,
      validators,
      currentSlot
    ] = await Promise.all([
      connection.getEpochInfo(),
      connection.getSupply(),
      connection.getRecentPerformanceSamples(1),
      connection.getVoteAccounts(),
      connection.getSlot()
    ]);

    // Calculate TPS (Transactions Per Second)
    const tps = recentPerformance[0]?.numSlots
      ? recentPerformance[0].numTransactions / recentPerformance[0].numSlots
      : 0;

    // Get validator information
    const activeValidators = validators.current.length;
    const totalStake = validators.current.reduce(
      (sum, validator) => sum + validator.activatedStake,
      0
    );

    return NextResponse.json({
      currentEpoch: epochInfo.epoch,
      slot: currentSlot,
      transactionStats: {
        tps,
        totalTransactions: recentPerformance[0]?.numTransactions || 0
      },
      supply: {
        total: supply.value.total / 1e9,
        circulating: supply.value.circulating / 1e9,
        nonCirculating: (supply.value.total - supply.value.circulating) / 1e9
      },
      validators: {
        active: activeValidators,
        totalStake: totalStake / 1e9,
        currentValidators: validators.current.map(v => ({
          votePubkey: v.votePubkey,
          commission: v.commission,
          activatedStake: v.activatedStake / 1e9
        }))
      },
      networkHealth: {
        slotTime: recentPerformance[0]?.samplePeriodSecs || 0,
        slotsInSample: recentPerformance[0]?.numSlots || 0
      }
    });

  } catch (error) {
    console.error('Error fetching blockchain stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blockchain statistics' },
      { status: 500 }
    );
  }
}