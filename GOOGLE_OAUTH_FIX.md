# Google OAuth Error Fix

## Error
```
Access blocked: Authorization Error
Error 400: origin_mismatch
```

## Solution

You need to update the **Authorized JavaScript origins** in Google Cloud Console:

### Steps:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to: **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Under **Authorized JavaScript origins**, add:
   - `http://localhost:5173` (for development)
   - `http://localhost:5174` (if using alternate port)
   - Your production domain when deploying

6. Under **Authorized redirect URIs**, ensure you have:
   - `http://localhost:5173/google-callback`
   - `http://localhost:5174/google-callback`
   - Your production callback URL

7. Click **Save**

### Current Issue
The app is running on `http://localhost:5173` but Google OAuth is not configured to accept requests from this origin.

### Note
After updating the origins in Google Cloud Console, wait a few minutes for the changes to propagate, then try logging in again.
