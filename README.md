# iTexMo SMS Desk

A small browser tool for testing iTexMo SMS requests for TNT and Smart numbers. The original Realm Gamble game files remain in the repository, but the default page is now the SMS tester.

## Local Development

```bash
npm install
npm start
```

Open http://localhost:3000. The tester sends requests through `POST /api/unisms/test`, so credentials are never exposed to a third-party browser request.

## Configuration

Configure iTexMo credentials on the server. They are never entered or stored in the browser:

```powershell
$env:ITEXMO_API_CODE = 'your-api-code'
$env:ITEXMO_CLIENT_ID = 'your-client-id'
$env:ITEXMO_EMAIL = 'your-email@example.com'
$env:ITEXMO_PASSWORD = 'your-password'
npm start
```

The live request sends credentials and SMS details to iTexMo's broadcast endpoint.

For validation without sending an SMS:

```powershell
$env:MOCK_ITEXMO = 'true'
npm start
```

The mock response confirms input validation and returns the sanitized request.

## Deploy to Railway

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) and create a new project
3. Choose **Deploy from GitHub repo** and select this repository
4. Railway auto-detects Node.js — no extra config needed
5. Once deployed, open the generated URL and share it with friends!

Railway sets `PORT` automatically. Set `ITEXMO_API_CODE`, `ITEXMO_CLIENT_ID`, `ITEXMO_EMAIL`, and `ITEXMO_PASSWORD` as Railway variables for live tests, or `MOCK_ITEXMO=true` for a no-send deployment.
