# Google OAuth Setup Guide - Fixing 403 Access Denied Error

## The Problem
You're getting a "403: access_denied" error because your Google OAuth app is in testing mode and needs proper configuration.

## Solution Steps

### 1. Google Cloud Console Configuration

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Select your project** (or create a new one)
3. **Enable APIs**:
   - Go to "APIs & Services" > "Library"
   - Search and enable "Google Calendar API"
   - Search and enable "Google+ API" (if available)

### 2. Configure OAuth Consent Screen

1. **Go to "APIs & Services" > "OAuth consent screen"**
2. **Choose "External" user type** (unless you have a Google Workspace)
3. **Fill in the required fields**:
   - App name: "Scheduler App" (or your preferred name)
   - User support email: Your email
   - Developer contact information: Your email
4. **Add scopes**:
   - Click "Add or Remove Scopes"
   - Add these scopes:
     - `../auth/userinfo.email`
     - `../auth/userinfo.profile`
     - `../auth/calendar.events`
     - `../auth/calendar.readonly`
5. **Add test users**:
   - In the "Test users" section, add your email address
   - Add any other emails you want to test with
6. **Save and continue** through all steps

### 3. Create OAuth 2.0 Credentials

1. **Go to "APIs & Services" > "Credentials"**
2. **Click "Create Credentials" > "OAuth 2.0 Client IDs"**
3. **Choose "Web application"**
4. **Add authorized redirect URIs**:
   - For development: `http://localhost:3000/api/auth/callback/google`
   - For production: `https://your-domain.vercel.app/api/auth/callback/google`
5. **Click "Create"**
6. **Copy the Client ID and Client Secret**

### 4. Update Environment Variables

Create or update your `.env.local` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_actual_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_string_here

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/scheduler-app

# Google Calendar API (optional for basic functionality)
GOOGLE_CALENDAR_API_KEY=your_api_key_here
```

### 5. Generate NextAuth Secret

Run this command to generate a secure secret:

```bash
openssl rand -base64 32
```

Or use an online generator: https://generate-secret.vercel.app/32

### 6. Test the Application

1. **Restart your development server**:
   ```bash
   npm run dev
   ```

2. **Clear browser cache and cookies** for localhost:3000

3. **Try signing in again**

## Common Issues and Solutions

### Issue 1: "This app isn't verified"
- **Solution**: This is normal for testing. Click "Advanced" > "Go to Scheduler App (unsafe)" to proceed.

### Issue 2: "Access blocked: This app's request is invalid"
- **Solution**: Check that your redirect URI exactly matches what's in Google Cloud Console.

### Issue 3: "Error 403: access_denied"
- **Solution**: Make sure your email is added to the test users list in OAuth consent screen.

### Issue 4: "Invalid client" error
- **Solution**: Double-check your Client ID and Client Secret in the environment variables.

## Production Deployment

When deploying to production:

1. **Update OAuth consent screen**:
   - Add your production domain to authorized domains
   - Submit for verification if you want to remove the "unverified app" warning

2. **Add production redirect URI**:
   - Add `https://your-domain.vercel.app/api/auth/callback/google` to authorized redirect URIs

3. **Update environment variables in Vercel**:
   - Set `NEXTAUTH_URL` to your production domain
   - Update all other environment variables

## Testing Checklist

- [ ] Google Calendar API is enabled
- [ ] OAuth consent screen is configured
- [ ] Test users are added
- [ ] Redirect URIs are correct
- [ ] Environment variables are set
- [ ] Development server is restarted
- [ ] Browser cache is cleared

## Still Having Issues?

If you're still getting errors:

1. **Check the browser console** for detailed error messages
2. **Verify your Google Cloud Console settings** match exactly
3. **Try using a different browser** or incognito mode
4. **Check that your email is in the test users list**

The key is making sure your email address is added as a test user in the OAuth consent screen configuration.
