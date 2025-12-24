import { makeContractCall, AnchorMode, PostConditionMode } from '@stacks/transactions';
import { StacksMainnet, StacksTestnet } from '@stacks/network';
import { walletKit } from './walletConnect';

/**
 * BitVault Contract Integration with WalletConnect
 * 
 * This file provides helper functions to interact with the BitVault contract
 * using WalletConnect for transaction signing.
 */

// Contract configuration
const BITVAULT_CONTRACT_ADDRESS = 'SP...'; // Replace with actual deployment address
const BITVAULT_CONTRACT_NAME = 'bitvault';
const SBTC_CONTRACT_ADDRESS = 'SP...'; // Replace with sBTC contract address
const SBTC_CONTRACT_NAME = 'sbtc-token';

// Network configuration
export function getNetwork(networkType: 'mainnet' | 'testnet' = 'testnet') {
  return networkType === 'mainnet' ? new StacksMainnet() : new StacksTestnet();
}

/**
 * Deposit sBTC into the vault
 * @param amount Amount in micro-sBTC (1 sBTC = 1,000,000 micro-sBTC)
 * @param senderAddress User's Stacks address
 * @param network Network to use ('mainnet' | 'testnet')
 * @returns Transaction hex for WalletConnect signing
 */
export async function depositToVault(
  amount: bigint,
  senderAddress: string,
  network: 'mainnet' | 'testnet' = 'testnet'
): Promise<string> {
  const stacksNetwork = getNetwork(network);

  const txOptions = {
    contractAddress: BITVAULT_CONTRACT_ADDRESS,
    contractName: BITVAULT_CONTRACT_NAME,
    functionName: 'deposit-to-vault',
    functionArgs: [
      // amount: uint
      { type: 'uint', value: amount },
    ],
    senderKey: '', // Empty - will be signed via WalletConnect
    network: stacksNetwork,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    fee: 1000n, // 0.001 STX fee
  };

  // Create unsigned transaction
  const transaction = await makeContractCall(txOptions);
  
  // Serialize to hex for WalletConnect
  return transaction.serialize().toString('hex');
}

/**
 * Withdraw sBTC from the vault
 * @param shares Number of vault shares to withdraw
 * @param senderAddress User's Stacks address
 * @param network Network to use ('mainnet' | 'testnet')
 * @returns Transaction hex for WalletConnect signing
 */
export async function withdrawFromVault(
  shares: bigint,
  senderAddress: string,
  network: 'mainnet' | 'testnet' = 'testnet'
): Promise<string> {
  const stacksNetwork = getNetwork(network);

  const transaction = await makeContractCall({
    contractAddress: BITVAULT_CONTRACT_ADDRESS,
    contractName: BITVAULT_CONTRACT_NAME,
    functionName: 'withdraw-from-vault',
    functionArgs: [
      { type: 'uint', value: shares },
    ],
    senderKey: '',
    network: stacksNetwork,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    fee: 1000n,
  });

  return transaction.serialize().toString('hex');
}

/**
 * Create a liquidity pool
 * @param tokenContract Token contract principal
 * @param sbtcAmount sBTC amount in micro-sBTC
 * @param tokenAmount Token amount
 * @param network Network to use
 * @returns Transaction hex for WalletConnect signing
 */
export async function createLiquidityPool(
  tokenContract: string,
  sbtcAmount: bigint,
  tokenAmount: bigint,
  network: 'mainnet' | 'testnet' = 'testnet'
): Promise<string> {
  const stacksNetwork = getNetwork(network);

  const transaction = await makeContractCall({
    contractAddress: BITVAULT_CONTRACT_ADDRESS,
    contractName: BITVAULT_CONTRACT_NAME,
    functionName: 'create-liquidity-pool',
    functionArgs: [
      { type: 'principal', value: tokenContract },
      { type: 'uint', value: sbtcAmount },
      { type: 'uint', value: tokenAmount },
    ],
    senderKey: '',
    network: stacksNetwork,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    fee: 2000n,
  });

  return transaction.serialize().toString('hex');
}

/**
 * Add liquidity to an existing pool
 * @param tokenContract Token contract principal
 * @param sbtcAmount sBTC amount to add
 * @param tokenAmount Token amount to add
 * @param minLpTokens Minimum LP tokens expected (slippage protection)
 * @param network Network to use
 * @returns Transaction hex for WalletConnect signing
 */
export async function addLiquidity(
  tokenContract: string,
  sbtcAmount: bigint,
  tokenAmount: bigint,
  minLpTokens: bigint,
  network: 'mainnet' | 'testnet' = 'testnet'
): Promise<string> {
  const stacksNetwork = getNetwork(network);

  const transaction = await makeContractCall({
    contractAddress: BITVAULT_CONTRACT_ADDRESS,
    contractName: BITVAULT_CONTRACT_NAME,
    functionName: 'add-liquidity',
    functionArgs: [
      { type: 'principal', value: tokenContract },
      { type: 'uint', value: sbtcAmount },
      { type: 'uint', value: tokenAmount },
      { type: 'uint', value: minLpTokens },
    ],
    senderKey: '',
    network: stacksNetwork,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    fee: 2000n,
  });

  return transaction.serialize().toString('hex');
}

/**
 * Swap sBTC for tokens
 * @param tokenContract Token contract to swap to
 * @param sbtcAmount Amount of sBTC to swap
 * @param minTokenOut Minimum tokens expected (slippage protection)
 * @param network Network to use
 * @returns Transaction hex for WalletConnect signing
 */
export async function swapSbtcForToken(
  tokenContract: string,
  sbtcAmount: bigint,
  minTokenOut: bigint,
  network: 'mainnet' | 'testnet' = 'testnet'
): Promise<string> {
  const stacksNetwork = getNetwork(network);

  const transaction = await makeContractCall({
    contractAddress: BITVAULT_CONTRACT_ADDRESS,
    contractName: BITVAULT_CONTRACT_NAME,
    functionName: 'swap-sbtc-for-token',
    functionArgs: [
      { type: 'principal', value: tokenContract },
      { type: 'uint', value: sbtcAmount },
      { type: 'uint', value: minTokenOut },
    ],
    senderKey: '',
    network: stacksNetwork,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    fee: 1500n,
  });

  return transaction.serialize().toString('hex');
}

/**
 * Request WalletConnect to sign and broadcast a transaction
 * @param topic WalletConnect session topic
 * @param transactionHex Transaction hex string
 * @param broadcast Whether to broadcast the transaction
 * @param network Network ('mainnet' | 'testnet')
 * @returns Transaction result with signature and txid
 */
export async function signAndBroadcastTransaction(
  topic: string,
  transactionHex: string,
  broadcast: boolean = true,
  network: 'mainnet' | 'testnet' = 'testnet'
): Promise<{ signature: string; transaction: string; txid?: string }> {
  const result = await walletKit.request({
    topic,
    chainId: network === 'mainnet' ? 'stacks:1' : 'stacks:2147483648',
    request: {
      method: 'stx_signTransaction',
      params: {
        transaction: transactionHex,
        broadcast,
        network,
      },
    },
  });

  return result;
}

/**
 * Example: Complete flow to deposit sBTC using WalletConnect
 */
export async function exampleDepositFlow(
  sessionTopic: string,
  userAddress: string,
  amountInSbtc: number
) {
  try {
    // Convert sBTC to micro-sBTC (1 sBTC = 1,000,000 micro-sBTC)
    const amountInMicroSbtc = BigInt(Math.floor(amountInSbtc * 1_000_000));

    console.log(`Depositing ${amountInSbtc} sBTC (${amountInMicroSbtc} micro-sBTC)...`);

    // Create unsigned transaction
    const txHex = await depositToVault(amountInMicroSbtc, userAddress, 'testnet');
    console.log('Transaction created:', txHex.substring(0, 20) + '...');

    // Sign and broadcast via WalletConnect
    const result = await signAndBroadcastTransaction(sessionTopic, txHex, true, 'testnet');
    
    console.log('Transaction broadcast!');
    console.log('TxID:', result.txid);
    console.log('Explorer:', `https://explorer.hiro.so/txid/${result.txid}?chain=testnet`);

    return result;
  } catch (error) {
    console.error('Deposit failed:', error);
    throw error;
  }
}

/**
 * Example: Complete flow to swap sBTC for tokens using WalletConnect
 */
export async function exampleSwapFlow(
  sessionTopic: string,
  userAddress: string,
  tokenContract: string,
  amountInSbtc: number,
  slippagePercent: number = 5
) {
  try {
    const amountInMicroSbtc = BigInt(Math.floor(amountInSbtc * 1_000_000));
    
    // Calculate minimum output with slippage (simplified)
    // In production, query the pool for expected output
    const minTokenOut = BigInt(0); // Set based on pool state and slippage

    console.log(`Swapping ${amountInSbtc} sBTC with ${slippagePercent}% slippage tolerance...`);

    const txHex = await swapSbtcForToken(
      tokenContract,
      amountInMicroSbtc,
      minTokenOut,
      'testnet'
    );

    const result = await signAndBroadcastTransaction(sessionTopic, txHex, true, 'testnet');
    
    console.log('Swap transaction broadcast!');
    console.log('TxID:', result.txid);

    return result;
  } catch (error) {
    console.error('Swap failed:', error);
    throw error;
  }
}
