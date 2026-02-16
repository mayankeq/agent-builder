# Frontend Setup Guide

Complete setup instructions for the Agent Builder web application.

## Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Backend API**: Must be running on `http://localhost:3000`

## Quick Start

### 1. Install Dependencies

```bash
cd web
npm install
```

This will install all required dependencies including:
- React ecosystem (React, React DOM, React Router)
- State management (React Query, Zustand)
- Form handling (React Hook Form, Zod)
- UI components (Tailwind CSS, Lucide icons)
- API communication (Axios, WebSocket)

### 2. Verify Backend is Running

Before starting the frontend, ensure the backend API is running:

```bash
# In the project root directory
npm run start:server

# Or check if it's already running
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-06T..."
}
```

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **API Proxy**: http://localhost:5173/api → http://localhost:3000/api

### 4. Initial Setup Flow

1. **Open the app**: Navigate to http://localhost:5173
2. **Login**: Click on one of the SSO providers (Google/Azure/Okta)
3. **Configure API Key**: Go to Settings and add your Anthropic API key
4. **Create Agent**: Use the "Create Agent" button to start your first agent

## Development Workflow

### File Structure Overview

```
web/
├── src/
│   ├── api/              # API layer
│   │   ├── client.ts     # Axios configuration + interceptors
│   │   ├── auth.ts       # Authentication endpoints
│   │   ├── sessions.ts   # Session management
│   │   ├── apiKeys.ts    # API key management
│   │   ├── downloads.ts  # Artifact downloads
│   │   └── examples.ts   # Example templates
│   │
│   ├── components/       # Reusable UI components
│   │   ├── ErrorBoundary.tsx    # Error handling
│   │   ├── Loading.tsx          # Loading states
│   │   ├── StatusBadge.tsx      # Session status display
│   │   ├── ProgressBar.tsx      # Progress visualization
│   │   ├── Modal.tsx            # Modal dialog
│   │   ├── CodePreview.tsx      # Syntax highlighted code
│   │   └── WelcomeTutorial.tsx  # Onboarding tutorial
│   │
│   ├── hooks/            # Custom React hooks
│   │   ├── useAuth.ts         # Authentication state
│   │   ├── useSessions.ts     # Session operations
│   │   ├── useWebSocket.ts    # Real-time updates
│   │   ├── useApiKeys.ts      # API key management
│   │   └── useExamples.ts     # Example templates
│   │
│   ├── pages/            # Route pages
│   │   ├── LoginPage.tsx           # SSO login
│   │   ├── OAuthCallbackPage.tsx   # OAuth redirect handler
│   │   ├── DashboardPage.tsx       # Session list
│   │   ├── CreateAgentPage.tsx     # Agent creation wizard
│   │   ├── SessionDetailPage.tsx   # Session details
│   │   └── SettingsPage.tsx        # User settings
│   │
│   ├── store/            # Global state (Zustand)
│   │   └── uiStore.ts    # UI preferences
│   │
│   ├── types/            # TypeScript definitions
│   │   └── index.ts      # All type definitions
│   │
│   └── utils/            # Utility functions
│       ├── format.ts     # Date/number formatting
│       ├── cn.ts         # Tailwind class helper
│       └── constants.ts  # App constants
│
├── index.html            # HTML entry point
├── vite.config.ts        # Vite configuration
├── tailwind.config.js    # Tailwind configuration
└── tsconfig.json         # TypeScript configuration
```

### Development Commands

```bash
# Start dev server with hot reload
npm run dev

# Type checking (runs before build)
npm run type-check

# Lint code
npm run lint

# Build for production
npm run build

# Preview production build locally
npm run preview
```

### Adding a New Feature

#### 1. Add API Endpoint

```typescript
// src/api/myFeature.ts
import { apiClient } from './client';

export const myFeatureApi = {
  getData: async () => {
    return apiClient.get('/my-feature/data');
  },
};
```

#### 2. Create Hook

```typescript
// src/hooks/useMyFeature.ts
import { useQuery } from '@tanstack/react-query';
import { myFeatureApi } from '@/api';

export const useMyFeature = () => {
  return useQuery({
    queryKey: ['my-feature'],
    queryFn: myFeatureApi.getData,
  });
};
```

#### 3. Use in Component

```typescript
// src/pages/MyFeaturePage.tsx
import { useMyFeature } from '@/hooks';

export const MyFeaturePage = () => {
  const { data, isLoading } = useMyFeature();

  if (isLoading) return <Loading />;

  return <div>{/* Your UI */}</div>;
};
```

## Configuration

### Environment Variables

For development, the app uses Vite's proxy configuration. No environment variables needed.

For production, create `.env.production`:

```bash
VITE_API_URL=https://api.yourapp.com
VITE_WS_URL=wss://api.yourapp.com
```

Update `src/api/client.ts` to use these:

```typescript
const baseURL = import.meta.env.VITE_API_URL || '/api';
```

### Tailwind Customization

Edit `tailwind.config.js` to customize colors, fonts, etc:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Your brand colors
      },
    },
  },
}
```

### TypeScript Configuration

The project uses strict mode. Edit `tsconfig.json` if needed:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

## Testing

### Manual Testing Checklist

- [ ] Login with all configured SSO providers
- [ ] Add/validate/delete API key
- [ ] Create agent with all output types
- [ ] Monitor real-time progress
- [ ] Download artifacts
- [ ] Cancel in-progress session
- [ ] Delete completed session
- [ ] Search and filter sessions
- [ ] Test on mobile devices
- [ ] Test error scenarios (network failure, API errors)

### Browser Testing

Test in:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile Safari (iOS)
- Chrome Mobile (Android)

## Troubleshooting

### Common Issues

#### 1. "Cannot find module" errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 2. Vite proxy not working

Check `vite.config.ts` proxy configuration:
```typescript
server: {
  proxy: {
    '/api': 'http://localhost:3000',
  },
}
```

Ensure backend is running on port 3000.

#### 3. WebSocket connection fails

- Check backend WebSocket server is running
- Verify auth token is valid
- Check browser console for errors
- Try disabling browser extensions

#### 4. Build fails with TypeScript errors

```bash
# Run type check to see all errors
npm run type-check

# Common fixes:
# - Add missing type definitions
# - Fix type mismatches
# - Add @ts-ignore for third-party issues
```

#### 5. Styling not applied

```bash
# Restart Vite dev server
# Press 'r' in terminal to restart

# Check Tailwind is configured:
# - postcss.config.js exists
# - tailwind.config.js exists
# - @tailwind directives in src/index.css
```

#### 6. API calls return 401

- Check you're logged in
- JWT token may be expired - login again
- Check localStorage for 'auth_token'
- Verify backend JWT_SECRET

### Debug Mode

Enable React Query devtools (already configured):
- Look for floating icon in bottom-right
- Click to inspect queries, mutations, cache

Check browser console for:
- API request/response logs
- WebSocket connection status
- Error messages

## Production Deployment

### Build

```bash
npm run build
```

Output directory: `dist/`

### Deployment Options

#### 1. Static Hosting (Vercel, Netlify)

```bash
# Build
npm run build

# Deploy dist/ folder
```

Configure redirects for SPA:
```
/* /index.html 200
```

#### 2. Docker

```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

#### 3. AWS S3 + CloudFront

```bash
# Build
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket/

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id XXX --paths "/*"
```

### Production Checklist

- [ ] Update VITE_API_URL to production backend
- [ ] Enable HTTPS
- [ ] Configure CORS on backend
- [ ] Set up CDN for static assets
- [ ] Enable gzip/brotli compression
- [ ] Add monitoring (Sentry, LogRocket)
- [ ] Test SSO with production OAuth apps
- [ ] Set up proper error tracking
- [ ] Configure security headers
- [ ] Test all user flows

## Performance Optimization

### Bundle Size

Check bundle size:
```bash
npm run build
# Check dist/ folder sizes
```

The build uses:
- Code splitting (vendor chunks)
- Tree shaking (unused code removed)
- Minification (production builds)

### React Query Cache

Configured with sensible defaults:
- 5 minute stale time
- Auto refetch on window focus disabled
- 1 retry on failure

Adjust in `src/main.tsx` if needed.

### Image Optimization

For production, optimize images:
- Use WebP format
- Lazy load images
- Add proper sizes/srcset

## Additional Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [React Router Documentation](https://reactrouter.com)

## Support

For issues:
1. Check this guide
2. Review browser console
3. Check backend logs
4. Open GitHub issue with details

---

**Last Updated**: 2026-02-06
