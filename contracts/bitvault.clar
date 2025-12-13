;; BitVault - Advanced sBTC Yield Farming & Automated Market Maker Protocol
;; Clarity Version: 4
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

;; CORE PROTOCOL FUNCTIONS

;; Initialize BitVault Pro protocol
(define-public (initialize)
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_NOT_AUTHORIZED)
    (map-set authorized-callers CONTRACT_OWNER true)
    (ok true)
  )
)

;; VAULT OPERATIONS - YIELD FARMING CORE

;; Deposit sBTC into yield farming vault
(define-public (deposit-to-vault (amount uint))
  (let (
      (caller tx-sender)
      (current-balance (default-to u0 (map-get? user-deposits caller)))
      (current-shares (default-to u0 (map-get? user-shares caller)))
      (total-shares (calculate-total-shares))
      (new-shares (if (is-eq total-shares u0)
        amount
        (/ (* amount total-shares) (var-get total-value-locked))
      ))
    )
    ;; Input validation
    (asserts! (not (var-get vault-paused)) ERR_VAULT_PAUSED)
    (asserts! (>= amount MIN_DEPOSIT) ERR_MIN_DEPOSIT_NOT_MET)
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    ;; Execute sBTC transfer to vault
    (try! (contract-call? SBTC_TOKEN_CONTRACT transfer amount caller
      (as-contract tx-sender) none
    ))
    ;; Update user position records
    (map-set user-deposits caller (+ current-balance amount))
    (map-set user-shares caller (+ current-shares new-shares))
    (map-set user-last-deposit-time caller stacks-block-height)
    ;; Update protocol TVL
    (var-set total-value-locked (+ (var-get total-value-locked) amount))
    (ok new-shares)
  )
)

;; Withdraw sBTC from yield farming vault
(define-public (withdraw-from-vault (shares uint))
  (let (
      (caller tx-sender)
      (user-total-shares (default-to u0 (map-get? user-shares caller)))
      (total-shares (calculate-total-shares))
      (withdrawal-amount (if (> total-shares u0)
        (/ (* shares (var-get total-value-locked)) total-shares)
        u0
      ))
      (fee-amount (/ (* withdrawal-amount VAULT_FEE_BPS) u10000))
      (net-amount (- withdrawal-amount fee-amount))
    )
    ;; Withdrawal validation
    (asserts! (> shares u0) ERR_INVALID_AMOUNT)
    (asserts! (>= user-total-shares shares) ERR_INSUFFICIENT_BALANCE)
    (asserts! (>= (var-get total-value-locked) withdrawal-amount)
      ERR_INSUFFICIENT_LIQUIDITY
    )
    ;; Update user position
    (map-set user-shares caller (- user-total-shares shares))
    (if (is-eq (- user-total-shares shares) u0)
      (map-delete user-deposits caller)
      true
    )
    ;; Update protocol TVL
    (var-set total-value-locked
      (- (var-get total-value-locked) withdrawal-amount)
    )
    ;; Execute withdrawal transfer
    (try! (as-contract (contract-call? SBTC_TOKEN_CONTRACT transfer net-amount tx-sender caller none)))
    (ok net-amount)
  )
)

;; AMM LIQUIDITY OPERATIONS

;; Create new sBTC trading pair
(define-public (create-liquidity-pool
    (token-b principal)
    (sbtc-amount uint)
    (token-b-amount uint)
  )
  (let (
      (pool-id {
        token-a: SBTC_TOKEN_CONTRACT,
        token-b: token-b,
      })
      (caller tx-sender)
    )
    ;; Pool creation validation
    (asserts! (> sbtc-amount u0) ERR_INVALID_AMOUNT)
    (asserts! (> token-b-amount u0) ERR_INVALID_AMOUNT)
    (asserts! (is-none (map-get? liquidity-pools pool-id)) ERR_POOL_NOT_FOUND)
    ;; Transfer initial liquidity to contract
    (try! (contract-call? SBTC_TOKEN_CONTRACT transfer sbtc-amount caller
      (as-contract tx-sender) none
    ))
    (try! (contract-call? token-b transfer token-b-amount caller
      (as-contract tx-sender) none
    ))
    ;; Initialize pool state
    (map-set liquidity-pools pool-id {
      reserve-a: sbtc-amount,
      reserve-b: token-b-amount,
      total-supply: (* sbtc-amount token-b-amount),
      fee-rate: u30, ;; 0.3% trading fee
    })
    ;; Mint initial LP tokens to creator
    (map-set user-lp-tokens {
      user: caller,
      pool-id: pool-id,
    }
      (* sbtc-amount token-b-amount)
    )
    (ok pool-id)
  )
)

;; Add liquidity to existing trading pair
(define-public (add-liquidity
    (token-b principal)
    (sbtc-amount uint)
    (token-b-amount uint)
    (min-lp-tokens uint)
  )
  (let (
      (pool-id {
        token-a: SBTC_TOKEN_CONTRACT,
        token-b: token-b,
      })
      (pool-data (unwrap! (map-get? liquidity-pools pool-id) ERR_POOL_NOT_FOUND))
      (caller tx-sender)
      (current-lp (default-to u0
        (map-get? user-lp-tokens {
          user: caller,
          pool-id: pool-id,
        })
      ))
      (lp-option-a (/ (* sbtc-amount (get total-supply pool-data)) (get reserve-a pool-data)))
      (lp-option-b (/ (* token-b-amount (get total-supply pool-data))
        (get reserve-b pool-data)
      ))
      (lp-tokens-to-mint (min-uint lp-option-a lp-option-b))
    )
    ;; Slippage protection
    (asserts! (>= lp-tokens-to-mint min-lp-tokens) ERR_SLIPPAGE_EXCEEDED)
    ;; Transfer tokens to pool
    (try! (contract-call? SBTC_TOKEN_CONTRACT transfer sbtc-amount caller
      (as-contract tx-sender) none
    ))
    (try! (contract-call? token-b transfer token-b-amount caller
      (as-contract tx-sender) none
    ))
    ;; Update pool reserves and supply
    (map-set liquidity-pools pool-id {
      reserve-a: (+ (get reserve-a pool-data) sbtc-amount),
      reserve-b: (+ (get reserve-b pool-data) token-b-amount),
      total-supply: (+ (get total-supply pool-data) lp-tokens-to-mint),
      fee-rate: (get fee-rate pool-data),
    })
    ;; Update user LP token balance
    (map-set user-lp-tokens {
      user: caller,
      pool-id: pool-id,
    }
      (+ current-lp lp-tokens-to-mint)
    )
    (ok lp-tokens-to-mint)
  )
)

;; AMM TRADING OPERATIONS

;; Swap sBTC for another token using AMM
(define-public (swap-sbtc-for-token
    (token-b principal)
    (sbtc-amount uint)
    (min-token-b-out uint)
  )
  (let (
      (pool-id {
        token-a: SBTC_TOKEN_CONTRACT,
        token-b: token-b,
      })
      (pool-data (unwrap! (map-get? liquidity-pools pool-id) ERR_POOL_NOT_FOUND))
      (caller tx-sender)
      (fee-amount (/ (* sbtc-amount (get fee-rate pool-data)) u10000))
      (sbtc-amount-minus-fee (- sbtc-amount fee-amount))
      (token-b-out (calculate-output-amount sbtc-amount-minus-fee (get reserve-a pool-data)
        (get reserve-b pool-data)
      ))
    )
    ;; Slippage and liquidity validation
    (asserts! (>= token-b-out min-token-b-out) ERR_SLIPPAGE_EXCEEDED)
    (asserts! (> token-b-out u0) ERR_INSUFFICIENT_LIQUIDITY)
    ;; Execute token swap
    (try! (contract-call? SBTC_TOKEN_CONTRACT transfer sbtc-amount caller
      (as-contract tx-sender) none
    ))
    (try! (as-contract (contract-call? token-b transfer token-b-out tx-sender caller none)))
    ;; Update pool reserves after trade
    (map-set liquidity-pools pool-id {
      reserve-a: (+ (get reserve-a pool-data) sbtc-amount-minus-fee),
      reserve-b: (- (get reserve-b pool-data) token-b-out),
      total-supply: (get total-supply pool-data),
      fee-rate: (get fee-rate pool-data),
    })
    (ok token-b-out)
  )
)

;; YIELD DISTRIBUTION SYSTEM

;; Distribute yield rewards to vault participants
(define-public (distribute-yield)
  (let ((total-yield (/ (* (var-get total-value-locked) (var-get yield-rate)) u10000)))
    (asserts! (default-to false (map-get? authorized-callers tx-sender))
      ERR_NOT_AUTHORIZED
    )
    ;; Add generated yield to protocol TVL
    (var-set total-value-locked (+ (var-get total-value-locked) total-yield))
    (ok total-yield)
  )
)

;; ADMINISTRATIVE CONTROLS

;; Emergency pause/unpause vault operations
(define-public (set-vault-pause (paused bool))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR_NOT_AUTHORIZED)
    (var-set vault-paused paused)
    (ok paused)
  )
)

;; Update protocol yield rate
(define-public (set-yield-rate (new-rate uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR_NOT_AUTHORIZED)
    (var-set yield-rate new-rate)
    (ok new-rate)
  )
)

;; Grant administrative privileges
(define-public (add-authorized-caller (caller principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR_NOT_AUTHORIZED)
    (map-set authorized-callers caller true)
    (ok true)
  )
)

;; CLARITY 4 ENHANCED FEATURES

;; Verify contract implementation matches expected hash (Clarity 4)
(define-read-only (verify-contract-hash (contract-principal principal) (expected-hash (buff 32)))
  (match (contract-hash? contract-principal)
    contract-code-hash (ok (is-eq contract-code-hash expected-hash))
    err-value (err err-value)
  )
)

;; Get current block timestamp for time-based operations (Clarity 4)
(define-read-only (get-current-block-time)
  stacks-block-time
)

;; Convert vault status to ASCII string for cross-chain messaging (Clarity 4)
(define-read-only (get-tvl-as-ascii)
  (to-ascii? (var-get total-value-locked))
)

;; Get time-weighted deposit info for user
(define-read-only (get-user-deposit-info (user principal))
  (let (
      (deposit-time (default-to u0 (map-get? user-last-deposit-time user)))
      (current-time stacks-block-time)
      (deposit-amount (default-to u0 (map-get? user-deposits user)))
    )
    {
      deposit-amount: deposit-amount,
      deposit-time: deposit-time,
      current-time: current-time,
      time-held: (if (> current-time deposit-time) (- current-time deposit-time) u0)
    }
  )
)

;; PUBLIC READ-ONLY INTERFACES

;; Get user's current vault balance with accrued yield
(define-read-only (get-user-vault-balance (user principal))
  (let (
      (user-shares-amount (default-to u0 (map-get? user-shares user)))
      (total-shares (calculate-total-shares))
    )
    (if (> total-shares u0)
      (/ (* user-shares-amount (var-get total-value-locked)) total-shares)
      u0
    )
  )
)

;; Get comprehensive pool information with timestamp
(define-read-only (get-pool-info (token-b principal))
  (match (map-get? liquidity-pools {
    token-a: SBTC_TOKEN_CONTRACT,
    token-b: token-b,
  })
    pool-data (some (merge pool-data { last-updated: stacks-block-time }))
    none
  )
)

;; Get user's LP token balance for specific pool
(define-read-only (get-user-lp-balance
    (user principal)
    (token-b principal)
  )
  (map-get? user-lp-tokens {
    user: user,
    pool-id: {
      token-a: SBTC_TOKEN_CONTRACT,
      token-b: token-b,
    },
  })
)

;; Get protocol's total value locked
(define-read-only (get-total-value-locked)
  (var-get total-value-locked)
)

;; Get comprehensive vault status
(define-read-only (get-vault-status)
  {
    paused: (var-get vault-paused),
    total-value-locked: (var-get total-value-locked),
    yield-rate: (var-get yield-rate),
  }
)

;; INTERNAL CALCULATION FUNCTIONS

;; Calculate total shares across all vault participants
(define-private (calculate-total-shares)
  (fold + (map get-user-shares-list (list tx-sender)) u0)
)

;; Helper function for share calculation (simplified implementation)
(define-private (get-user-shares-list (user principal))
  (default-to u0 (map-get? user-shares user))
)

;; Custom minimum function for uint values
(define-private (min-uint
    (a uint)
    (b uint)
  )
  (if (<= a b)
    a
    b
  )
)

;; AMM constant product formula for swap calculations
(define-private (calculate-output-amount
    (input-amount uint)
    (input-reserve uint)
    (output-reserve uint)
  )
  (let (
      (numerator (* input-amount output-reserve))
      (denominator (+ input-reserve input-amount))
    )
    (/ numerator denominator)
  )
)

;; EMERGENCY RECOVERY SYSTEM

;; Emergency token recovery (admin-only, last resort)
(define-public (emergency-withdraw
    (token principal)
    (amount uint)
    (recipient principal)
  )
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR_NOT_AUTHORIZED)
    (try! (as-contract (contract-call? token transfer amount tx-sender recipient none)))
    (ok amount)
  )
)
