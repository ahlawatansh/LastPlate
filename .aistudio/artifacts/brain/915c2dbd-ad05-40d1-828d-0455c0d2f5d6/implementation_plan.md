# LastPlate — Food Delivery, Surplus Food Rescue & Predictive Menu Intelligence

LastPlate is an end-to-end food delivery and surplus food rescue platform that connects customers, restaurants, delivery partners, and platform administrators. Its flagship differentiator is an AI-powered 3-year Predictive Menu & Forecast Studio that models demand across seasons, festivals, and meal periods to optimize preparation quantities, prevent food waste, and recover revenue.

---

> [!IMPORTANT]
> **Confirmed Product & Architecture Decisions**
> 
> - **Cuisine & Restaurant Profile**: The seeded 3-year demo restaurant is **Green Leaf Kitchen**, configured as a *Contemporary Indian Cafe & Quick-Service Eatery* offering signature rolls, artisanal chai, specialty thalis, rice bowls, chaat, and seasonal desserts.
> - **Surplus Rescue Pricing Formula**: Continuous smooth decay toward a configured minimum floor price as closing time approaches:  
>   $$P(t) = \max\left(P_{\text{min}}, P_{\text{orig}} - (P_{\text{orig}} - P_{\text{min}}) \times \left(\frac{t - t_{\text{start}}}{t_{\text{close}} - t_{\text{start}}}\right)^\gamma\right)$$  
>   Price recalculates locally from timestamps without high-frequency database writes, with backend purchase-time validation.
> - **Analytical Forecasting Pipeline**: Hybrid architecture featuring:
>   1. A **High-Precision Baseline Engine** with real-time What-If scenario sliders (demand multiplier, cost adjustments, safety buffers, waste vs. stockout penalties).
>   2. An **ML-Style Evaluator** providing Mean Absolute Error (MAE), Weighted Absolute Percentage Error (WAPE), and chronological holdout validation across 3 full calendar years (2023–2025/2026) of synthetic records.
> - **Unified Reactive State**: A robust central state engine with Firebase integration support and an offline-first persistent store, allowing immediate switching between all 4 demo accounts (Customer, Restaurant, Delivery, Admin) while observing live order transitions in real time.

---

## 1. Overview & Core Concept

### What It Does
- **Common Auth & Role Gateway**: Single login/signup interface with Google sign-in simulation and demo account switcher (`customer@lastplate.demo`, `restaurant@lastplate.demo`, `delivery@lastplate.demo`, `admin@lastplate.demo`).
- **Onboarding & Approval Gates**: Customers gain instant access. Restaurant owners and Delivery Partners complete specialized onboarding questionnaires (vehicle details, license, kitchen capabilities) and are gated under a `PENDING_APPROVAL` status until an Admin reviews and approves them.
- **Customer Experience**: Modern food delivery portal (Zomato/Swiggy inspired) for Green Leaf Kitchen. Features regular ordering, dish categories, customizable cart, simulated multi-rail payment (UPI QR, Card, Cash on Delivery), live order progression tracking, and a dedicated **Surplus Rescue Marketplace** with discounted end-of-day meals.
- **Restaurant Operations**: Kitchen order management (Accept, Reject, Start Preparation, Ready for Pickup), menu and inventory CRUD, surplus listing creation, and the **Suggested Menu / Forecast Studio**.
- **Delivery Partner Pool**: Restaurant-accepted orders enter a shared delivery pool. Partners can view estimated distance, simulated route, and earnings, then accept or decline. Acceptance is atomic (first partner claims the order; others see it removed). Step-by-step delivery simulation advances the order through to completion.
- **Admin Command Center**: Approves/rejects vendor and partner applications with reason tracking, inspects live orders and payments, monitors platform waste reduction metrics, reviews forecast model accuracy, and provides a safe "Reset Demo Data" function.

---

## 2. User Experience & Visual Design

### Aesthetic Direction & Visual Tokens
- **Brand Identity**: Modern, sustainable food-tech aesthetic avoiding generic purple gradients and artificial UI clutter.
- **Color Palette**:
  - *Dominant Neutral (60%)*: Warm paper/chalk background (`#FBFBFA` / `#121316` dark) with soft contrast borders.
  - *Structural Surface (30%)*: Card and panel surfaces (`#FFFFFF` / `#1A1D21`), subtle borders (`#E5E7EB` / `#272A30`).
  - *Brand & Intent Accent (10%)*: Deep Forest Green (`#1B4332` / `#2D6A4F`) for sustainability and primary actions, with Warm Amber/Ochre (`#D97706` / `#F59E0B`) for surplus alerts and discount indicators.
- **Typography**: Clean, geometric sans display and interface font (`Plus Jakarta Sans`), paired with strict tabular monospace figures (`font-mono tabular-nums`) for currency, timestamps, and forecast metrics.
- **Zero-Pill Discipline**: Metadata displayed using clean unboxed text with subtle typographic separators (`·` or `/`).

### Portals & Key User Flows

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SHARED AUTHENTICATION                           │
│  [Customer] · [Restaurant Vendor] · [Delivery Partner] · [Platform Admin]│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│ CUSTOMER PORTAL  │       │ VENDOR PORTAL    │       │ DELIVERY PORTAL  │
│ · Menu Browsing  │       │ · Order Kitchen  │       │ · Available Pool │
│ · Surplus Rescue │       │ · Menu & Stock   │       │ · Accept/Decline │
│ · Simulated Pay  │       │ · Surplus Deals  │       │ · Route Nav Sim  │
│ · Live Tracking  │       │ · Forecast Studio│       │ · Earnings Log   │
└────────┬─────────┘       └────────┬─────────┘       └────────┬─────────┘
         │                          │                          │
         └──────────────────────────┼──────────────────────────┘
                                    │
                                    ▼
                     ┌──────────────────────────────┐
                     │     ADMIN COMMAND CENTER     │
                     │ · Vendor & Partner Approvals │
                     │ · Order & Payment Monitor    │
                     │ · ML Forecast Benchmarking   │
                     │ · Food Rescue Impact Ledger  │
                     └──────────────────────────────┘
```

---

## 3. Key Product Decisions & Trade-Offs

| Decision | Chosen Approach | Trade-offs & Rationale |
| :--- | :--- | :--- |
| **Demo & Multi-Role Switching** | Instant 1-click Demo Account Bar at the bottom of Auth views + Role Switcher in header. | Enables reviewers to test all 4 perspectives seamlessly without manually registering four separate identities each time. |
| **Approval Flow Gate** | Strict authoritative status checking (`APPROVED`, `PENDING_APPROVAL`, `REJECTED`). | Security principle: role selection in registration does not grant dashboard rights. Admin approval gate is actively enforced. |
| **Surplus Price Calculation** | Client-side reactive mathematical decay from static timestamps (`createdAt`, `expiresAt`, `basePrice`, `minPrice`). | Eliminates continuous database writes every second, maintaining high performance while ensuring purchase-time price validation. |
| **Atomic Delivery Acceptance** | Optimistic lock with mutex check on order claim. | Prevents race conditions where two delivery partners claim the same accepted order simultaneously. |
| **3-Year Historical Dataset** | Deterministic pseudo-random generation of 1,095 days with seasonal, weekend, and Indian festival multipliers. | Provides deep, realistic variance across 4 meal periods (Breakfast, Lunch, Evening Snack, Dinner) without requiring massive external downloads. |

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                CLIENT (REACT 19 + VITE)                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ROUTING & GUARDS                                                               │
│  · /login · /signup · /pending-approval · /customer · /vendor · /delivery · /admin │
├─────────────────────────────────────────────────────────────────────────────────┤
│  APPLICATION MODULES                                                            │
│  ┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐  │
│  │ Customer Marketplace  │ │ Restaurant Console    │ │ Forecast Studio (ML)  │  │
│  │ · Food Menu & Filters │ │ · Live Order Kan-Ban  │ │ · 3-Yr History Loader │  │
│  │ · Surplus Deal Stream │ │ · Surplus Publisher   │ │ · Baseline + ML MAE   │  │
│  │ · Cart & Pay Sim      │ │ · Inventory Controls  │ │ · What-If Simulator   │  │
│  └───────────────────────┘ └───────────────────────┘ └───────────────────────┘  │
│  ┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐  │
│  │ Delivery Hub          │ │ Admin Operations      │ │ Shared Order Engine   │  │
│  │ · Shared Order Pool   │ │ · Approvals Queue     │ │ · State Machine FSM   │  │
│  │ · Active Route Sim    │ │ · Platform Audit Log  │ │ · Unified Event Bus   │  │
│  │ · Payout Tracker      │ │ · Impact Analytics    │ │ · BroadcastChannel Sync│ │
│  └───────────────────────┘ └───────────────────────┘ └───────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────────────┤
│  PERSISTENCE & SYNC LAYER                                                       │
│  · LocalStorage State Cache + BroadcastChannel (Cross-tab live synchronization) │
│  · Optional Firebase Auth & Firestore adapter hooks                             │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Core Entities & State Machine
1. **Order Lifecycle**:
   `ORDER_PLACED` $\to$ `RESTAURANT_ACCEPTED` $\to$ `PREPARING` $\to$ `READY_FOR_PICKUP` $\to$ `DELIVERY_ASSIGNED` $\to$ `PICKED_UP` $\to$ `OUT_FOR_DELIVERY` $\to$ `DELIVERED`
2. **Forecast Model Attribution**:
   $$\text{Predicted Demand} = \text{Base} \times M_{\text{dow}} \times M_{\text{meal}} \times M_{\text{season}} \times M_{\text{fest}} \times M_{\text{trend}} + \epsilon$$
   $$\text{Recommended Prep} = \text{Predicted Demand} \times (1 + \text{Safety Buffer}) - \text{Prepared Stock}$$
   The UI breaks down each factor (e.g. *"+18% weekend evening surge, +25% Diwali sweet rush"*) so restaurant managers understand the recommendation.

---

## 5. Verification Plan

- **Automated Verification**:
  - Run `compile_applet` to ensure clean TypeScript compilation and build output.
  - Run `lint_applet` to verify syntax and formatting standards.
- **Manual End-to-End Walkthrough**:
  1. *Auth & Onboarding*: Register new restaurant & delivery partner; verify they hit `PENDING_APPROVAL`.
  2. *Admin Gate*: Log into Admin, approve the pending requests, and verify instant access.
  3. *Order Cycle*: Log into Customer, add regular + surplus items to cart, pay via simulated UPI.
  4. *Kitchen Flow*: Switch to Restaurant, accept order, start prep, mark ready.
  5. *Delivery Flow*: Switch to Delivery Partner, claim order from shared pool, advance through route simulation to delivered.
  6. *Forecast Studio*: Open Restaurant Suggested Menu, filter by festival/time-slot, test What-If sliders, and verify MAE/WAPE metrics over the 3-year historical dataset.
  7. *Admin Impact*: Verify completed order updates meals rescued, carbon/waste avoided, and revenue ledger.
