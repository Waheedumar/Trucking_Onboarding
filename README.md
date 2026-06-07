# Trucking Onboarding App

A full onboarding system for logistics companies — handles both shippers and carriers using Claude AI.

---

## Project Structure

```
trucking-onboarding/
├── backend/
│   ├── server.js          ← Express + Claude API
│   ├── package.json
│   └── .env.example       ← Copy this to .env
├── frontend/
│   ├── src/
│   │   ├── App.jsx        ← Main chat UI
│   │   └── main.jsx       ← React entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## Setup Instructions

### Step 1 — Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Open .env and paste your Claude API key:
```
ANTHROPIC_API_KEY=your_key_here
PORT=3001
```

Create a profiles folder:
```bash
mkdir profiles
```

Start the backend:
```bash
npm run dev
```

---

### Step 2 — Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

---

### Step 3 — Open the app

Go to: http://localhost:3000

---

## How It Works

1. User opens the app
2. Claude asks: Shipper or Carrier?
3. Based on answer, Claude runs the correct onboarding flow
4. Questions are asked one at a time
5. At the end Claude generates a complete profile
6. Profile is saved to /backend/profiles/ folder
7. Success screen shown with option to copy profile

---

## What Gets Collected

### Shipper Profile
- Company info and contact
- Freight type and volume
- Lanes and locations
- Payment terms and TMS

### Carrier Profile
- MC/DOT number
- Fleet details and equipment
- Preferred lanes and rates
- Compliance and insurance
- Factoring and fuel card

---

## Next Steps (Upgrades)

1. Connect Supabase to save profiles to a database
2. Add email notification when onboarding completes
3. Add admin dashboard to view all profiles
4. Deploy frontend to Vercel
5. Deploy backend to Railway
6. Add your client's branding (logo, colors, company name)

---

## Deployment

### Frontend → Vercel
```bash
cd frontend
npm run build
# Upload dist/ folder to Vercel or connect GitHub repo
```

### Backend → Railway
- Connect your GitHub repo to Railway
- Set ANTHROPIC_API_KEY as environment variable
- Railway auto-deploys on push

---

## Support
Built with Claude API (claude-sonnet-4-20250514) + React + Express
