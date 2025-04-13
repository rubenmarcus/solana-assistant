import { ACCOUNT_ID } from '@/app/config';
import { NextResponse } from 'next/server';

export async function GET() {
  const pluginData = {
    openapi: '3.0.0',
    info: {
      title: 'Solana Assistant',
      description: 'API for retrieving and analyzing Solana blockchain data',
      version: '1.0.0',
    },
    servers: [
      {
        url: 'https://solana-assistant-agent.vercel.app',
      },
    ],
    'x-mb': {
      'account-id': ACCOUNT_ID,
      assistant: {
        name: 'Solana Assistant',
        image:
        "https://solana-assistant-agent.vercel.app/logo.png",
        description:
          "An assistant that provides detailed information about the Solana blockchain, including address analysis, transaction history, portfolio tracking, and blockchain statistics.",
        instructions:
          "You are a specialized assistant for the Solana blockchain. You can retrieve and analyze Solana blockchain data, including address information, transaction history, portfolio details, and blockchain statistics. When users ask about Solana addresses, transactions, or blockchain data, use the appropriate endpoints to fetch and present the information in a clear and organized manner.",
        tools: [
          { type: 'get-solana-address-info' },
          { type: 'get-solana-transactions' },
          { type: 'get-solana-portfolio' },
          { type: 'get-solana-stats' },
          { type: 'get-solana-tokens' },
          { type: 'generate-solana-tx' },
          { type: 'get-solana-top-holders' },
        ],
      },
    },
    paths: {
      '/api/tools/solana/address-info': {
        get: {
          summary: 'Get Solana address information',
          description: 'Retrieves detailed information about a Solana address',
          operationId: 'get-solana-address-info',
          parameters: [
            {
              name: 'address',
              in: 'query',
              required: true,
              schema: {
                type: 'string',
              },
              description: 'The Solana address to query',
            },
          ],
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      address: {
                        type: 'string',
                        description: 'The queried Solana address',
                      },
                      balance: {
                        type: 'string',
                        description: 'The address balance in SOL',
                      },
                      tokens: {
                        type: 'array',
                        description: 'List of tokens owned by the address',
                        items: {
                          type: 'object',
                        },
                      },
                      transactions: {
                        type: 'integer',
                        description: 'Number of transactions',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/tools/solana/transactions': {
        get: {
          summary: 'Get Solana transaction history',
          description: 'Retrieves transaction history for a Solana address',
          operationId: 'get-solana-transactions',
          parameters: [
            {
              name: 'address',
              in: 'query',
              required: true,
              schema: {
                type: 'string',
              },
              description: 'The Solana address to query',
            },
            {
              name: 'limit',
              in: 'query',
              required: false,
              schema: {
                type: 'integer',
                default: 10,
              },
              description: 'Number of transactions to return',
            },
          ],
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      transactions: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            signature: {
                              type: 'string',
                              description: 'Transaction signature',
                            },
                            timestamp: {
                              type: 'string',
                              description: 'Transaction timestamp',
                            },
                            type: {
                              type: 'string',
                              description: 'Transaction type',
                            },
                            status: {
                              type: 'string',
                              description: 'Transaction status',
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/tools/solana/portfolio': {
        get: {
          summary: 'Get Solana portfolio',
          description: 'Retrieves portfolio information for a Solana address',
          operationId: 'get-solana-portfolio',
          parameters: [
            {
              name: 'address',
              in: 'query',
              required: true,
              schema: {
                type: 'string',
              },
              description: 'The Solana address to query',
            },
          ],
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      address: {
                        type: 'string',
                        description: 'The queried Solana address',
                      },
                      totalValue: {
                        type: 'string',
                        description: 'Total portfolio value in SOL',
                      },
                      assets: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            mint: {
                              type: 'string',
                              description: 'Token mint address',
                            },
                            balance: {
                              type: 'string',
                              description: 'Token balance',
                            },
                            value: {
                              type: 'string',
                              description: 'Asset value in SOL',
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/tools/solana/stats': {
        get: {
          summary: 'Get Solana blockchain statistics',
          description: 'Retrieves current Solana blockchain statistics',
          operationId: 'get-solana-stats',
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      totalTransactions: {
                        type: 'integer',
                        description: 'Total number of transactions',
                      },
                      activeValidators: {
                        type: 'integer',
                        description: 'Number of active validators',
                      },
                      totalSupply: {
                        type: 'string',
                        description: 'Total SOL supply',
                      },
                      averageBlockTime: {
                        type: 'string',
                        description: 'Average block time',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/tools/solana/tokens': {
        get: {
          summary: 'Get Solana tokens',
          description: 'Retrieves tokens owned by a Solana address',
          operationId: 'get-solana-tokens',
          parameters: [
            {
              name: 'address',
              in: 'query',
              required: true,
              schema: {
                type: 'string',
              },
              description: 'The Solana address to query',
            },
          ],
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      tokens: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            mint: {
                              type: 'string',
                              description: 'Token mint address',
                            },
                            amount: {
                              type: 'string',
                              description: 'Token amount',
                            },
                            decimals: {
                              type: 'integer',
                              description: 'Token decimals',
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/tools/solana/top-holders': {
        get: {
          summary: 'Get top token holders',
          description: 'Retrieves the top holders of a specific token on Solana',
          operationId: 'get-solana-top-holders',
          parameters: [
            {
              name: 'mint',
              in: 'query',
              required: true,
              schema: {
                type: 'string',
              },
              description: 'The token mint address',
            },
            {
              name: 'limit',
              in: 'query',
              required: false,
              schema: {
                type: 'integer',
                default: 10,
              },
              description: 'Number of top holders to return',
            },
          ],
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      holders: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            address: {
                              type: 'string',
                              description: 'Holder address',
                            },
                            amount: {
                              type: 'string',
                              description: 'Token amount held',
                            },
                            percentage: {
                              type: 'string',
                              description: 'Percentage of total supply',
                            },
                          },
                        },
                      },
                      totalSupply: {
                        type: 'string',
                        description: 'Total token supply',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  return NextResponse.json(pluginData);
}
