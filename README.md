# spotify-lifetime

A Vite + React app to explore your Spotify streaming history locally in the browser.

## Development

- Prerequisites:
  - Node.js LTS (v18+ recommended)
  - npm

- Install dependencies:
  
  ```powershell
  npm install
  ```

- Start the dev server (hot reload):
  
  ```powershell
  npm run dev
  ```

- Type-check and build for production:
  
  ```powershell
  npm run build
  ```

## Committing and Pushing

- Committing and pushing to `main` is OK.
- IMPORTANT: Please make sure `npm run build` succeeds locally before you push. The site is deployed to AWS Amplify and a failed build will break the published app.

## Deployment

- The app is automatically deployed via AWS Amplify on pushes to the repository.
- Live site: https://main.d16y5u8wx9p5s.amplifyapp.com/

If the live site fails to update, verify the latest build succeeds and check the Amplify console for logs.

## AI Personality Report (Optional)

- Set an environment variable `VITE_OPENAI_API_KEY` with your OpenAI API key.
- After loading data, click `Generate` under `AI Personality Report` in the app.
- Requests are sent client-side via `fetch` to OpenAI's API.
- If the key is missing, you'll see an info message and the button will be disabled.

Example (PowerShell):

```powershell
$env:VITE_OPENAI_API_KEY="sk-your-key"; npm run dev
```
