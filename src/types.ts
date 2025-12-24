/**
 * Type definitions for WalletConnect integration with BitVault
 */

// WalletConnect types
export interface WalletMetadata {
  name: string;
  description: string;
  url: string;
  icons: string[];
}

export interface StacksAddress {
  symbol: 'STX';
  address: string;
}

export interface SessionNamespace {
  accounts: string[];
  methods: string[];
  events: string[];
  chains: string[];
}

export interface WalletConnectSession {
  topic: string;
  peer: {
    metadata: WalletMetadata;
  };
  namespaces: {
    stacks?: SessionNamespace;
  };
}

// Stacks transaction types
export type StacksNetwork = 'mainnet' | 'testnet' | 'devnet';

export interface TransactionResult {
  signature: string;
  transaction: string;
  txid?: string;
}

// BitVault specific types
export interface VaultDepositParams {
  amount: bigint;
  senderAddress: string;
  network?: StacksNetwork;
}

export interface VaultWithdrawParams {
  shares: bigint;
  senderAddress: string;
  network?: StacksNetwork;
}

export interface SwapParams {
  tokenContract: string;
  sbtcAmount: bigint;
  minTokenOut: bigint;
  network?: StacksNetwork;
}

export interface LiquidityParams {
  tokenContract: string;
  sbtcAmount: bigint;
  tokenAmount: bigint;
  minLpTokens: bigint;
  network?: StacksNetwork;
}

export interface CreatePoolParams {
  tokenContract: string;
  sbtcAmount: bigint;
  tokenAmount: bigint;
  network?: StacksNetwork;
}

// WalletConnect request/response types
export interface StxGetAddressesRequest {
  method: 'stx_getAddresses';
  params: {};
}

export interface StxGetAddressesResponse {
  addresses: StacksAddress[];
}

export interface StxTransferStxRequest {
  method: 'stx_transferStx';
  params: {
    sender: string;
    recipient: string;
    amount: string;
    memo?: string;
    network?: StacksNetwork;
  };
}

export interface StxTransferStxResponse {
  txid: string;
  transaction: string;
}

export interface StxSignTransactionRequest {
  method: 'stx_signTransaction';
  params: {
    transaction: string;
    broadcast?: boolean;
    network?: StacksNetwork;
  };
}

export interface StxSignTransactionResponse {
  signature: string;
  transaction: string;
  txid?: string;
}

export interface StxSignMessageRequest {
  method: 'stx_signMessage';
  params: {
    address: string;
    message: string;
    messageType?: 'utf8' | 'structured';
    network?: StacksNetwork;
    domain?: string;
  };
}

export interface StxSignMessageResponse {
  signature: string;
}

export interface StxSignStructuredMessageRequest {
  method: 'stx_signStructuredMessage';
  params: {
    message: string | object;
    domain: string | object;
  };
}

export interface StxSignStructuredMessageResponse {
  signature: string;
  publicKey?: string;
}

export interface StxCallContractRequest {
  method: 'stx_callContract';
  params: {
    contract: string;
    functionName: string;
    functionArgs: string[];
  };
}

export interface StxCallContractResponse {
  txid: string;
  transaction: string;
}

// Union types for all request/response types
export type StacksRequest =
  | StxGetAddressesRequest
  | StxTransferStxRequest
  | StxSignTransactionRequest
  | StxSignMessageRequest
  | StxSignStructuredMessageRequest
  | StxCallContractRequest;

export type StacksResponse =
  | StxGetAddressesResponse
  | StxTransferStxResponse
  | StxSignTransactionResponse
  | StxSignMessageResponse
  | StxSignStructuredMessageResponse
  | StxCallContractResponse;

// Vault state types
export interface VaultBalance {
  shares: bigint;
  sBtcValue: bigint;
}

export interface PoolState {
  sbtcReserve: bigint;
  tokenReserve: bigint;
  lpTokenSupply: bigint;
  totalFees: bigint;
}

export interface UserPoolPosition {
  lpTokens: bigint;
  sbtcShare: bigint;
  tokenShare: bigint;
}

// Error types
export enum BitVaultErrorCode {
  UNAUTHORIZED = 100,
  NOT_INITIALIZED = 200,
  ALREADY_INITIALIZED = 201,
  POOL_EXISTS = 300,
  INSUFFICIENT_BALANCE = 401,
  MIN_DEPOSIT_NOT_MET = 402,
  VAULT_PAUSED = 403,
  INVALID_AMOUNT = 404,
  SLIPPAGE_EXCEEDED = 405,
  POOL_NOT_FOUND = 406,
  INSUFFICIENT_LIQUIDITY = 407,
}

export interface BitVaultError {
  code: BitVaultErrorCode;
  message: string;
}

// Configuration types
export interface BitVaultConfig {
  contractAddress: string;
  contractName: string;
  sbtcContractAddress: string;
  sbtcContractName: string;
  network: StacksNetwork;
  walletConnectProjectId: string;
}

export interface WalletConnectConfig {
  projectId: string;
  metadata: WalletMetadata;
  chains: string[];
}

// Event types
export interface DepositEvent {
  type: 'deposit';
  user: string;
  amount: bigint;
  shares: bigint;
  timestamp: number;
}

export interface WithdrawEvent {
  type: 'withdraw';
  user: string;
  shares: bigint;
  amount: bigint;
  timestamp: number;
}

export interface SwapEvent {
  type: 'swap';
  user: string;
  tokenIn: string;
  amountIn: bigint;
  tokenOut: string;
  amountOut: bigint;
  timestamp: number;
}

export interface LiquidityEvent {
  type: 'liquidity_added' | 'liquidity_removed';
  user: string;
  sbtcAmount: bigint;
  tokenAmount: bigint;
  lpTokens: bigint;
  timestamp: number;
}

export type BitVaultEvent = DepositEvent | WithdrawEvent | SwapEvent | LiquidityEvent;

// Hook types for React components
export interface UseWalletConnectReturn {
  sessions: WalletConnectSession[];
  connect: (uri: string) => Promise<void>;
  disconnect: (topic: string) => Promise<void>;
  isConnected: boolean;
  activeSession: WalletConnectSession | null;
}

export interface UseBitVaultReturn {
  deposit: (amount: bigint) => Promise<TransactionResult>;
  withdraw: (shares: bigint) => Promise<TransactionResult>;
  swap: (params: SwapParams) => Promise<TransactionResult>;
  addLiquidity: (params: LiquidityParams) => Promise<TransactionResult>;
  balance: VaultBalance | null;
  loading: boolean;
  error: BitVaultError | null;
}
