# ClearMilestone

Get paid at every project stage.

ClearMilestone helps freelancers and small businesses turn a project into staged payments. Describe the work, and AI proposes a deposit-and-milestone plan. Approve it, and each stage becomes a separate PayPal Sandbox order that the client pays through PayPal Checkout. AI also drafts follow-up messages for stages that run late.

Built for the **PayPal AI Hackathon — Build What's Next with PayPal and AI**.

## How it works

```
Freelancer                ClearMilestone                 Client
-----------               --------------                 ------
describe project  --->    AI suggests payment plan
review + approve  --->    milestones saved to MongoDB
activate a stage  --->    create PayPal order   --->     approve in PayPal
                          capture + reconcile   <---     payment
                          mark stage PAID
                          AI drafts reminder    --->     reminder message
```

## Features

- Create clients, projects and payment milestones
- AI-suggested payment plans (deposit plus instalments), validated server-side
- Human approval step before a plan is written to the database
- A separate PayPal order per milestone — deposit, mid-project, final balance
- PayPal Checkout for the client's payment
- Server-side capture with amount and currency reconciliation
- Dashboard with totals: invoiced, collected, outstanding, active projects
- AI-drafted payment reminders in friendly, firm or final tone
- Status pills and per-project milestone view

## Tools used

| Layer | Technology |
|---|---|
| Payments | PayPal Sandbox, PayPal JavaScript SDK, Orders API v2, Payments API v2 (capture), PayPal webhooks (not configured) |
| AI | Groq API, model `openai/gpt-oss-120b` |
| Frontend | React, Vite, React Router, AG Grid |
| Backend | Node.js, Express |
| Database | MongoDB Atlas, Mongoose |
| API testing | Postman |

### How each tool is used

**PayPal** creates one order per milestone, renders the checkout button, captures the approved payment, and returns the captured amount and currency for reconciliation. A milestone is marked `PAID` only when PayPal reports `COMPLETED` and the returned amount matches the amount stored in the database. A milestone that already has an order returns the same order on a repeat click, so an abandoned checkout cannot lock the record.

**AI** generates two things:

1. A suggested milestone plan for a project, returned as strict JSON. The service validates that every amount is a positive integer and that the milestones sum exactly to the project total before the plan is offered to the user.
2. A payment reminder for a late milestone, built only from verified fields (client name, project, amount, due date, days overdue, tone). The model is forbidden from inventing fees, penalties or deadlines, and never writes the payment link — the server appends it.

The model never sets payment status, never changes an amount, and never triggers a capture.

**AG Grid** renders the project table with sortable columns, currency formatting, a progress percentage and a coloured status pill per row.

## Architecture

```
React (5173)
   |
   | REST /api
   v
Express (5000)
   |-- MongoDB Atlas      clients, projects, milestones, payments
   |-- PayPal Orders v2   create order, capture payment, reconcile amount
   |-- Groq API           plan suggestion, reminder drafting
```

Money is stored in **minor units** throughout — `30000` means `300.00 USD`. Order amounts are read from MongoDB, never accepted from the browser.

## Setup

### Prerequisites

- Node.js 20 or newer
- A MongoDB Atlas account (free tier)
- A PayPal developer account (free Sandbox)
- A Groq API key (free tier)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd clearmilestone

cd server && npm install
cd ../client && npm install
```

### 2. Server environment

Create `server/.env`:

```bash
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb+srv://user:password@cluster/clearmilestone
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_secret
AI_API_URL=https://api.groq.com/openai/v1/chat/completions
AI_API_KEY=your_groq_key
AI_MODEL=openai/gpt-oss-120b
```

### 3. Client environment

Create `client/.env`:

```bash
VITE_API_URL=http://localhost:5000/api
VITE_PAYPAL_CLIENT_ID=your_sandbox_client_id
```

The client ID is public and safe in the browser. The PayPal secret and the AI key stay on the server only.

### 4. Run

```bash
# terminal 1 — API
cd server && npm run dev

# terminal 2 — UI
cd client && npm run dev
```

Open http://localhost:5173

### 5. PayPal Sandbox setup

1. Sign in at https://developer.paypal.com
2. Open **Apps & Credentials** and switch the toggle to **Sandbox**
3. Create an app and copy its **Client ID** and **Secret**
4. Under **Testing Tools > Sandbox Accounts**, note the **Business** account (the seller) and the **Personal** account (the buyer), along with their generated passwords

The buyer signs in with the **Personal** sandbox account during checkout. No real card or real money is involved.

### 6. Groq setup

1. Sign up at https://console.groq.com
2. Open **API Keys** and create one
3. Put it in `server/.env` as `AI_API_KEY`

To confirm the model ID is available on your account:

```bash
curl "https://api.groq.com/openai/v1/models" -H "Authorization: Bearer YOUR_KEY"
```

Use any text model from that list in `AI_MODEL` if `openai/gpt-oss-120b` is not present.

## Demo workflow

1. Create a client and a project worth $1,000 (`totalMinor: 100000`)
2. Open the project and click **Suggest plan with AI**
3. Review the suggested `$300 / $350 / $350` plan — deposit first, sums matching the total
4. Click **Approve and save plan** — milestones are written to MongoDB
5. The deposit starts `READY`; the later stages stay `DRAFT`
6. Click **Pay** on the deposit, then the PayPal button
7. Sign in with the **Sandbox Personal** account and approve
8. The milestone moves to `PAID` with a capture reference, and the dashboard totals update
9. Call the reminder endpoint for a late stage to show the AI follow-up draft

## API endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Server check |
| POST | `/api/clients` | Create a client |
| GET | `/api/clients` | List clients |
| POST | `/api/projects` | Create a project |
| GET | `/api/projects` | List projects with balances and the next payable milestone |
| GET | `/api/projects/:projectId` | Read one project with its milestones |
| POST | `/api/milestones` | Create a milestone |
| GET | `/api/milestones` | List milestones (optional `?projectId=`) |
| GET | `/api/milestones/:milestoneId` | Read one milestone |
| PATCH | `/api/milestones/:milestoneId` | Update a milestone |
| POST | `/api/milestones/:milestoneId/activate` | Make a milestone payable |
| POST | `/api/paypal/milestones/:milestoneId/orders` | Create a PayPal order |
| POST | `/api/paypal/orders/:orderId/capture` | Capture and reconcile a payment |
| POST | `/api/ai/projects/:projectId/suggest-plan` | AI payment plan |
| POST | `/api/ai/projects/:projectId/save-plan` | Save an approved plan |
| POST | `/api/ai/milestones/:milestoneId/reminder` | AI reminder (`{"tone":"friendly"}`) |

## Data model

| Collection | Purpose |
|---|---|
| `clients` | Freelancer's customers |
| `projects` | Project, total amount, currency, status |
| `milestones` | Stages with amount, due date, status, PayPal order and capture IDs |
| `payments` | Verified capture records |
| `webhookevents` | Reserved for PayPal webhook deduplication |

Milestone statuses: `DRAFT`, `READY`, `PAYMENT_PENDING`, `PAID`, `OVERDUE`, `CANCELLED`.

## Security notes

- The PayPal client secret and the AI key are server-side only
- Order amounts are read from MongoDB, never accepted from the browser
- A capture is rejected unless PayPal's returned amount and currency match the stored record
- Webhook processing is idempotent by design, keyed on the PayPal event ID
- Temporary debug routes that wrote to the database were removed before submission
- No secret is committed; `.env` is git-ignored

## Known limitations

- The prototype uses a single PayPal Sandbox business account to represent the freelancer. A production multi-seller build would need merchant onboarding so each freelancer receives funds directly into their own PayPal account.
- The PayPal Sandbox base URL is set in the code rather than fully environment-driven.
- PayPal webhooks are not configured in this build, so payment status comes from the verified capture response rather than an asynchronous notification.
- There is no user authentication; the demo runs as a single merchant.
- The AI provider's free tier may use prompts to improve its services. All demo data is fictional.
- The reminder endpoint drafts messages; it does not send email.

## Submission

This project was built for the PayPal AI Hackathon. It meets the requirements as follows:

| Requirement | How |
|---|---|
| Meaningfully integrate PayPal | Orders API v2 for milestone orders, PayPal Checkout, capture with reconciliation, Sandbox throughout |
| Meaningfully incorporate AI | Plan generation with server-side validation and human approval; contextual reminder drafting from verified facts |
| Working prototype | Full flow demonstrated: plan → approve → PayPal payment → verified capture → updated ledger |
| Sufficiently documented | This README, including setup, environment, PayPal configuration and demo steps |
| Tools identified | Listed above with how each is used |
