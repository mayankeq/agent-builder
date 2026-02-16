# Google OAuth Setup for Synthient

## Quick Start

1. **Open Google Cloud Console:**
   - Go to: https://console.cloud.google.com/apis/credentials

2. **Create OAuth Credentials:**
   - Click "Create Credentials" → "OAuth client ID"
   - If prompted, configure OAuth consent screen first
   - Application type: **Web application**
   - Name: **Synthient**

3. **Configure URLs:**
   - Authorized JavaScript origins:
     ```
     http://localhost:3000
     ```
   - Authorized redirect URIs:
     ```
     http://localhost:3000/api/auth/google/callback
     ```

4. **Copy Credentials:**
   - After creating, copy the **Client ID** and **Client Secret**

5. **Update .env file:**
   ```bash
   GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=<your-client-secret>
   ```

6. **Start OAuth Server:**
   ```bash
   node oauth-server.js
   ```

## Domain Restrictions

The OAuth system only allows Google Workspace accounts from these domains:
- trilogy.com
- devfactory.com
- aurea.com
- vrya.com

Personal Gmail accounts (@gmail.com) are **not allowed**.

## Adding More Domains

Edit `config/auth-domains.yaml`:

```yaml
allowed_domains:
  - trilogy.com
  - devfactory.com
  - aurea.com
  - vrya.com
  - your-new-domain.com  # Add here
```

## Troubleshooting

### "Redirect URI mismatch"
Make sure the redirect URI in Google Cloud Console exactly matches:
```
http://localhost:3000/api/auth/google/callback
```

### "Access blocked: Synthient has not completed the Google verification process"
This is expected for internal apps. Click "Advanced" → "Go to Synthient (unsafe)" for testing.

For production, you'll need to:
- Complete OAuth consent screen configuration
- Add authorized domains
- Submit for Google verification (for external users)

### Testing the Setup

1. Start OAuth server: `node oauth-server.js`
2. Start frontend: `cd frontend && npm run dev`
3. Open: http://localhost:3001
4. Click "Continue with Google"
5. Sign in with a workspace email from an allowed domain

## OAuth Flow

```
User clicks "Continue with Google"
  ↓
Frontend redirects to: /api/auth/google
  ↓
OAuth server redirects to Google
  ↓
User authenticates with Google
  ↓
Google redirects to: /api/auth/google/callback
  ↓
Server validates domain & workspace account
  ↓
Server generates JWT token
  ↓
Redirects to: http://localhost:3001/auth/callback?token=<jwt>
  ↓
Frontend stores token and shows dashboard
```

## Security Features

✅ **Workspace-only validation** - Blocks personal Gmail accounts
✅ **Domain restrictions** - Only allowed company domains
✅ **JWT tokens** - Secure, stateless authentication
✅ **Token expiration** - 24-hour token lifetime
✅ **Email verification** - Only verified Google accounts
