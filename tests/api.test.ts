import { describe, it, expect } from '@jest/globals';
import { Connection, PublicKey } from '@solana/web3.js';

describe('Solana API Endpoints', () => {
  const connection = new Connection('https://api.mainnet-beta.solana.com');
  const testAddress = 'vines1vzrYbzLMRdu58ou5Vby4mSBxeWrB5t3YvKXg3Wr'; // Example Solana address

  it('should validate Solana address format', async () => {
    try {
      new PublicKey(testAddress);
      expect(true).toBe(true);
    } catch (error) {
      expect(error).toBeUndefined();
    }
  });

  it('should fetch account balance', async () => {
    const balance = await connection.getBalance(new PublicKey(testAddress));
    expect(typeof balance).toBe('number');
    expect(balance).toBeGreaterThanOrEqual(0);
  });

  it('should fetch token accounts', async () => {
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      new PublicKey(testAddress),
      {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
      }
    );
    expect(Array.isArray(tokenAccounts.value)).toBe(true);
  });

  it('should fetch recent transactions', async () => {
    const signatures = await connection.getSignaturesForAddress(
      new PublicKey(testAddress),
      { limit: 5 }
    );
    expect(Array.isArray(signatures)).toBe(true);
    expect(signatures.length).toBeLessThanOrEqual(5);
  });

  it('should fetch epoch information', async () => {
    const epochInfo = await connection.getEpochInfo();
    expect(epochInfo).toHaveProperty('epoch');
    expect(epochInfo).toHaveProperty('slotIndex');
    expect(epochInfo).toHaveProperty('slotsInEpoch');
  });

  it('should fetch supply information', async () => {
    const supply = await connection.getSupply();
    expect(supply).toHaveProperty('total');
    expect(supply).toHaveProperty('circulating');
    expect(supply).toHaveProperty('nonCirculating');
  });
});