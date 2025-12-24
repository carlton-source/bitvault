import { Core } from '@walletconnect/core';
import { WalletKit, WalletKitTypes } from '@reown/walletkit';
import { buildAuthPayloadUrl, getSdkError } from '@walletconnect/utils';

// WalletConnect configuration
const WALLET_CONNECT_PROJECT_ID = process.env.WALLET_CONNECT_PROJECT_ID || 'YOUR_PROJECT_ID';

// Initialize WalletConnect Core
const core = new Core({
  projectId: WALLET_CONNECT_PROJECT_ID,
});

// Initialize WalletKit
export const walletKit = await WalletKit.init({
  core,
  metadata: {
    name: 'BitVault',
    description: 'BitVault - Stacks Vault Application',
    url: 'https://bitvault.example.com',
    icons: ['https://bitvault.example.com/icon.png'],
  },
});

// Stacks chain information
export const STACKS_CHAINS = {
  mainnet: 'stacks:1',
  testnet: 'stacks:2147483648',
};

// Get addresses for the active account
export async function getStacksAddresses(): Promise<{
  symbol: string;
  address: string;
}[]> {
  // This should return your wallet's Stacks addresses
  // You'll need to implement this based on your wallet implementation
  return [
    {
      symbol: 'STX',
      address: 'SP...' // Replace with actual address from your wallet
    }
  ];
}

// Handle session proposal
walletKit.on('session_proposal', async (proposal: WalletKitTypes.SessionProposal) => {
  console.log('Session proposal received:', proposal);

  const { id, params } = proposal;
  const { requiredNamespaces, optionalNamespaces } = params;

  try {
    // Get addresses from your wallet
    const addresses = await getStacksAddresses();
    
    // Build namespaces for approval
    const namespaces: Record<string, any> = {};

    // Handle required namespaces
    if (requiredNamespaces.stacks) {
      const stacksAddresses = addresses.map(addr => `${STACKS_CHAINS.mainnet}:${addr.address}`);
      
      namespaces.stacks = {
        accounts: stacksAddresses,
        methods: requiredNamespaces.stacks.methods || [
          'stx_getAddresses',
          'stx_transferStx',
          'stx_signTransaction',
          'stx_signMessage',
          'stx_signStructuredMessage',
          'stx_callContract',
        ],
        events: requiredNamespaces.stacks.events || [],
        chains: requiredNamespaces.stacks.chains || [STACKS_CHAINS.mainnet],
      };
    }

    // Approve the session
    const session = await walletKit.approveSession({
      id,
      namespaces,
    });

    console.log('Session approved:', session);
  } catch (error) {
    console.error('Error approving session:', error);
    
    // Reject the session
    await walletKit.rejectSession({
      id,
      reason: getSdkError('USER_REJECTED'),
    });
  }
});

// Handle session request
walletKit.on('session_request', async (event: WalletKitTypes.SessionRequest) => {
  console.log('Session request received:', event);

  const { topic, params, id } = event;
  const { request } = params;

  try {
    let result: any;

    switch (request.method) {
      case 'stx_getAddresses':
        result = await handleGetAddresses();
        break;

      case 'stx_transferStx':
        result = await handleTransferStx(request.params);
        break;

      case 'stx_signTransaction':
        result = await handleSignTransaction(request.params);
        break;

      case 'stx_signMessage':
        result = await handleSignMessage(request.params);
        break;

      case 'stx_signStructuredMessage':
        result = await handleSignStructuredMessage(request.params);
        break;

      case 'stx_callContract':
        result = await handleCallContract(request.params);
        break;

      default:
        throw new Error(`Unsupported method: ${request.method}`);
    }

    // Send successful response
    await walletKit.respondSessionRequest({
      topic,
      response: {
        id,
        jsonrpc: '2.0',
        result,
      },
    });
  } catch (error: any) {
    console.error('Error handling session request:', error);

    // Send error response
    await walletKit.respondSessionRequest({
      topic,
      response: {
        id,
        jsonrpc: '2.0',
        error: {
          code: 5000,
          message: error.message || 'Request failed',
        },
      },
    });
  }
});

// Handle session delete
walletKit.on('session_delete', (event: WalletKitTypes.SessionDelete) => {
  console.log('Session deleted:', event);
  // Clean up any session-related data
});

// Request handlers
async function handleGetAddresses() {
  const addresses = await getStacksAddresses();
  return { addresses };
}

async function handleTransferStx(params: {
  sender: string;
  recipient: string;
  amount: string;
  memo?: string;
  network?: string;
}) {
  // Implement STX transfer logic
  // This should use @stacks/transactions to create and sign a transfer transaction
  console.log('Transfer STX:', params);
  
  // Example implementation (you'll need to complete this):
  // const transaction = await makeSTXTokenTransfer({
  //   recipient: params.recipient,
  //   amount: new BN(params.amount),
  //   memo: params.memo,
  //   network: getStacksNetwork(params.network),
  //   anchorMode: AnchorMode.Any,
  //   senderKey: YOUR_PRIVATE_KEY,
  // });
  // const broadcastResponse = await broadcastTransaction(transaction);
  
  return {
    txid: 'transaction_id_here',
    transaction: '0x...',
  };
}

async function handleSignTransaction(params: {
  transaction: string;
  broadcast?: boolean;
  network?: string;
}) {
  // Implement transaction signing logic
  console.log('Sign transaction:', params);
  
  return {
    signature: '0x...',
    transaction: params.transaction,
    ...(params.broadcast && { txid: 'transaction_id_here' }),
  };
}

async function handleSignMessage(params: {
  address: string;
  message: string;
  messageType?: string;
  network?: string;
  domain?: string;
}) {
  // Implement message signing logic
  console.log('Sign message:', params);
  
  return {
    signature: '0x...',
  };
}

async function handleSignStructuredMessage(params: {
  message: string | object;
  domain: string | object;
}) {
  // Implement structured message signing (SIP-018)
  console.log('Sign structured message:', params);
  
  return {
    signature: '0x...',
    publicKey: '0x04...',
  };
}

async function handleCallContract(params: {
  contract: string;
  functionName: string;
  functionArgs: string[];
}) {
  // Implement contract call logic
  console.log('Call contract:', params);
  
  // Example implementation (you'll need to complete this):
  // const transaction = await makeContractCall({
  //   contractAddress: contractAddress,
  //   contractName: contractName,
  //   functionName: params.functionName,
  //   functionArgs: params.functionArgs.map(arg => deserializeCV(arg)),
  //   network: YOUR_NETWORK,
  //   anchorMode: AnchorMode.Any,
  //   senderKey: YOUR_PRIVATE_KEY,
  // });
  
  return {
    txid: 'transaction_id_here',
    transaction: '0x...',
  };
}

// Utility function to pair with a dApp
export async function pairWithDapp(uri: string) {
  try {
    await walletKit.pair({ uri });
    console.log('Pairing initiated with URI:', uri);
  } catch (error) {
    console.error('Error pairing with dApp:', error);
    throw error;
  }
}

// Get active sessions
export function getActiveSessions() {
  return walletKit.getActiveSessions();
}

// Disconnect a session
export async function disconnectSession(topic: string) {
  await walletKit.disconnectSession({
    topic,
    reason: getSdkError('USER_DISCONNECTED'),
  });
}
