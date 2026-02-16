# Quick Reference Card

Fast reference for common development tasks.

## 🚀 Commands

```bash
# Development
npm run dev              # Start dev server (localhost:5173)
npm run build            # Build for production
npm run preview          # Preview production build
npm run type-check       # Check TypeScript types
npm run lint             # Lint code

# Installation
npm install              # Install dependencies
npm ci                   # Clean install (for CI/CD)
```

## 📁 Key Files

```
src/
├── App.tsx              # Routes & protected routes
├── main.tsx             # Entry point with providers
├── api/client.ts        # Axios config + interceptors
├── hooks/useAuth.ts     # Authentication hook
└── types/index.ts       # All TypeScript types
```

## 🔑 Common Patterns

### Add New API Endpoint
```typescript
// 1. Add to src/api/myApi.ts
export const myApi = {
  getData: async () => apiClient.get('/my-endpoint'),
};

// 2. Create hook in src/hooks/useMyData.ts
export const useMyData = () => {
  return useQuery({
    queryKey: ['my-data'],
    queryFn: myApi.getData,
  });
};

// 3. Use in component
const { data, isLoading } = useMyData();
```

### Add New Page
```typescript
// 1. Create src/pages/MyPage.tsx
export const MyPage = () => {
  return <div>My Page</div>;
};

// 2. Add route in src/App.tsx
<Route
  path="/my-page"
  element={
    <ProtectedRoute>
      <MyPage />
    </ProtectedRoute>
  }
/>
```

### Add New Component
```typescript
// src/components/MyComponent.tsx
interface Props {
  title: string;
}

export const MyComponent: React.FC<Props> = ({ title }) => {
  return <div className="card">{title}</div>;
};
```

## 🎨 Tailwind Classes

### Buttons
```jsx
<button className="btn-primary">Primary</button>
<button className="btn-secondary">Secondary</button>
<button className="btn-ghost">Ghost</button>
<button className="btn-sm">Small</button>
<button className="btn-lg">Large</button>
```

### Cards
```jsx
<div className="card">Card content</div>
```

### Forms
```jsx
<label className="label">Field Label</label>
<input className="input" />
<textarea className="input" />
<select className="input" />
```

### Badges
```jsx
<span className="badge-success">Success</span>
<span className="badge-error">Error</span>
<span className="badge-warning">Warning</span>
<span className="badge-info">Info</span>
```

### Skeletons
```jsx
<div className="skeleton h-4 w-full" />
```

## 🪝 Custom Hooks

### useAuth
```typescript
const { user, isAuthenticated, logout } = useAuth();
```

### useSessions
```typescript
const {
  data,                  // Session list response
  isLoading,
  createSession,
  cancelSession,
  deleteSession,
} = useSessions({ page: 1, pageSize: 10 });
```

### useSession
```typescript
const { data: session, isLoading } = useSession(sessionId);
```

### useWebSocket
```typescript
const { isConnected, send } = useWebSocket({
  sessionId: id,
  onMessage: (msg) => console.log(msg),
});
```

### useApiKeys
```typescript
const {
  status,
  addApiKey,
  validateApiKey,
  deleteApiKey,
} = useApiKeys();
```

## 🌐 API Client

### GET Request
```typescript
const data = await apiClient.get('/endpoint');
```

### POST Request
```typescript
const data = await apiClient.post('/endpoint', { key: 'value' });
```

### With Params
```typescript
const data = await apiClient.get('/endpoint', {
  params: { page: 1 },
});
```

### Download File
```typescript
const response = await apiClient.getClient().get('/download', {
  responseType: 'blob',
});
```

## 🔐 Protected Routes

### Require Authentication
```typescript
<ProtectedRoute>
  <MyPage />
</ProtectedRoute>
```

### Public Only (redirect if authenticated)
```typescript
<PublicRoute>
  <LoginPage />
</PublicRoute>
```

## 📊 React Query

### Query
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['key'],
  queryFn: fetchData,
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

### Mutation
```typescript
const mutation = useMutation({
  mutationFn: createData,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['key'] });
  },
});

mutation.mutate(data);
```

### Invalidate Cache
```typescript
queryClient.invalidateQueries({ queryKey: ['sessions'] });
```

## 🎯 Toast Notifications

```typescript
import { toast } from 'react-toastify';

toast.success('Success message');
toast.error('Error message');
toast.warning('Warning message');
toast.info('Info message');
```

## 🧭 Navigation

```typescript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

// Navigate to route
navigate('/dashboard');

// Navigate with replace (no history)
navigate('/login', { replace: true });

// Navigate back
navigate(-1);
```

## 🔗 Links

```typescript
import { Link } from 'react-router-dom';

<Link to="/dashboard">Dashboard</Link>
```

## 📦 State Management

### Zustand Store
```typescript
// Create store
import { create } from 'zustand';

const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

// Use in component
const { count, increment } = useStore();
```

### With Persistence
```typescript
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set) => ({ /* state */ }),
    { name: 'storage-key' }
  )
);
```

## 🎨 Styling Utilities

### Conditional Classes (clsx)
```typescript
import { cn } from '@/utils';

<div className={cn(
  'base-class',
  isActive && 'active-class',
  { 'conditional': condition }
)} />
```

## 📅 Date Formatting

```typescript
import { formatDate, formatDateTime, formatRelativeTime } from '@/utils';

formatDate(date);          // "Jan 1, 2024"
formatDateTime(date);      // "Jan 1, 2024 3:45 PM"
formatRelativeTime(date);  // "2 hours ago"
```

## 🐛 Debugging

### React Query Devtools
Already configured - look for floating icon in bottom-right.

### Console Logs
```typescript
console.log('API Response:', data);
console.error('Error:', error);
```

### Check Auth Token
```javascript
localStorage.getItem('auth_token')
```

### Check React Query Cache
Open React Query Devtools, inspect queries.

## 🚨 Error Handling

### Try-Catch
```typescript
try {
  await apiCall();
} catch (error) {
  toast.error(error.message);
}
```

### Error Boundary
Already configured at app root - catches React errors.

## 🔍 TypeScript Tips

### Define Component Props
```typescript
interface Props {
  title: string;
  count?: number;
  onClick: () => void;
}

const Component: React.FC<Props> = ({ title, count = 0, onClick }) => {
  // ...
};
```

### Type API Response
```typescript
interface ApiResponse {
  data: string[];
  total: number;
}

const data = await apiClient.get<ApiResponse>('/endpoint');
```

## 📱 Responsive Design

### Tailwind Breakpoints
```jsx
<div className="
  text-sm       // mobile (default)
  md:text-base  // tablet (768px+)
  lg:text-lg    // desktop (1024px+)
">
  Responsive text
</div>
```

### Grid Layout
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid */}
</div>
```

## 🔧 Environment Variables

### Access in Code
```typescript
const apiUrl = import.meta.env.VITE_API_URL;
```

### Define in .env
```bash
VITE_API_URL=https://api.example.com
```

## 📊 Performance Tips

1. Use React Query for caching
2. Lazy load routes (React.lazy)
3. Debounce search inputs
4. Use skeleton loaders
5. Optimize images (WebP)
6. Code split large bundles

## 🎯 Common Issues & Solutions

### Build fails
```bash
rm -rf node_modules package-lock.json
npm install
```

### Types error
```bash
npm run type-check
```

### Proxy not working
Check `vite.config.ts` and backend is running.

### WebSocket fails
Check auth token and backend WebSocket server.

---

**Quick Reference v1.0** - Updated 2026-02-06
