# Agent Builder Web Application

Modern React frontend for the Agent Builder platform - create intelligent LLM-based agents through an intuitive web interface.

## Features

### Authentication
- Multi-provider SSO (Google, Azure AD, Okta)
- JWT-based session management
- Secure token storage
- Protected routes

### Agent Creation
- Multi-step wizard interface
- 5+ example templates
- Support for 4 output types (Skill, MCP Server, CLI, Library)
- 2 languages (TypeScript, Python)
- Advanced options (priority, test coverage)
- Real-time progress tracking

### Session Management
- List all sessions with filtering and search
- Real-time status updates via WebSocket
- Session details with phase timeline
- Cancel in-progress sessions
- Delete completed sessions
- Session statistics dashboard

### API Key Management
- Securely add and store Anthropic API keys
- Validate API keys
- Update or delete keys
- AES-256-GCM encryption

### Artifact Management
- Download agents as ZIP files
- View artifacts metadata
- File preview with syntax highlighting
- Individual file downloads

### User Experience
- Welcome tutorial for first-time users
- Responsive design (mobile-friendly)
- Toast notifications
- Loading states and skeletons
- Error boundaries
- Dark mode ready (UI prepared)

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Routing
- **React Query** - Data fetching and caching
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **WebSocket** - Real-time updates
- **Zustand** - State management
- **React Toastify** - Notifications
- **Lucide React** - Icons
- **React Syntax Highlighter** - Code preview
- **date-fns** - Date formatting

## Project Structure

```
web/
├── src/
│   ├── api/              # API client and endpoints
│   │   ├── client.ts     # Axios instance with interceptors
│   │   ├── auth.ts       # Authentication API
│   │   ├── sessions.ts   # Sessions API
│   │   ├── apiKeys.ts    # API keys API
│   │   ├── downloads.ts  # Downloads API
│   │   └── examples.ts   # Examples API
│   ├── components/       # Reusable components
│   │   ├── ErrorBoundary.tsx
│   │   ├── Loading.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── Modal.tsx
│   │   ├── CodePreview.tsx
│   │   └── WelcomeTutorial.tsx
│   ├── hooks/            # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useSessions.ts
│   │   ├── useWebSocket.ts
│   │   ├── useApiKeys.ts
│   │   └── useExamples.ts
│   ├── pages/            # Page components
│   │   ├── LoginPage.tsx
│   │   ├── OAuthCallbackPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── CreateAgentPage.tsx
│   │   ├── SessionDetailPage.tsx
│   │   └── SettingsPage.tsx
│   ├── store/            # Zustand stores
│   │   └── uiStore.ts
│   ├── types/            # TypeScript types
│   │   └── index.ts
│   ├── utils/            # Utility functions
│   │   ├── format.ts     # Date/number formatting
│   │   ├── cn.ts         # Class name utility
│   │   └── constants.ts  # App constants
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running on `http://localhost:3000`

### Installation

```bash
# Navigate to web directory
cd web

# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev

# The app will be available at http://localhost:5173
```

The Vite dev server will proxy API requests to the backend:
- `/api/*` → `http://localhost:3000/api/*`
- WebSocket connections to `ws://localhost:3000`

### Build for Production

```bash
# Type check
npm run type-check

# Build
npm run build

# Preview production build
npm run preview
```

The built files will be in the `dist/` directory.

## Environment Configuration

The frontend connects to the backend API. In production, update the proxy configuration in `vite.config.ts` to point to your production backend URL.

For production deployment:

```typescript
// vite.config.ts - Remove proxy, use env variable
export default defineConfig({
  // ...
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'https://api.yourapp.com'),
  },
});
```

Then update `src/api/client.ts`:

```typescript
const baseURL = import.meta.env.VITE_API_URL || '/api';
```

## Key Features Explained

### Real-Time Updates

The app uses WebSocket connections to receive real-time updates about agent creation progress:

```typescript
// Automatically connects and updates React Query cache
useWebSocket({
  sessionId: id,
  onMessage: (message) => {
    // Custom message handling
  },
});
```

### API Client with Auto-Retry

The API client automatically:
- Adds JWT tokens to requests
- Handles 401 errors (redirects to login)
- Provides structured error messages
- Supports request/response interceptors

### Form Validation

Forms use React Hook Form with Zod schemas for type-safe validation:

```typescript
const schema = z.object({
  description: z.string().min(10),
  outputType: z.enum(['skill', 'mcp', 'cli', 'library']),
});
```

### Protected Routes

Routes are automatically protected based on authentication state:

```typescript
<ProtectedRoute>
  <DashboardPage />
</ProtectedRoute>
```

## Development Tips

### Adding a New Page

1. Create component in `src/pages/`
2. Add route in `src/App.tsx`
3. Wrap with `ProtectedRoute` if needed

### Adding a New API Endpoint

1. Add function to appropriate file in `src/api/`
2. Create/update custom hook in `src/hooks/`
3. Use in components with React Query

### Styling

The app uses Tailwind CSS with custom utilities defined in `src/index.css`:

- `btn-primary`, `btn-secondary`, `btn-ghost` - Button styles
- `card` - Card container
- `input`, `label` - Form elements
- `badge-*` - Status badges
- `skeleton` - Loading skeletons

## Testing

```bash
# Lint
npm run lint

# Type check
npm run type-check
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Code splitting for faster initial loads
- React Query caching reduces API calls
- Lazy loading for routes (can be added)
- Optimistic updates for better UX

## Security

- JWT tokens stored in localStorage
- Automatic token refresh
- CSRF protection via JWT
- XSS protection via React
- Secure API communication (HTTPS in production)

## Troubleshooting

### WebSocket Connection Fails

- Ensure backend is running
- Check that WebSocket port is not blocked by firewall
- Verify JWT token is valid

### API Calls Fail with 401

- Check that you're logged in
- Token may have expired - try logging in again
- Ensure backend JWT_SECRET matches

### Build Fails

- Run `npm install` to ensure all dependencies are installed
- Check for TypeScript errors with `npm run type-check`
- Clear node_modules and reinstall if needed

## Contributing

1. Follow the existing code style
2. Use TypeScript strict mode
3. Add proper error handling
4. Test on multiple browsers
5. Update this README if adding major features

## License

MIT

## Support

For issues and questions:
- GitHub Issues: [github.com/your-org/agent-builder/issues](https://github.com/your-org/agent-builder/issues)
- Email: support@example.com

---

Built with React + TypeScript + Vite + Tailwind CSS
