# Quick Setup Instructions

## 1. Create Environment File

Create a `.env.local` file in your project root with the following content:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=bSveL2ARARfr1q4HlGCvp/dSMbTl4QSHmxACus428OU=

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/scheduler-app

# Google Calendar API (optional)
GOOGLE_CALENDAR_API_KEY=your_google_calendar_api_key_here
```

## 2. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Calendar API
4. Go to "APIs & Services" > "OAuth consent screen"
5. Configure OAuth consent screen:
   - Choose "External" user type
   - Fill in app name: "Scheduler App"
   - Add your email as a test user
6. Go to "APIs & Services" > "Credentials"
7. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
8. Copy Client ID and Client Secret to your `.env.local` file

## 3. MongoDB Setup

### Option A: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Use: `MONGODB_URI=mongodb://localhost:27017/scheduler-app`

### Option B: MongoDB Atlas (Recommended)
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Get connection string
4. Use: `MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/scheduler-app`

## 4. Run the Application

```bash
npm run dev
```

## 5. Test the Application

1. Open http://localhost:3000
2. Click "I'm a Seller" or "I'm a Buyer"
3. Sign in with Google
4. Complete the setup process

## Troubleshooting

### 403 Access Denied Error
- Make sure your email is added to test users in Google OAuth consent screen
- Check that redirect URI matches exactly
- Clear browser cache and cookies

### MongoDB Connection Error
- Verify MongoDB is running (if using local)
- Check connection string format
- Ensure network access is allowed (if using Atlas)

### Google Calendar API Error
- Make sure Google Calendar API is enabled
- Check that scopes are properly configured
- Verify API key is correct (if using one)

## Next Steps

1. Complete Google OAuth setup
2. Set up MongoDB
3. Test the application
4. Deploy to Vercel for production

For detailed instructions, see `GOOGLE_OAUTH_SETUP.md`
