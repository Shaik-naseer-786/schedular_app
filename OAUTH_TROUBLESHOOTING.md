# OAuth Troubleshooting Guide

## Current Issue: 403 Access Denied
**Error**: `naseersalmashaik@gmail.com` is not in the test users list

## Step-by-Step Fix

### 1. Google Cloud Console Setup
1. Go to: https://console.cloud.google.com/
2. Select your project
3. Navigate to: **APIs & Services** → **OAuth consent screen**

### 2. OAuth Consent Screen Configuration
**Required Settings:**
- **User Type**: External
- **Publishing Status**: Testing
- **App Name**: NextJS Scheduler (or your preferred name)
- **User Support Email**: naseersalmashaik@gmail.com
- **Developer Contact**: naseersalmashaik@gmail.com

**Scopes Required:**
- `../auth/userinfo.email`
- `../auth/userinfo.profile`
- `../auth/calendar.events`
- `../auth/calendar.readonly`

**Test Users (CRITICAL):**
- Add: `naseersalmashaik@gmail.com`
- Add any other emails you want to test with

### 3. OAuth 2.0 Credentials
1. Go to: **APIs & Services** → **Credentials**
2. Find your OAuth 2.0 Client ID
3. **Authorized redirect URIs must include:**
   - `http://localhost:3000/api/auth/callback/google`

### 4. Environment Variables Check
Your `.env.local` should contain:
```env
GOOGLE_CLIENT_ID=your_actual_client_id_from_console
GOOGLE_CLIENT_SECRET=your_actual_client_secret_from_console
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=bSveL2ARARfr1q4HlGCvp/dSMbTl4QSHmxACus428OU=
MONGODB_URI=mongodb://localhost:27017/scheduler-app
```

### 5. APIs Enabled
Make sure these APIs are enabled:
- Google Calendar API
- Google+ API (if available)

## Testing Steps

1. **Clear browser cache and cookies** for localhost:3000
2. **Restart your development server**:
   ```bash
   npm run dev
   ```
3. **Try signing in again**

## Common Issues

### Issue: "This app isn't verified"
**Solution**: This is normal for testing. Click "Advanced" → "Go to NextJS Scheduler (unsafe)"

### Issue: "Invalid client"
**Solution**: Check your Client ID and Client Secret in `.env.local`

### Issue: "Redirect URI mismatch"
**Solution**: Ensure redirect URI in Google Console exactly matches: `http://localhost:3000/api/auth/callback/google`

## Verification Checklist

- [ ] Email `naseersalmashaik@gmail.com` is in test users list
- [ ] App is in "Testing" mode
- [ ] Redirect URI is correct
- [ ] Client ID and Secret are correct in `.env.local`
- [ ] Google Calendar API is enabled
- [ ] Development server restarted
- [ ] Browser cache cleared

## Still Having Issues?

If you're still getting the 403 error after adding your email to test users:

1. **Wait 5-10 minutes** for Google's changes to propagate
2. **Try a different browser** or incognito mode
3. **Double-check the email spelling** in test users list
4. **Verify you're using the correct Google account** (naseersalmashaik@gmail.com)

The key fix is adding your email to the test users list in the OAuth consent screen!
