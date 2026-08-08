# Operation Sentinel

Operation Sentinel is a police personnel scheduling and dynamic-deployment dashboard. It combines a real-time command UI with authenticated APIs for sectors, tactical units, incidents, analytics, and demo data.

## Highlights

- Live sector heat map, tactical map, incident management, unit management, and analytics
- Role-aware authentication, rate-limited login/registration, and authenticated Socket.IO connections
- Real backend CRUD with MongoDB validation and real-time UI events
- Seeded command-center demo data for fast evaluation
- Tested Z-score force-allocation logic, including a 15% standby reserve

## Run locally

1. Copy `backend/.env.example` to `backend/.env`, then set a long, random `JWT_SECRET`.
2. Start the backend:

   ```bash
   cd backend
   npm install
   npm run dev
   ```

3. Start the frontend in another terminal:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

Register the first account to bootstrap an administrator, sign in, and select **Seed DB** in the command center. Later self-registered accounts are view-only officers; promote operational users through the database until an invite/admin-management flow is introduced.

`MONGO_URI` is optional for a local demo; when omitted, the backend attempts to start an in-memory MongoDB replica set. For a separately deployed frontend, set `VITE_API_URL` to the backend origin, for example `https://api.example.com`.

## Verify

```bash
cd backend && npm test
cd ../frontend && npm run lint && npm run build
```

## Stack

- React, Vite, Tailwind CSS, Leaflet, Recharts, Socket.IO
- Node.js, Express, MongoDB/Mongoose, JWT
