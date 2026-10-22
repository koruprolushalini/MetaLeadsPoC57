# Meta Leads Real-Time Dashboard

A proof of concept that receives Meta Lead Ads webhook notifications, fetches lead details using the Meta Graph API, and displays lead updates in a React Native Expo dashboard through WebSockets.

## Features

- Receives Meta `leadgen` webhook notifications.
- Verifies Meta webhook subscriptions.
- Fetches lead details using the Meta Graph API.
- Sends new lead updates to connected dashboard clients through WebSockets.
- Displays recent leads and WebSocket connection status.
- Automatically reconnects the dashboard when the WebSocket connection drops.
- Prevents duplicate lead IDs during the current backend session.
- Maintains the latest 20 leads in memory.

## Technology Stack

- **Frontend:** React Native, Expo, TypeScript
- **Backend:** Node.js, Express.js
- **Real-time communication:** WebSockets (`ws` package)
- **External API:** Meta Graph API
- **Webhook testing:** Meta Developer tools
- **Development tunnel:** ngrok

## Architecture

The application follows this workflow:

1. A lead is generated through Meta Lead Ads.
2. Meta sends a `leadgen` webhook notification to the backend.
3. The Express backend acknowledges the webhook request.
4. The backend retrieves lead details through the Meta Graph API.
5. The backend stores the latest lead information in memory.
6. The backend broadcasts the new lead to connected WebSocket clients.
7. The Expo dashboard updates automatically without requiring a manual refresh.
8. When a dashboard client reconnects, the backend sends the latest available leads.

## Prerequisites

Before running the project, install or configure:

- Node.js and npm
- Expo Go on a compatible mobile device
- A Meta developer app configured for Lead Ads webhooks
- The required Meta permissions and a valid Page access token
- ngrok for exposing the local backend through HTTPS

## Project Structure

```text
MetaLeadsPoC57/
├── backend/
│   ├── .env
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
├── src/
│   └── app/
│       └── index.tsx
├── .gitignore
└── README.md
```

The `.env` file contains local secrets and must not be committed to GitHub.

## Installation and Setup

### 1. Install backend dependencies

Open a terminal in the project root and run:

```bash
cd backend
npm install
```

### 2. Configure environment variables

Create a file named `.env` inside the `backend` directory.

Add the following variables using your own credentials:

```env
META_PAGE_ACCESS_TOKEN=your_page_access_token
META_VERIFY_TOKEN=your_webhook_verification_token
PORT=3000
```

These are example values. Replace the placeholders with your actual configuration. Keep all credentials private.

The `PORT` variable is optional if the backend already defaults to port `3000`.

### 3. Start the backend

In the backend terminal, run:

```bash
npm start
```

The expected startup message is:

```text
Backend running on port 3000
```

You can check the backend health endpoint by opening:

`http://localhost:3000/`

The backend should return a JSON response confirming that it is running.

### 4. Start ngrok

Open a second terminal and run:

```bash
ngrok http 3000
```

Copy the current HTTPS forwarding URL provided by ngrok.

Configure the Meta webhook callback URL as:

```text
YOUR_NGROK_HTTPS_URL/webhook
```

Use the same verification token configured in `META_VERIFY_TOKEN`.

Subscribe the Meta webhook to the `leadgen` event and ensure the appropriate Page subscription and permissions are configured.

**Important:** A free ngrok URL may change when ngrok restarts. Update the Meta webhook callback URL whenever necessary.

### 5. Configure the frontend WebSocket URL

Open `src/app/index.tsx` and check the `WEBSOCKET_URL` constant.

It should use the current ngrok hostname, the secure WebSocket protocol `wss://`, and the `/ws` path.

Example:

```typescript
const WEBSOCKET_URL = 'wss://YOUR_NGROK_HOSTNAME/ws';
```

Replace the example hostname with the current ngrok hostname.

Whenever the ngrok URL changes, update both the Meta webhook callback URL and the frontend WebSocket URL.

### 6. Start the Expo application

Open a third terminal in the project root and run:

```bash
npx expo start --lan
```

Scan the QR code using Expo Go on your mobile device.

Keep your phone and computer connected to the same Wi-Fi network when using LAN mode.

If the terminal reports that the default port is already in use, follow the prompt to select another available port.

## How to Test

1. Start the backend, ngrok, and Expo application.
2. Verify that the backend is running.
3. Confirm that the dashboard WebSocket status changes to `Connected`.
4. Use the Meta developer tools to send a test lead event.
5. Confirm that the webhook notification reaches the backend.
6. Confirm that the backend retrieves the lead details successfully.
7. Check that the dashboard displays the new lead automatically.
8. Replay the same lead event and verify that the backend skips the duplicate lead ID.
9. Reopen Expo Go and verify that the dashboard reconnects and receives the recent leads snapshot.

## Testing Performed

The following checks were observed during development:

- Meta webhook requests reached the local backend through ngrok.
- Test lead data appeared in the dashboard.
- Duplicate lead ID handling was observed during webhook replay.
- The dashboard reconnected after reopening Expo Go.
- The WebSocket connection status and lead count were displayed in the application.

A fresh end-to-end lead event should be tested before the final demonstration to confirm the complete flow.

## Assumptions and Limitations

- This project is a development proof of concept, not a production-ready application.
- Lead records are stored in memory and are lost when the backend restarts.
- Duplicate lead IDs are tracked in memory and are not persisted across backend restarts.
- The dashboard can display up to 20 recent leads received by the current backend process.
- ngrok provides temporary access to the local development server.
- Meta access tokens may expire or require renewed permissions.
- The application depends on a reachable backend and a working WebSocket connection.
- The current implementation does not include persistent database storage or production-grade user authentication.

## Security Considerations

- Store access tokens and webhook verification secrets in environment variables.
- Never commit `.env` files to GitHub.
- Do not include credentials in source code, screenshots, video recordings, or logs.
- Avoid exposing real customer names, email addresses, or other personal information in demonstrations.
- Before production deployment, implement appropriate authentication, authorization, access controls, and data protection measures.

## Future Improvements

- Store lead records in a persistent database.
- Implement durable duplicate prevention across backend restarts.
- Add authentication and authorization.
- Improve error handling and monitoring.
- Add automated tests for webhook processing and WebSocket communication.
- Deploy the backend to a stable HTTPS hosting environment.
- Improve dashboard filtering, search, and lead management features.

## Author

Developed as a proof-of-concept project for real-time Meta Lead Ads integration and dashboard updates.
