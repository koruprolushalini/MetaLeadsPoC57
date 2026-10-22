# Meta Leads Real-Time Dashboard

A proof of concept that receives Meta Lead Ads webhook notifications, fetches lead details, and delivers lead updates to a React Native Expo dashboard through WebSockets.

## Features

- Receives Meta `leadgen` webhook notifications.
- Verifies Meta webhook subscriptions.
- Fetches lead details using the Meta Graph API.
- Sends lead updates to connected dashboard clients over WebSockets.
- Displays recent leads and WebSocket connection status.
- Skips duplicate lead IDs during the current backend process.

## Architecture

1. Meta Lead Ads generates a lead event.
2. Meta sends a webhook notification to the Express backend through the public HTTPS ngrok URL.
3. The backend acknowledges the webhook and processes the lead notification.
4. The backend fetches lead details from the Meta Graph API.
5. The backend broadcasts the lead to connected WebSocket clients.
6. The Expo app updates the dashboard without requiring a manual refresh.

## Prerequisites

- Node.js and npm
- Expo Go on a compatible mobile device
- A Meta developer app with Lead Ads webhook access
- ngrok for exposing the local backend during development

## Run locally

### 1. Start the backend

Open a terminal:

```bash
cd backend
npm install
npm start
```

The backend should listen on port 3000.

### 2. Configure environment variables

Create a `backend/.env` file containing the required Meta credentials and webhook verification token. Use the variable names expected by `backend/server.js`.

Do not commit `.env` or share access tokens publicly.

### 3. Start ngrok

In a separate terminal:

```bash
ngrok http 3000
```

Configure the Meta webhook callback using the current HTTPS ngrok URL followed by `/webhook`. Update the callback URL whenever the ngrok URL changes.

### 4. Start the Expo app

From the project root:

```bash
npx expo start --lan
```

Connect your phone and laptop to the same Wi-Fi network, then scan the QR code in Expo Go.

## Testing performed

- Confirmed that Meta webhook requests reached the backend.
- Confirmed that the dashboard can display test lead data.
- Replayed a webhook and verified that a duplicate lead ID was skipped.
- Verified that the dashboard reconnected after reopening Expo Go.
- Observed lead updates in the dashboard during webhook replay testing.

## Assumptions and limitations

- This is a development proof of concept, not a production-ready deployment.
- Duplicate lead IDs are tracked in memory and are not persisted across backend restarts.
- ngrok provides temporary development access to the local backend.
- Meta access tokens can expire and may need renewal.
- Production deployment should add persistent storage, stronger webhook validation, secure credential management, monitoring, and more robust error handling.

## Security

- Keep access tokens and verification secrets in environment variables.
- Never commit `.env` files or expose credentials in screenshots or logs.
- Use test leads and avoid exposing real customer information in demonstrations.
