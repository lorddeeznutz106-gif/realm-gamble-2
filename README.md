# SMS8 Test Console
 
 A small Node.js and Express app for sending one test SMS through SMS8. The browser never receives the SMS8 API key. SMS8 sends through the paired phone and SIM configured in the SMS8 account.
 
 ## 1. SMS8 setup
 
 1. Sign in to SMS8 and pair the phone that should send the message.
 2. Confirm the phone is online and SMS8 has SMS permission.
 3. Open the SMS8 API page and generate an API key.
 4. Regenerate any key that has been shared in chat, screenshots, or source files.
 
 ## 2. Local setup
 
 Install dependencies and start the app:
 
 ```powershell
 npm install
 $env:SMS8_API_KEY = 'your-new-sms8-api-key'
 npm.cmd start
 ```
 
 Open `http://localhost:3000`.
 
The app does not force a device or SIM. SMS8 chooses the active default sender from the paired account.
 
 ## 3. Railway setup
 
 1. Push this repository to GitHub.
 2. Create a Railway project from the GitHub repository.
 3. Open the service's **Variables** tab.
 4. Add these variables without quotation marks:
 
 ```env
 SMS8_API_KEY=your-new-sms8-api-key
 ```
 
 5. Save the variables and redeploy.
 6. Open the generated Railway public URL.
 
 Railway supplies `PORT` automatically. The app uses this SMS8 endpoint by default:
 
 ```text
 https://app.sms8.io/services/send.php
 ```
 
 Only set `SMS8_API_URL` if SMS8 gives you a different endpoint. Do not put the API key in HTML, JavaScript, or a GitHub file.
 
 ## 4. Send a test
 
 1. Enter the recipient in Philippine format, for example `09171234567`.
 2. Enter a short message.
 3. Click **RUN API TEST**.
 4. Check the SMS8 dashboard and the receiving phone.
 
 The app converts local Philippine numbers to E.164 format, such as `+639171234567`, and sends the request as form data:
 
 ```text
 key=...
 number=+639171234567
 message=...
 ```
 
 The app reports success when SMS8 returns `success: true`. That means SMS8 accepted the request; it does not guarantee carrier delivery.
 
 ## 5. Troubleshooting
 
 - If Railway reports a missing key, check that `SMS8_API_KEY` is saved and redeploy.
- SMS8 chooses the active default device and SIM; verify that the paired phone is online in SMS8.
 - If SMS8 says sent but no phone receives the message, check that the paired phone is online, has signal, has SMS permission, and can send a normal SMS manually.
 - Test from the SMS8 dashboard directly. If that also fails, the issue is the phone, SIM, carrier, or SMS8 account rather than this app.
 - Use a different recipient number to distinguish recipient filtering from sender-device problems.
 
 ## Development
 
 ```powershell
 npm.cmd start
 ```
 
The browser calls `POST /api/sms8/test`. The server validates the input and forwards the request to SMS8.
