# Synthient Frontend

Modern React web application for creating AI agents with domain-restricted Google OAuth authentication.

## 🎨 Features

- ✅ **Google OAuth Login** with domain restrictions
- ✅ **Agent Creation UI** with intuitive form builder
- ✅ **Dashboard** with agent list and progress tracking
- ✅ **Real-time Updates** for agent build progress
- ✅ **Responsive Design** - works on desktop, tablet, mobile
- ✅ **Modern UI** with Tailwind CSS and Lucide icons
- ✅ **TypeScript** for type safety
- ✅ **Zustand** for state management

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Backend API running on `http://localhost:3000`
- Google OAuth configured (see `/OAUTH_SETUP_GUIDE.md`)

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:3001`

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Login.tsx           # Login page with Google OAuth
│   │   ├── AuthCallback.tsx    # OAuth callback handler
│   │   ├── Dashboard.tsx       # Main dashboard layout
│   │   ├── AgentCreator.tsx    # Agent creation form
│   │   ├── AgentList.tsx       # List of user's agents
│   │   └── ProtectedRoute.tsx  # Auth guard for routes
│   ├── context/
│   │   └── AuthContext.tsx     # Global auth state (Zustand)
│   ├── api/
│   │   └── client.ts           # API client with axios
│   ├── types/
│   │   └── index.ts            # TypeScript types
│   ├── App.tsx                 # Main app with routing
│   ├── main.tsx                # Entry point
│   └── index.css               # Tailwind styles
├── index.html                  # HTML template
├── vite.config.ts              # Vite configuration
├── tailwind.config.js          # Tailwind configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies
```

## 🔧 Configuration

### Environment Variables

Create `.env` file:

```bash
VITE_API_URL=http://localhost:3000
```

### Proxy Configuration

The Vite dev server is configured to proxy API requests:

```typescript
// vite.config.ts
proxy: {
  '/api': 'http://localhost:3000',
  '/auth': 'http://localhost:3000',
}
```

## 🎯 Pages & Routes

| Route | Component | Description | Protected |
|-------|-----------|-------------|-----------|
| `/` | Redirect | Redirects to `/dashboard` | - |
| `/login` | Login | Google OAuth login page | No |
| `/auth/callback` | AuthCallback | OAuth redirect handler | No |
| `/dashboard` | Dashboard | Main app (create & list agents) | Yes |

## 🔐 Authentication Flow

```
1. User clicks "Sign in with Google"
   ↓
2. Redirected to backend: /auth/google
   ↓
3. Backend redirects to Google OAuth
   ↓
4. User signs in with company email
   ↓
5. Google redirects to: /auth/google/callback
   ↓
6. Backend validates domain & generates JWT
   ↓
7. Backend redirects to: /auth/callback?token=xxx
   ↓
8. Frontend saves token & fetches user
   ↓
9. User redirected to /dashboard ✅
```

## 📦 Components

### Login Component
- Beautiful landing page with Google OAuth button
- Shows allowed domains
- Security information display
- Matches marketing website design

### Dashboard Component
- Navigation bar with user info
- Tabs for "Create Agent" and "My Agents"
- Logout functionality
- Responsive mobile menu

### AgentCreator Component
- Multi-step form for agent creation
- Fields:
  - Description (required)
  - Output format (MCP, Skill, CLI, Library)
  - Language (TypeScript, Python)
  - Options (tests, docs, optimization)
- Real-time validation
- Success/error notifications

### AgentList Component
- Lists all user's agents
- Status badges (pending, in_progress, completed, failed)
- Progress bars for active builds
- Download buttons for completed agents
- Empty state for new users

## 🎨 Styling

### Tailwind CSS

The app uses Tailwind CSS with custom colors matching the marketing website:

```javascript
colors: {
  primary: { /* Blue shades */ },
  accent: { /* Purple shades */ }
}
```

### Animations

- `animate-fade-in` - Fade in effect
- `animate-slide-up` - Slide up effect
- `animate-pulse-slow` - Slow pulse effect

### Icons

Using **Lucide React** for icons:
- Brain, Sparkles - Branding
- LogOut, User - User actions
- Plus, List - Navigation
- Loader2 - Loading states
- CheckCircle, XCircle - Status indicators

## 📡 API Integration

### API Client (`src/api/client.ts`)

```typescript
// Authentication
apiClient.getAuthConfig()           // Get allowed domains
apiClient.getCurrentUser()          // Get user profile
apiClient.logout()                  // Logout
apiClient.initiateGoogleLogin()     // Start OAuth flow

// Agents
apiClient.createAgent(request)      // Create new agent
apiClient.getAgent(sessionId)       // Get agent status
apiClient.listAgents()              // List user's agents
```

### Authentication Interceptors

- **Request**: Automatically adds JWT token to headers
- **Response**: Redirects to login on 401 errors

## 🧪 Development

### Run Development Server

```bash
npm run dev
```

Runs on `http://localhost:3001` with hot reload.

### Build for Production

```bash
npm run build
```

Creates optimized build in `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

### Linting

```bash
npm run lint
```

## 🚀 Deployment

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production
vercel --prod
```

**Environment Variables:**
- `VITE_API_URL` - Your backend API URL

### Option 2: Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

**Build Settings:**
- Build command: `npm run build`
- Publish directory: `dist`

### Option 3: Static Hosting

Build and upload `dist/` folder to:
- AWS S3 + CloudFront
- Google Cloud Storage
- Azure Static Web Apps
- GitHub Pages

### Option 4: Docker

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🔧 Troubleshooting

### Issue: "Network Error" when calling API

**Solution:**
1. Ensure backend is running on `http://localhost:3000`
2. Check CORS is enabled in backend
3. Verify proxy configuration in `vite.config.ts`

### Issue: OAuth redirect fails

**Solution:**
1. Check Google Console callback URL: `http://localhost:3001/auth/callback`
2. Ensure backend redirect URL matches: `http://localhost:3001/auth/callback?token=xxx`
3. Verify `GOOGLE_CALLBACK_URL` in backend `.env`

### Issue: "Token expired" after some time

**Solution:**
- Tokens expire after 24 hours by default
- User will be automatically redirected to login
- Configure expiry in backend `config/auth-domains.yaml`

### Issue: Styles not loading

**Solution:**
```bash
# Reinstall Tailwind dependencies
npm install -D tailwindcss postcss autoprefixer
```

## 📊 State Management

### Auth State (Zustand)

```typescript
const { user, isAuthenticated, login, logout } = useAuthStore();
```

**State:**
- `user` - Current user object
- `isAuthenticated` - Boolean auth status
- `isLoading` - Loading indicator
- `error` - Error message

**Actions:**
- `setUser(user)` - Set current user
- `setToken(token)` - Save JWT token
- `login()` - Initiate OAuth flow
- `logout()` - Clear session
- `fetchUser()` - Load user data

## 🎯 Integration with Marketing Website

The marketing website (`/website/index.html`) links to the React app:

**Navigation:**
```html
<a href="http://localhost:3001">Launch App →</a>
```

**Hero CTA:**
```html
<a href="http://localhost:3001">Launch App →</a>
```

For production, update these URLs to your deployed app URL.

## 📝 Next Steps

### To Complete Integration:

1. **Connect Backend** - Ensure backend APIs are implemented
2. **Real-time Updates** - Add WebSocket for build progress
3. **File Downloads** - Implement agent download functionality
4. **User Settings** - Add user preferences page
5. **Admin Panel** - Add admin dashboard for user management

### Future Enhancements:

- [ ] Dark mode toggle
- [ ] Agent templates
- [ ] Collaboration features
- [ ] Usage analytics dashboard
- [ ] Agent versioning
- [ ] Share agents with team
- [ ] API key management
- [ ] Billing/usage tracking

## 🤝 Contributing

When adding new components:

1. Use TypeScript for type safety
2. Follow existing component structure
3. Use Tailwind for styling
4. Add proper error handling
5. Include loading states
6. Test on mobile devices

## 📞 Support

**Issues?**
- Check this README
- Review `/OAUTH_SETUP_GUIDE.md`
- Check browser console for errors
- Verify backend is running

**Questions?**
- GitHub Issues
- Internal Slack: #synthient-support

---

**Built with ❤️ using React + TypeScript + Tailwind CSS**
