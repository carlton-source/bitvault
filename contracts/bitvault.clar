;; BitVault - Advanced sBTC Yield Farming & Automated Market Maker Protocol
;;
;; Title: BitVault - sBTC DeFi Yield Optimization Platform
;;
;; Summary: A comprehensive DeFi protocol enabling sBTC holders to maximize returns through
;;          automated yield farming strategies, liquidity provision, and decentralized trading
;;          on the Stacks blockchain with Bitcoin-native security guarantees.
;;
;; Description: BitVault revolutionizes Bitcoin DeFi by providing institutional-grade
;;              yield farming capabilities for sBTC holders. The protocol combines:
;;
;;              - Automated Yield Vaults: Deploy sBTC into optimized farming strategies
;;              - Liquidity Mining: Earn fees as a liquidity provider in sBTC trading pairs  
;;              - AMM Trading: Swap sBTC with other tokens using constant product formulas
;;              - Risk Management: Built-in slippage protection and emergency controls
;;              - Scalable Architecture: Designed for Stacks Layer 2 efficiency
;;
;;              Built specifically for the Bitcoin ecosystem, BitVault leverages Stacks'
;;              unique position as Bitcoin's smart contract layer to bring sophisticated
;;              DeFi primitives to the world's most secure blockchain network.

;; PROTOCOL CONSTANTS

(define-constant CONTRACT_OWNER tx-sender)
(define-constant SBTC_TOKEN_CONTRACT .sbtc-token-mock) ;; Reference to mock sBTC token contract
(define-constant PRECISION u1000000) ;; 6 decimal places for high-precision calculations
(define-constant MIN_DEPOSIT u1000) ;; Minimum deposit: 0.001 sBTC
(define-constant VAULT_FEE_BPS u100) ;; Performance fee: 1% (100 basis points)

;; ERROR DEFINITIONS

(define-constant ERR_NOT_AUTHORIZED (err u400))
(define-constant ERR_INSUFFICIENT_BALANCE (err u401))
(define-constant ERR_MIN_DEPOSIT_NOT_MET (err u402))
(define-constant ERR_VAULT_PAUSED (err u403))
(define-constant ERR_INVALID_AMOUNT (err u404))
(define-constant ERR_SLIPPAGE_EXCEEDED (err u405))
(define-constant ERR_POOL_NOT_FOUND (err u406))
(define-constant ERR_INSUFFICIENT_LIQUIDITY (err u407))

;; PROTOCOL STATE VARIABLES

(define-data-var vault-paused bool false)
(define-data-var total-value-locked uint u0)
(define-data-var yield-rate uint u500) ;; 5% APY (500 basis points)
(define-data-var admin principal CONTRACT_OWNER)

;; USER & LIQUIDITY DATA STRUCTURES

;; Vault participant tracking
(define-map user-deposits
  principal
  uint
)
(define-map user-shares
  principal
  uint
)
(define-map user-last-deposit-time
  principal
  uint
)

;; AMM liquidity pool data
(define-map liquidity-pools
  {
    token-a: principal,
    token-b: principal,
  }
  {
    reserve-a: uint,
    reserve-b: uint,
    total-supply: uint,
    fee-rate: uint,
  }
)

;; LP token ownership tracking
(define-map user-lp-tokens
  {
    user: principal,
    pool-id: {
      token-a: principal,
      token-b: principal,
    },
  }
  uint
)

;; Access control for administrative functions
(define-map authorized-callers
  principal
  bool
)