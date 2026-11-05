# Track-AI Frontend

React, TypeScript, and Vite frontend for the Track-AI services. The app uses live backend responses; it has no demo-data mode.

## Local services

Keep the existing local environment files in place. Do not copy backend credentials or the remote AI key into the frontend.

- Frontend settings: `.env.local` (`VITE_API_BASE_URL`)
- Backend settings: `Backend-local/.env.services.local`
- Local chain settings: `Backend-local/.env.blockchain.local`
- The backend calls the configured remote AI API and keeps its authentication key server-side.
- MySQL and IPFS are provided by the existing Docker containers.
- Hardhat is the existing local node; the backend and browser wallet use its configured chain and deployed contracts.

Start the services using the existing local setup:

```powershell
# Frontend
npm ci
npm run dev

# Backend, in Backend-local
npm run dev:services
```

Use the existing Hardhat node and Docker containers. For initial machine setup, deployment, and service details, follow `Backend-local/docs/FULL_LOCAL_SERVICE.md` and `Backend-local/docs/BLOCKCHAIN_LOCAL_SETUP.md`. Do not redeploy contracts or reset the database when using an already configured local environment.

The browser calls only the backend URL from `VITE_API_BASE_URL`. AI verification, authentication, wallet challenge verification, registration preparation, and receipt confirmation go through the backend. MetaMask sends user-approved wallet messages and transactions directly to the configured local chain.

## Safe example configuration

`.env.example` contains only the frontend API base URL. For a new local checkout, copy it to `.env.local` and set the backend URL for that machine. Keep `.env.local` and all backend environment files out of Git.

## Checks

```powershell
npm run typecheck
npm test
npm run build
```

The production build writes to `docs/` for the existing GitHub Pages setup. Rebuild it only when preparing a deployment; local development uses `npm run dev`.
