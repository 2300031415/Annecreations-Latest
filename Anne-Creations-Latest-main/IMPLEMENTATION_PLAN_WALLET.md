# Wallet Feature Implementation Plan

## 1. Database Schema Design (Backend)

We will introduce two main concepts: a **Wallet** associated with a user, and **Transactions** to track history.

### A. Wallet Schema
We can either add a `balance` field directly to the `User` model or create a separate `Wallet` model. A separate model is more scalable for future features (e.g., multiple currencies, loyalty points).

**File:** `Backend/models/wallet.model.ts`
```typescript
{
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  balance: { type: Number, default: 0, min: 0 }, // Prevent negative balance
  currency: { type: String, default: 'INR' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}
```

### B. Wallet Transaction Schema
To keep a history of every penny added or spent.

**File:** `Backend/models/walletTransaction.model.ts`
```typescript
{
  wallet: { type: Schema.Types.ObjectId, ref: 'Wallet', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['CREDIT', 'DEBIT'], required: true }, // CREDIT (Add money/Refund), DEBIT (Purchase)
  description: { type: String }, // e.g., "Refund for Order #123" or "Purchase Order #456"
  referenceId: { type: String }, // Stores Order ID or Payment Gateway Transaction ID
  status: { type: String, enum: ['PENDING', 'COMPLETED', 'FAILED'], default: 'COMPLETED' },
  createdAt: { type: Date, default: Date.now }
}
```

---

## 2. Backend API Structure

We will need a new set of routes to manage wallet operations.

**File:** `Backend/routes/wallet.routes.ts`

### Endpoints:
1.  **GET** `/api/wallet`
    *   Fetch the current user's wallet balance and recent transactions.
2.  **POST** `/api/wallet/add-funds` (Optional for now)
    *   Allows user to add money via Payment Gateway (Razorpay/Stripe).
3.  **POST** `/api/wallet/pay` (Internal/Checkout use)
    *   Deduct funds for an order.
    *   **Critical Logic:** Use MongoDB Transactions (Sessions) or atomic `$inc` operators to ensure `balance` never goes below 0 and double-spending is impossible.

### integration with Orders:
*   When an order is **CANCELLED** or **RETURNED**, the backend logic should automatically **CREDIT** the wallet instead of a bank refund (if desired).

---

## 3. Frontend Implementation (Next.js)

### A. State Management (Zustand)
Update your stores to handle wallet data.

**File:** `Frontend/src/Store/walletStore.js`
*   `balance`: number
*   `transactions`: array
*   `fetchWalletDetails()`: Action to get data from backend.

### B. User Interface
1.  **Sidebar / Profile Menu:** Add a "My Wallet" tab.
2.  **Wallet Page (`/Profile?tab=wallet`):**
    *   **Hero Card:** Shows big bold text: "Available Balance: ₹5000".
    *   **Add Money Button:** (If implementing top-up).
    *   **History Table:** List of recent transactions (Date, Description, Amount (+Green / -Red)).

### C. Checkout Integration
1.  **Payment Options Section:**
    *   Add a checkbox or radio button: **"Pay using Wallet Balance (₹500)"**.
2.  **Logic:**
    *   If `Wallet Balance >= Cart Total`: Show "Pay Full Ordered Amount via Wallet".
    *   If `Wallet Balance < Cart Total`: (Advanced) Allow "Partial Payment" (Wallet + Online Payment). *For V1, you might want to restrict to Full Payment only for simplicity.*

---

## 4. Implementation Steps Roadmap

1.  **Phase 1: Backend Core**
    *   Create Models (`Wallet`, `Transaction`).
    *   Create Controller functions (`getWallet`, `createTransaction`).
    *   Update `User` registration to automatically create an empty `Wallet` for new users.

2.  **Phase 2: Admin/Logic**
    *   Create an Admin endpoint to manually "Give Refund to Wallet".
    *   Test standard Credit/Debit logic API with Postman.

3.  **Phase 3: Frontend Display**
    *   Build the "My Wallet" page in the user profile.
    *   Connect to `walletStore` to fetch real data.

4.  **Phase 4: Checkout Integration**
    *   Update the Checkout page to query the wallet balance.
    *   Handle the actual payment flow (deduct balance -> create order).
