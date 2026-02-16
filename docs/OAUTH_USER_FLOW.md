# OAuth User Flow - How It Actually Works

## What Users See (No .env files!)

### Step 1: User visits your website
```
https://agent-builder.company.com
```

### Step 2: User clicks "Login with Google"
```
┌─────────────────────────────────────┐
│  Agent Builder                      │
│                                     │
│  Welcome! Please login:             │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  🔵 Continue with Google     │  │  ← User clicks this
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │  🔷 Continue with Microsoft  │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │  🟠 Continue with Okta       │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Step 3: Browser opens Google login page
```
Browser automatically opens:
https://accounts.google.com/o/oauth2/v2/auth?...

┌─────────────────────────────────────┐
│  Sign in - Google Accounts          │
│                                     │
│  Email or phone                     │
│  ┌──────────────────────────────┐  │
│  │ user@company.com             │  │
│  └──────────────────────────────┘  │
│                                     │
│  Password                          │
│  ┌──────────────────────────────┐  │
│  │ ••••••••                     │  │
│  └──────────────────────────────┘  │
│                                     │
│  [      Sign in      ]             │
└─────────────────────────────────────┘
```

### Step 4: User logs in on Google's website
- User enters their Google credentials
- NO API keys needed
- NO .env files needed
- Just their normal Google login!

### Step 5: Google asks for permission
```
┌─────────────────────────────────────┐
│  Agent Builder wants to:            │
│                                     │
│  ✓ View your email address          │
│  ✓ View your basic profile info     │
│                                     │
│  [  Cancel  ]  [  Allow  ]         │
└─────────────────────────────────────┘
```

### Step 6: Redirect back to your app (logged in!)
```
Browser returns to:
https://agent-builder.company.com/dashboard

User is now logged in!
```

---

## What You Need to Configure (One-Time Setup)

### Server Configuration (.env) - Admin Only

These are **YOUR credentials with Google** (not user credentials):

```bash
# Get these from Google Cloud Console (one-time setup)
GOOGLE_CLIENT_ID=123456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=abc123xyz
GOOGLE_CALLBACK_URL=https://agent-builder.company.com/api/auth/google/callback
```

### Where to Get These:

1. **Go to Google Cloud Console**
   - https://console.cloud.google.com

2. **Create a project** (if you don't have one)
   - Name: "Agent Builder"

3. **Enable Google+ API**
   - APIs & Services → Library
   - Search "Google+ API"
   - Click Enable

4. **Create OAuth Credentials**
   - APIs & Services → Credentials
   - Create Credentials → OAuth 2.0 Client ID
   - Application type: Web application
   - Name: "Agent Builder"

5. **Add Authorized Redirect URIs**
   ```
   http://localhost:3000/api/auth/google/callback    (for dev)
   https://agent-builder.company.com/api/auth/google/callback  (for prod)
   ```

6. **Copy the credentials**
   - Client ID: Copy to .env as GOOGLE_CLIENT_ID
   - Client Secret: Copy to .env as GOOGLE_CLIENT_SECRET

**That's it!** Now all users can login with Google using a browser window.

---

## For Azure AD (Microsoft)

Same process, but in Azure Portal:

1. Go to https://portal.azure.com
2. Azure Active Directory → App registrations → New registration
3. Add redirect URI: `https://agent-builder.company.com/api/auth/azure/callback`
4. Copy Application (client) ID and Client Secret
5. Add to .env:
   ```bash
   AZURE_CLIENT_ID=...
   AZURE_CLIENT_SECRET=...
   AZURE_TENANT_ID=your-tenant-id
   ```

---

## For Okta (Enterprise SSO)

1. Go to your Okta Admin Console
2. Applications → Create App Integration
3. Sign-in method: OIDC
4. Application type: Web Application
5. Sign-in redirect URIs: `https://agent-builder.company.com/api/auth/okta/callback`
6. Add to .env:
   ```bash
   OKTA_DOMAIN=your-company.okta.com
   OKTA_CLIENT_ID=...
   OKTA_CLIENT_SECRET=...
   ```

---

## Summary

**Users don't need ANY configuration!**
- No .env files
- No API keys
- No credentials
- Just click "Login with Google" and use their browser!

**You (admin) configure once:**
- Register your app with Google/Azure/Okta
- Add the credentials to your server's .env file
- Deploy
- All users can login via browser!

---

## Already Implemented

The entire flow is already working in the code:

**Frontend** (`web/src/pages/LoginPage.tsx`):
```typescript
// User clicks this button
<button onClick={() => {
  window.location.href = 'http://localhost:3000/api/auth/google';
}}>
  Continue with Google
</button>
```

**Backend** (`src/server/routes/auth.ts`):
```typescript
// Opens Google login in browser
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google redirects back here after login
router.get('/google/callback',
  handleOAuthCallback('google')
);
```

**No user configuration needed! It just works!** ✅
