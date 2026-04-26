# GrubSync

Real-time group food ordering coordinator built with React, Tailwind CSS, Socket.io, Node.js, Express, and MongoDB.

## Setup

### Backend
1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and set your MongoDB URI and JWT secret.
4. Start the backend:
   ```bash
   npm run start
   ```

### Frontend
1. Navigate to the client folder:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the frontend:
   ```bash
   npm run dev
   ```

## Deploy Frontend to Vercel

This project uses `client/` for the Vite frontend. The backend is a separate Express app and should be hosted independently.

1. Install the Vercel CLI (optional):
   ```bash
   npm install -g vercel
   ```
2. Deploy the frontend from the `client` folder:
   ```bash
   cd client
   vercel
   ```
3. If prompted, choose `client` as the project root.
4. Set the backend API URL in Vercel environment variables:
   - `VITE_API_URL=https://<your-backend-host>`

## Deploy Backend to Render

Use Render for the Express backend and MongoDB connection.

1. Push your repo to GitHub or GitLab.
2. On Render, create a new Web Service.
3. Connect your repository and select the `main` branch.
4. Use these values:
   - **Name**: `grub-sync-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm run start`
   - **Root Directory**: `/`
5. Add these environment variables in Render:
   - `MONGODB_URI` = `mongodb://<user>:<pass>@host:port/dbname` or your MongoDB URI
   - `JWT_SECRET` = your JWT secret
   - `PORT` = `5000`
6. Deploy and wait for Render to finish building.

You can also use the provided `render.yaml` if you want Render to auto-detect the backend service.

## Notes

- Vercel works best for the frontend static site.
- Render works well for the backend Express service, especially with a MongoDB URI.
- If you use a managed MongoDB provider, set the connection string in Render's environment variables.

## Features
- Create or join rounds with a 6-character room code.
- Add, edit, and delete your own order items in real time.
- Live updates using Socket.io.
- Automatic bill split with delivery and tax allocation.
- UPI payment deep link generation.
- Payment tracking with pending / paid / confirmed statuses.
- Dashboard for past rounds.
