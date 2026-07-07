# DC Store (Dominion Clothing) — MERN Demo

Full-stack demo: React/Vite/Tailwind frontend + Express/MongoDB backend.
Products seeded from the brands actually stocked (Tommy Hilfiger, Lacoste,
BOSS, Calvin Klein, Armani Exchange, Michael Kors, Emporio Armani).

## Run it

### 1. Backend
```
cd backend
cp .env.example .env       # edit MONGO_URI if not using local Mongo
npm install
npm run seed                # loads sample products into MongoDB
npm run dev                 # starts on http://localhost:5000
```

### 2. Frontend
```
cd frontend
cp .env.example .env
npm install
npm run dev                 # starts on http://localhost:5173
```

Open http://localhost:5173

## What's real vs. placeholder

**Real / working:**
- Product catalog served from MongoDB via Express API
- Category filtering (Shirts, Polos, T-Shirts, Trousers, Jeans, New, Sale)
- Cart (add/remove/qty) with React Context
- Checkout form → saves order to MongoDB as "pending"

**Placeholder for the demo (wire up before going live):**
- Payment: checkout currently just saves the order, no real charge.
  Swap in Razorpay: create an order-create + verify-signature route in
  `controllers/orderController.js`, then trigger Razorpay's checkout.js
  modal from `Checkout.jsx` on submit.
- Admin dashboard: not built yet — products are added via `npm run seed`
  or directly through the API/DB for now.
- Auth: no login/signup — guest checkout only.

## Deploying (same pattern as your other MERN projects)
- Backend → Render (set MONGO_URI to an Atlas connection string, CLIENT_URL to the deployed frontend URL)
- Frontend → Vercel (set VITE_API_URL to the deployed backend URL)
