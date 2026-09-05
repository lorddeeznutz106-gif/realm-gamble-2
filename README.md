# Unisms Signal Desk

A small browser tool for testing Unisms SMS requests for TNT and Smart numbers. The original Realm Gamble game files remain in the repository, but the default page is now the SMS tester.

## Local Development

```bash
npm install
npm start
```

Open http://localhost:3000. The tester sends requests through `POST /api/unisms/test`, so the API key is not exposed to a third-party browser request.

## Configuration

Configure the endpoint and API key on the server. They are never entered or stored in the browser:

```powershell
$env:UNISMS_API_URL = 'https://your-unisms-endpoint.example/sms'
$env:UNISMS_API_KEY = 'your-unisms-api-key'
npm start
```

The live request includes the JSON fields `network`, `to`, `from`, and `message`, plus both `Authorization: Bearer <key>` and `X-API-Key: <key>` headers. Confirm the exact endpoint and payload names in your Unisms account documentation before sending live traffic.

For validation without sending an SMS:

```powershell
$env:MOCK_UNISMS = 'true'
npm start
```

The mock response confirms input validation and returns the sanitized request.

## Deploy to Railway

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) and create a new project
3. Choose **Deploy from GitHub repo** and select this repository
4. Railway auto-detects Node.js — no extra config needed
5. Once deployed, open the generated URL and share it with friends!

Railway sets `PORT` automatically. Set `UNISMS_API_URL` as a Railway variable for live tests, or `MOCK_UNISMS=true` for a no-send deployment.
