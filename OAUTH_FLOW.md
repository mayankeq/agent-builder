# Synthient OAuth Flow

## Visual Flow Diagram

```
┌─────────────┐
│   Browser   │
│  localhost  │
│    :3001    │
└──────┬──────┘
       │
       │ 1. User clicks "Continue with Google"
       │
       ↓
┌──────────────────────────────────────────────────────┐
│            Frontend (React)                          │
│  • Redirects to: /api/auth/google                   │
└──────────────────┬───────────────────────────────────┘
                   │
                   │ 2. Redirect to OAuth backend
                   │
                   ↓
┌──────────────────────────────────────────────────────┐
│         OAuth Backend (Express + Passport)           │
│  • Endpoint: GET /api/auth/google                   │
│  • Redirects to: Google OAuth                       │
└──────────────────┬───────────────────────────────────┘
                   │
                   │ 3. Redirect to Google
                   │
                   ↓
┌──────────────────────────────────────────────────────┐
│            Google OAuth Service                      │
│  • User sees Google sign-in page                    │
│  • User authenticates                               │
│  • User grants permissions                          │
└──────────────────┬───────────────────────────────────┘
                   │
                   │ 4. OAuth callback with auth code
                   │
                   ↓
┌──────────────────────────────────────────────────────┐
│         OAuth Backend (Passport Callback)            │
│  • Endpoint: GET /api/auth/google/callback          │
│  • Exchanges code for tokens with Google            │
│  • Gets user profile from Google                    │
└──────────────────┬───────────────────────────────────┘
                   │
                   │ 5. Validation
                   │
                   ↓
┌──────────────────────────────────────────────────────┐
│               Validation Checks                      │
│  ✓ Email verified?                                  │
│  ✓ Workspace account? (not @gmail.com)             │
│  ✓ Domain in allowed list?                         │
│    • trilogy.com                                    │
│    • devfactory.com                                 │
│    • aurea.com                                      │
│    • vrya.com                                       │
└──────────────────┬───────────────────────────────────┘
                   │
                   │ 6. If validation passes
                   │
                   ↓
┌──────────────────────────────────────────────────────┐
│            Generate JWT Token                        │
│  • Sign with JWT_SECRET                             │
│  • Payload: {id, email, name, domain}              │
│  • Expiration: 24 hours                             │
└──────────────────┬───────────────────────────────────┘
                   │
                   │ 7. Redirect to frontend with token
                   │
                   ↓
┌──────────────────────────────────────────────────────┐
│         Frontend Callback Handler                    │
│  • URL: /auth/callback?token=<jwt>                 │
│  • Stores token in localStorage                     │
│  • Sets token in API client                         │
└──────────────────┬───────────────────────────────────┘
                   │
                   │ 8. Fetch user profile
                   │
                   ↓
┌──────────────────────────────────────────────────────┐
│            Fetch User Data                           │
│  • GET /api/auth/me                                 │
│  • Headers: Authorization: Bearer <jwt>             │
│  • Returns: {id, email, name, picture, domain}     │
└──────────────────┬───────────────────────────────────┘
                   │
                   │ 9. Success!
                   │
                   ↓
┌──────────────────────────────────────────────────────┐
│              Dashboard                               │
│  • User is authenticated                            │
│  • Can create agents                                │
│  • Can view agent list                              │
└──────────────────────────────────────────────────────┘
```

## Detailed Step-by-Step

### Step 1: User Clicks "Continue with Google"

**Location:** `frontend/src/components/Login.tsx`

```typescript
const handleGoogleLogin = () => {
  apiClient.initiateGoogleLogin(); // Redirects to /api/auth/google
};
```

### Step 2: Backend Initiates OAuth

**Location:** `oauth-server.js`

```javascript
app.get('/api/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false
  })
);
```

Passport automatically redirects to Google OAuth with:
- Client ID
- Redirect URI
- Requested scopes (profile, email)

### Step 3: User Authenticates with Google

Google shows their standard OAuth consent screen:
- "Synthient wants to access your Google Account"
- Shows requested permissions (profile, email)
- User clicks "Allow"

### Step 4: Google Redirects Back

Google redirects to: `http://localhost:3000/api/auth/google/callback?code=<auth-code>`

Backend exchanges code for access token and gets user profile.

### Step 5: Validation

**Location:** `oauth-server.js` - GoogleStrategy callback

```javascript
passport.use(new GoogleStrategy({...}, async (accessToken, refreshToken, profile, done) => {
  const email = profile.emails[0].value;

  // 1. Check email is verified
  if (!profile.emails[0].verified) {
    return done(null, false, { message: 'Email not verified' });
  }

  // 2. Check it's a workspace account
  const domain = email.split('@')[1];
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    return done(null, false, {
      message: 'Only Google Workspace accounts are allowed'
    });
  }

  // 3. Check domain is in allowed list
  if (!allowedDomains.includes(domain)) {
    return done(null, false, {
      message: `Domain ${domain} is not authorized`
    });
  }

  // All checks passed!
  const user = { id, email, name, picture, domain };
  const token = generateToken(user);
  return done(null, { user, token });
}));
```

### Step 6: JWT Generation

```javascript
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, domain: user.domain },
    process.env.JWT_SECRET,
    { expiresIn: '24h', issuer: 'synthient' }
  );
}
```

### Step 7: Redirect to Frontend

Backend redirects to: `http://localhost:3001/auth/callback?token=<jwt>`

### Step 8: Frontend Handles Callback

**Location:** `frontend/src/components/AuthCallback.tsx`

```typescript
const handleCallback = async () => {
  const token = searchParams.get('token');

  // Save token
  setToken(token);

  // Fetch user data
  await fetchUser();

  // Navigate to dashboard
  navigate('/dashboard');
};
```

### Step 9: Fetch User Profile

**Location:** `frontend/src/context/AuthContext.tsx`

```typescript
const fetchUser = async () => {
  const response = await apiClient.getCurrentUser();
  setUser(response);
  setAuthenticated(true);
};
```

API call:
```
GET /api/auth/me
Headers: Authorization: Bearer <jwt>
```

Backend verifies JWT and returns user data.

## Security Features

### 1. Domain Validation

```javascript
const allowedDomains = ['trilogy.com', 'devfactory.com', 'aurea.com', 'vrya.com'];

function isAllowedDomain(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  return allowedDomains.some(d => d.toLowerCase() === domain);
}
```

### 2. Workspace-Only Check

```javascript
function isWorkspaceAccount(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain !== 'gmail.com' && domain !== 'googlemail.com';
}
```

This prevents personal Gmail accounts while allowing Google Workspace accounts.

### 3. JWT Token Security

- **Signed:** Uses JWT_SECRET (64-byte random string)
- **Expiration:** 24 hours
- **Issuer:** "synthient" (prevents token reuse from other apps)
- **Claims:** Minimal data (id, email, name, domain)

### 4. Protected Routes

**Backend:**
```javascript
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.user = decoded;
  next();
}
```

**Frontend:**
```typescript
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

## Error Handling

### Validation Failures

| Check | Error Message | User Sees |
|-------|---------------|-----------|
| Email not verified | "Email not verified" | Redirect to login with error |
| Personal Gmail | "Only Google Workspace accounts are allowed" | Error message on login page |
| Unauthorized domain | "Domain X is not authorized. Allowed domains: ..." | List of allowed domains |

### OAuth Errors

| Error | Cause | Solution |
|-------|-------|----------|
| redirect_uri_mismatch | Redirect URI not configured in Google Console | Add exact URI to Google Console |
| access_denied | User clicked "Cancel" | Show friendly message, allow retry |
| invalid_client | Wrong Client ID/Secret | Check .env file |

## Testing Scenarios

### ✅ Should Succeed

```
Email: john@trilogy.com
Result: ✅ JWT token generated, redirected to dashboard
```

```
Email: jane@devfactory.com
Result: ✅ JWT token generated, redirected to dashboard
```

### ❌ Should Fail

```
Email: user@gmail.com
Result: ❌ "Only Google Workspace accounts are allowed"
```

```
Email: user@other-company.com
Result: ❌ "Domain other-company.com is not authorized"
```

```
Email: unverified@trilogy.com (email not verified in Google)
Result: ❌ "Email not verified"
```

## Configuration

### Environment Variables

```bash
# OAuth Credentials
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=yyy
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Security
SESSION_SECRET=<64-byte-hex>
JWT_SECRET=<64-byte-hex>

# URLs
FRONTEND_URL=http://localhost:3001
ALLOWED_ORIGINS=http://localhost:3001
```

### Domain List

**File:** `config/auth-domains.yaml`

```yaml
allowed_domains:
  - trilogy.com
  - devfactory.com
  - aurea.com
  - vrya.com
```

Add domains without code changes, just restart the server.

## Token Lifecycle

```
Token Created
  ↓
Stored in localStorage (frontend)
  ↓
Added to API requests (Authorization header)
  ↓
Verified by backend (JWT signature check)
  ↓
Expired after 24 hours
  ↓
User must re-authenticate
```

## Logout Flow

```
User clicks "Logout"
  ↓
Frontend calls: POST /api/auth/logout
  ↓
Backend invalidates token (optional)
  ↓
Frontend clears localStorage
  ↓
Frontend redirects to /login
```

## Production Considerations

### HTTPS Required

Google OAuth requires HTTPS in production:
- ✅ Development: http://localhost allowed
- ❌ Production: Must use https://

### Callback URLs

Update in both places:
1. **Google Cloud Console:** Authorized redirect URIs
2. **.env file:** `GOOGLE_CALLBACK_URL`

Must match exactly!

### Token Refresh

Current implementation: 24-hour tokens, no refresh.

For production, consider:
- Refresh tokens (store securely)
- Shorter access token lifetime (1 hour)
- Automatic token refresh before expiration

### Session Storage

Current: In-memory (lost on restart)

For production:
- Use Redis for session storage
- Use PostgreSQL for user data
- Add session cleanup (remove expired sessions)

## Troubleshooting

### "redirect_uri_mismatch"

**Check:**
1. Google Console redirect URI
2. .env GOOGLE_CALLBACK_URL
3. Must match exactly (no trailing slash)

### "invalid_client"

**Check:**
1. GOOGLE_CLIENT_ID in .env
2. GOOGLE_CLIENT_SECRET in .env
3. Credentials are from correct Google Cloud project

### "Domain not authorized"

**Check:**
1. User's email domain
2. config/auth-domains.yaml
3. Server restarted after config change

### Token not working

**Check:**
1. Token in Authorization header
2. Format: "Bearer <token>"
3. Token not expired (24 hours)
4. JWT_SECRET matches between token creation and verification
