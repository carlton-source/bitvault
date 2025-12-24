/**
 * Complete Example: Using WalletConnect with BitVault
 * 
 * This example demonstrates how to:
 * 1. Initialize WalletConnect
 * 2. Connect to a dApp
 * 3. Handle session proposals and requests
 * 4. Interact with the BitVault contract
 */

import { 
  walletKit, 
  pairWithDapp, 
  getActiveSessions, 
  disconnectSession 
} from './walletConnect';

import {
  depositToVault,
  withdrawFromVault,
  swapSbtcForToken,
  addLiquidity,
  signAndBroadcastTransaction,
  exampleDepositFlow,
  exampleSwapFlow
} from './bitvaultIntegration';

// ============================================================================
// Example 1: Connecting to a dApp
// ============================================================================

async function connectToDapp() {
  console.log('=== Connecting to dApp ===');
  
  // User scans QR code or copies URI from dApp
  const wcUri = 'wc:1234567890abcdef...'; // Example URI
  
  try {
    await pairWithDapp(wcUri);
    console.log('✓ Pairing initiated');
    
    // The 'session_proposal' event will be triggered
    // See walletConnect.ts for the handler
  } catch (error) {
    console.error('✗ Connection failed:', error);
  }
}

// ============================================================================
// Example 2: Managing Active Sessions
// ============================================================================

async function manageSessionsExample() {
  console.log('=== Managing Sessions ===');
  
  // Get all active sessions
  const sessions = getActiveSessions();
  console.log(`Active sessions: ${Object.keys(sessions).length}`);
  
  // Display session information
  for (const [topic, session] of Object.entries(sessions)) {
    console.log('\nSession:');
    console.log('  Topic:', topic);
    console.log('  dApp:', session.peer.metadata.name);
    console.log('  URL:', session.peer.metadata.url);
    console.log('  Connected chains:', session.namespaces.stacks?.chains);
  }
  
  // Disconnect a specific session
  if (Object.keys(sessions).length > 0) {
    const firstTopic = Object.keys(sessions)[0];
    await disconnectSession(firstTopic);
    console.log(`\n✓ Disconnected session: ${firstTopic.substring(0, 10)}...`);
  }
}

// ============================================================================
// Example 3: Deposit sBTC to Vault
// ============================================================================

async function depositExample() {
  console.log('=== Depositing to BitVault ===');
  
  // Get active session (assuming we have one)
  const sessions = getActiveSessions();
  const sessionTopic = Object.keys(sessions)[0];
  
  if (!sessionTopic) {
    console.error('✗ No active session. Connect to a dApp first.');
    return;
  }
  
  // User's Stacks address
  const userAddress = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
  
  // Deposit 0.5 sBTC
  const amountInSbtc = 0.5;
  
  try {
    const result = await exampleDepositFlow(sessionTopic, userAddress, amountInSbtc);
    console.log('✓ Deposit successful!');
    console.log('  TxID:', result.txid);
    console.log('  View on explorer: https://explorer.hiro.so/txid/' + result.txid + '?chain=testnet');
  } catch (error) {
    console.error('✗ Deposit failed:', error);
  }
}

// ============================================================================
// Example 4: Swap sBTC for Tokens
// ============================================================================

async function swapExample() {
  console.log('=== Swapping sBTC for Tokens ===');
  
  const sessions = getActiveSessions();
  const sessionTopic = Object.keys(sessions)[0];
  
  if (!sessionTopic) {
    console.error('✗ No active session. Connect to a dApp first.');
    return;
  }
  
  const userAddress = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
  const tokenContract = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.example-token';
  const amountInSbtc = 0.1;
  const slippagePercent = 5; // 5% slippage tolerance
  
  try {
    const result = await exampleSwapFlow(
      sessionTopic,
      userAddress,
      tokenContract,
      amountInSbtc,
      slippagePercent
    );
    console.log('✓ Swap successful!');
    console.log('  TxID:', result.txid);
  } catch (error) {
    console.error('✗ Swap failed:', error);
  }
}

// ============================================================================
// Example 5: Add Liquidity to Pool
// ============================================================================

async function addLiquidityExample() {
  console.log('=== Adding Liquidity ===');
  
  const sessions = getActiveSessions();
  const sessionTopic = Object.keys(sessions)[0];
  
  if (!sessionTopic) {
    console.error('✗ No active session. Connect to a dApp first.');
    return;
  }
  
  const userAddress = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
  const tokenContract = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.example-token';
  
  // Add 1 sBTC and 1000 tokens to the pool
  const sbtcAmount = BigInt(1_000_000); // 1 sBTC in micro-sBTC
  const tokenAmount = BigInt(1000);
  const minLpTokens = BigInt(900); // Minimum LP tokens (10% slippage)
  
  try {
    console.log('Creating add liquidity transaction...');
    
    const txHex = await addLiquidity(
      tokenContract,
      sbtcAmount,
      tokenAmount,
      minLpTokens,
      'testnet'
    );
    
    console.log('Transaction created, requesting signature...');
    
    const result = await signAndBroadcastTransaction(
      sessionTopic,
      txHex,
      true,
      'testnet'
    );
    
    console.log('✓ Liquidity added successfully!');
    console.log('  TxID:', result.txid);
    console.log('  LP tokens received: (check transaction details)');
  } catch (error) {
    console.error('✗ Adding liquidity failed:', error);
  }
}

// ============================================================================
// Example 6: Withdraw from Vault
// ============================================================================

async function withdrawExample() {
  console.log('=== Withdrawing from Vault ===');
  
  const sessions = getActiveSessions();
  const sessionTopic = Object.keys(sessions)[0];
  
  if (!sessionTopic) {
    console.error('✗ No active session. Connect to a dApp first.');
    return;
  }
  
  const userAddress = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
  
  // Withdraw 100 vault shares
  const sharesToWithdraw = BigInt(100);
  
  try {
    console.log('Creating withdrawal transaction...');
    
    const txHex = await withdrawFromVault(
      sharesToWithdraw,
      userAddress,
      'testnet'
    );
    
    console.log('Transaction created, requesting signature...');
    
    const result = await signAndBroadcastTransaction(
      sessionTopic,
      txHex,
      true,
      'testnet'
    );
    
    console.log('✓ Withdrawal successful!');
    console.log('  TxID:', result.txid);
    console.log('  sBTC received: (check transaction details)');
  } catch (error) {
    console.error('✗ Withdrawal failed:', error);
  }
}

// ============================================================================
// Example 7: Complete User Flow
// ============================================================================

async function completeUserFlow() {
  console.log('\n========================================');
  console.log('Complete BitVault User Flow');
  console.log('========================================\n');
  
  try {
    // Step 1: Connect to dApp
    console.log('Step 1: Connecting to dApp...');
    // await connectToDapp();
    // Wait for session to be established
    
    // Step 2: Check sessions
    console.log('\nStep 2: Checking active sessions...');
    await manageSessionsExample();
    
    // Step 3: Deposit to vault
    console.log('\nStep 3: Depositing to vault...');
    // await depositExample();
    
    // Step 4: Check balance and perform swap
    console.log('\nStep 4: Performing a swap...');
    // await swapExample();
    
    // Step 5: Add liquidity
    console.log('\nStep 5: Adding liquidity...');
    // await addLiquidityExample();
    
    // Step 6: Withdraw from vault
    console.log('\nStep 6: Withdrawing from vault...');
    // await withdrawExample();
    
    console.log('\n✓ All operations completed successfully!');
  } catch (error) {
    console.error('\n✗ Flow failed:', error);
  }
}

// ============================================================================
// Export all examples
// ============================================================================

export {
  connectToDapp,
  manageSessionsExample,
  depositExample,
  swapExample,
  addLiquidityExample,
  withdrawExample,
  completeUserFlow
};

// ============================================================================
// Run examples (uncomment to test)
// ============================================================================

// To run these examples:
// 1. Ensure you have a WalletConnect Project ID in your .env file
// 2. Update the contract addresses in bitvaultIntegration.ts
// 3. Uncomment the example you want to run:

// connectToDapp();
// manageSessionsExample();
// depositExample();
// swapExample();
// addLiquidityExample();
// withdrawExample();
// completeUserFlow();
