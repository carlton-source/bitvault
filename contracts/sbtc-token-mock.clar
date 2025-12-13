;; Mock sBTC Token Contract for Testing
;; This implements a simplified SIP-010 fungible token standard

(define-constant CONTRACT_OWNER tx-sender)

;; SIP-010 Standard Constants
(define-constant ERR_UNAUTHORIZED (err u401))
(define-constant ERR_NOT_TOKEN_OWNER (err u402))
(define-constant ERR_INSUFFICIENT_BALANCE (err u403))
(define-constant ERR_INVALID_AMOUNT (err u404))

;; Token metadata
(define-fungible-token sbtc u21000000000000) ;; 21M sBTC max supply (8 decimals)

;; Token balances and allowances
(define-map token-balances
  principal
  uint
)
(define-map token-allowances
  {
    spender: principal,
    owner: principal,
  }
  uint
)

;; Initialize contract with initial supply to deployer
(begin
  (ft-mint? sbtc u1000000000000 CONTRACT_OWNER) ;; Mint 10M sBTC to deployer
)
;; SIP-010 Standard Functions

;; Transfer tokens
(define-public (transfer
    (amount uint)
    (sender principal)
    (recipient principal)
    (memo (optional (buff 34)))
  )
  (begin
    (asserts! (is-eq tx-sender sender) ERR_UNAUTHORIZED)
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    (try! (ft-transfer? sbtc amount sender recipient))
    (print {
      type: "transfer",
      sender: sender,
      recipient: recipient,
      amount: amount,
      memo: memo,
    })
    (ok true)
  )
)

;; Get token name
(define-read-only (get-name)
  (ok "Synthetic Bitcoin")
)

;; Get token symbol
(define-read-only (get-symbol)
  (ok "sBTC")
)

;; Get token decimals
(define-read-only (get-decimals)
  (ok u8)
)

;; Get token balance
(define-read-only (get-balance (who principal))
  (ok (ft-get-balance sbtc who))
)

;; Get total supply
(define-read-only (get-total-supply)
  (ok (ft-get-supply sbtc))
)

;; Get token URI (optional)
(define-read-only (get-token-uri)
  (ok (some u"https://sbtc.tech"))
)

;; Transfer from (with allowance)
(define-public (transfer-from
    (amount uint)
    (owner principal)
    (recipient principal)
    (memo (optional (buff 34)))
  )
  (let ((allowance (default-to u0
      (map-get? token-allowances {
        spender: tx-sender,
        owner: owner,
      })
    )))
    (asserts! (>= allowance amount) ERR_UNAUTHORIZED)
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    (try! (ft-transfer? sbtc amount owner recipient))
    (map-set token-allowances {
      spender: tx-sender,
      owner: owner,
    }
      (- allowance amount)
    )
    (print {
      type: "transfer-from",
      owner: owner,
      recipient: recipient,
      amount: amount,
      memo: memo,
    })
    (ok true)
  )
)

;; Approve spender
(define-public (approve
    (spender principal)
    (amount uint)
  )
  (begin
    (map-set token-allowances {
      spender: spender,
      owner: tx-sender,
    }
      amount
    )
    (print {
      type: "approve",
      owner: tx-sender,
      spender: spender,
      amount: amount,
    })
    (ok true)
  )
)

;; Get allowance
(define-read-only (get-allowance
    (owner principal)
    (spender principal)
  )
  (ok (default-to u0
    (map-get? token-allowances {
      spender: spender,
      owner: owner,
    })
  ))
)

;; Mint function (for testing purposes only)
(define-public (mint
    (amount uint)
    (recipient principal)
  )
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (try! (ft-mint? sbtc amount recipient))
    (ok true)
  )
)
