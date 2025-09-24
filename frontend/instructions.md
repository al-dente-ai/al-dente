# Build Instructions

## 0) Tech & app standards (apply globally)

* **Language/Framework**: React 18 + TypeScript, Vite.
* **UI**: Tailwind CSS (JIT), mobile-first, prefers accessible components (WCAG AA).
* **State**: Zustand with slice pattern (`create` + `immer`).
* **Data**: REST via `fetch` or `axios` (use axios with interceptors).
* **Routing**: `react-router-dom` v6+.
* **Auth token**: Access **JWT in `localStorage`** (as requested). Prefix key with app namespace (e.g., `app:accessToken`). If the backend issues refresh tokens, store per backend guidance (ideally httpOnly cookie; if not, store in memory).
* **Env**: Put API base in `import.meta.env.VITE_API_URL`.
* **Error handling**: Centralized toast system; standard error shape `{ message: string, code?: string, details?: any }`.
* **Testing**: Minimal smoke tests (Vitest + React Testing Library) for routing/auth guard.

---

## 1) Project scaffolding

```bash
npm create vite@latest app -- --template react-ts
cd app
npm i react-router-dom axios zustand immer zod
npm i -D tailwindcss postcss autoprefixer @types/node vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom
npx tailwindcss init -p
```

**`tailwind.config.js`**

* Enable JIT, set content to `./index.html, ./src/**/*.{ts,tsx}`.
* Extend with `fontFamily: { display: ['Inter', 'ui-sans-serif', ...] }`.

**`src/` directory structure**

```
src/
  main.tsx
  App.tsx
  routes/
    index.tsx               # Router + route objects
    Protected.tsx           # Auth guard
  pages/
    Landing.tsx
    Auth/
      Login.tsx
      Signup.tsx
    Dashboard/
      index.tsx
      Scan.tsx
      Inventory.tsx
      Recipes.tsx
  components/
    layout/
      Shell.tsx             # top nav + sidebar for dashboard
    ui/
      Button.tsx
      Input.tsx
      Select.tsx
      Modal.tsx
      Table.tsx
      Card.tsx
      Spinner.tsx
      Toasts.tsx
    scan/
      CameraScanner.tsx     # webcam + barcode/qr support
      ManualEntry.tsx
  store/
    index.ts                # combine slices
    auth.ts
    inventory.ts
    scan.ts
    recipes.ts
    ui.ts
  lib/
    api.ts                  # axios instance + interceptors
    types.ts                # shared TypeScript types
    validators.ts           # zod schemas
    utils.ts
  styles/
    index.css               # tailwind base/components/utilities imports
```

---

## 2) Routing & auth flow

* **Routes**

  * `/` → `Landing`
  * `/login`, `/signup`
  * `/app` (Protected, shows `Dashboard/Shell`)

    * `/app/scan`
    * `/app/inventory`
    * `/app/recipes`

* **Protected route** (`routes/Protected.tsx`):

  * Reads `authStore.isAuthed` (derived from presence + validity of token).
  * If not authed, `navigate('/login?next=' + currentPath)`.

* **Auth persistence**

  * On app boot, `authStore.hydrate()` checks `localStorage.getItem('app:accessToken')`.
  * If present, set token in store and axios header.

---

## 3) API client & interceptors

**`lib/api.ts`**

* Create axios instance with `baseURL: VITE_API_URL`.
* Request interceptor: attach `Authorization: Bearer <token>` if present.
* Response interceptor:

  * If 401, call `authStore.logout()` and redirect to `/login`.
  * Normalize errors to `{ message, code?, details? }`.

---

## 4) Zustand stores (slices)

Use `immer` for ergonomic mutations.

**`store/auth.ts`**

* State: `{ token?: string, user?: { id: string; email: string; name?: string }, isLoading: boolean }`
* Actions:

  * `hydrate()` – read token from `localStorage` and set axios header.
  * `login(email, password)` – POST `/auth/login` → `{ token, user }`, persist token.
  * `signup(payload)` – POST `/auth/signup` → same shape; auto-login.
  * `logout()` – clear token from memory + `localStorage`, remove axios header.

**`store/inventory.ts`**

* Types: `InventoryItem = { id: string; name: string; barcode?: string; qty: number; unit?: string; category?: string; expiresAt?: string }`
* State: `{ items: InventoryItem[], isLoading: boolean, lastLoadedAt?: string }`
* Actions:

  * `fetchAll()` – GET `/inventory`
  * `create(item)` – POST `/inventory`; optimistic add
  * `update(id, patch)` – PATCH `/inventory/:id`; optimistic update with rollback on error
  * `remove(id)` – DELETE `/inventory/:id`; optimistic remove with rollback

**`store/scan.ts`**

* State: `{ latestCode?: string; isScanning: boolean; isSubmitting: boolean }`
* Actions:

  * `start() / stop()`
  * `setCode(code)`
  * `submitScan({ code })` – POST `/scan/lookup` → returns product meta; open modal to confirm add.

**`store/recipes.ts`**

* Types: `Recipe = { id: string; title: string; ingredients: { name: string; qty?: string }[]; steps: string[]; uses: string[] }`
* State: `{ list: Recipe[], isGenerating: boolean }`
* Actions:

  * `generate({ constraints })` – POST `/recipes/generate` (from current inventory) → stream or poll until ready
  * `save(recipe)` – POST `/recipes`
  * `delete(id)` – DELETE `/recipes/:id`

**`store/ui.ts`**

* Toasts, modals, confirm dialogs.

---

## 5) Pages & core components

### Landing Page (`pages/Landing.tsx`)

* Hero with product value prop, short explainer section, CTA buttons (`Login`, `Sign up`).
* Include a “How it works” 3-step: Scan → Inventory → Recipes.

### Auth Pages

* `Login.tsx` form: email, password. On submit → `auth.login()`. On success, redirect to `next` or `/app/scan`.
* `Signup.tsx`: name, email, password, confirm password, (optional) marketing opt-in → `auth.signup()`.

### Dashboard shell (`components/layout/Shell.tsx`)

* Left sidebar: nav items (`Scan`, `Inventory`, `Recipes`).
* Top bar: app logo, user menu (Profile placeholder, Logout).
* Content area renders child routes.

### Scan Feature

* `/app/scan`
* **CameraScanner.tsx**:

  * Uses `getUserMedia` (fallback to manual entry on failure).
  * Integrate an open-source reader (e.g., `@zxing/browser`) to decode common barcodes/QR.
  * On decode → show product preview modal with name detected (from `/scan/lookup?code=...`) and an “Add to inventory” form (qty/unit/category).
* **ManualEntry.tsx** for keyboard input if camera not available.

### Inventory Feature

* `/app/inventory`
* Toolbar: search box, category filter, sort dropdown, “Add item” button (opens modal).
* `Table.tsx`: paginated table with columns: Name, Qty, Unit, Category, Expires, Actions (Edit/Delete).
* Inline edit or modal edit:

  * Calls `inventory.update()` optimistically.
  * Delete with confirm → `inventory.remove()`.

### Recipes Feature

* `/app/recipes`
* Generator panel:

  * Constraints: cuisine, dietary flags (vegan/veg/gluten-free), max time, servings.
  * “Generate recipes” → `recipes.generate({ constraints })`.
  * Show **loading state** (spinner), then cards for returned recipes.
* Recipe card:

  * Title, badges (diet/time), “View”, “Save”, “Delete”.
  * “View” shows ingredients (mark those that are satisfied by current inventory) and steps.

---

## 6) Forms, validation, and UX polish

* Use **zod** schemas per form (`validators.ts`), e.g. `LoginSchema`, `SignupSchema`, `ItemSchema`.
* Display inline validation errors and top-level error toasts on server failures.
* Disable submit buttons while pending; show `Spinner`.
* Keyboard & screen-reader friendly: labeled inputs, `aria-live` on toasts, focus management for modals.

---

## 7) Styling guidelines

* Minimalist, modern aesthetic: lots of whitespace, rounded-2xl cards, soft shadows, large headings.
* Tailwind utility classes; extract reusable classnames (e.g., `btn`, `card`) via component wrappers.

---

## 8) Security notes (given localStorage requirement)

* Storing JWT in `localStorage` exposes it to XSS. Mitigations:

  * Strict Content Security Policy (no `unsafe-inline`).
  * Sanitize/escape any dynamic HTML (avoid `dangerouslySetInnerHTML`).
  * Keep dependencies updated; limit third-party scripts.
  * Consider `SameSite` + httpOnly cookies for refresh token if backend supports it.

---

## 9) API contracts (assume backend is ready; adjust paths/names if they differ)

* `POST /auth/signup` → `{ token, user }`
* `POST /auth/login` → `{ token, user }`
* `GET /auth/me` → `{ user }` (optional on boot to confirm session)
* `GET /inventory` → `{ items: InventoryItem[] }`
* `POST /inventory` → `{ item: InventoryItem }`
* `PATCH /inventory/:id` → `{ item: InventoryItem }`
* `DELETE /inventory/:id` → `204`
* `POST /scan/lookup` body `{ code: string }` → `{ name, category?, unit? }`
* `POST /recipes/generate` body `{ constraints }` → `{ recipes: Recipe[] }` (or a job id to poll)
* `GET /recipes` → `{ recipes: Recipe[] }`
* `POST /recipes` → `{ recipe }`
* `DELETE /recipes/:id` → `204`

If recipe generation is async:

* `POST /recipes/jobs` → `{ jobId }`
* `GET /recipes/jobs/:id` → `{ status, recipes? }`

---

## 10) Implementation order (step-by-step)

1. **Scaffold & config**: Vite + Tailwind + Router + base layout.
2. **Auth**: `authStore`, `/login`, `/signup`, token persistence, interceptors, `Protected` route.
3. **Dashboard Shell** with nav + route plumbing.
4. **Inventory** list (read-only), then add/edit/delete with optimistic updates.
5. **Scan** page: wire `@zxing/browser` + manual entry + lookup + add flow.
6. **Recipes** list + generator (simple request/response). If async, add polling.
7. **UX polish**: toasts, empty states, loading skeletons, error boundaries.
8. **Smoke tests**: protected routing, inventory CRUD optimistic paths.

---

## 11) Sample snippets

**Zustand slice (auth)**

```ts
// store/auth.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from '../lib/api';

type User = { id: string; email: string; name?: string };
type State = {
  token?: string;
  user?: User;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
  hydrate: () => void;
};

export const useAuth = create<State>()(
  persist(
    (set, get) => ({
      token: undefined,
      user: undefined,
      isLoading: false,
      async login(email, password) {
        set({ isLoading: true });
        try {
          const { data } = await axios.post('/auth/login', { email, password });
          axios.defaults.headers.common.Authorization = `Bearer ${data.token}`;
          set({ token: data.token, user: data.user, isLoading: false });
        } catch (e: any) {
          set({ isLoading: false });
          throw e;
        }
      },
      async signup(payload) {
        set({ isLoading: true });
        try {
          const { data } = await axios.post('/auth/signup', payload);
          axios.defaults.headers.common.Authorization = `Bearer ${data.token}`;
          set({ token: data.token, user: data.user, isLoading: false });
        } catch (e: any) {
          set({ isLoading: false });
          throw e;
        }
      },
      logout() {
        delete axios.defaults.headers.common.Authorization;
        set({ token: undefined, user: undefined });
      },
      hydrate() {
        const { token } = get();
        if (token) axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      },
    }),
    { name: 'app:auth' } // stored in localStorage
  )
);
```

**Protected route**

```tsx
// routes/Protected.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../store/auth';

export default function Protected() {
  const { token } = useAuth();
  const { pathname } = useLocation();
  if (!token) return <Navigate to={`/login?next=${encodeURIComponent(pathname)}`} replace />;
  return <Outlet />;
}
```

**Axios instance**

```ts
// lib/api.ts
import Axios from 'axios';
import { useAuth } from '../store/auth';

const axios = Axios.create({ baseURL: import.meta.env.VITE_API_URL });

axios.interceptors.response.use(
  r => r,
  err => {
    if (err?.response?.status === 401) {
      useAuth.getState().logout();
      location.assign('/login');
    }
    return Promise.reject({
      message: err?.response?.data?.message ?? err.message,
      code: err?.response?.data?.code,
      details: err?.response?.data,
    });
  }
);

export default axios;
```

---

## 12) Acceptance criteria (definition of done)

* **Auth**: User can sign up, log in, refresh the page, and remain logged in; 401 auto-redirects to login.
* **Scan**: Camera works on Chrome/Firefox desktop & mobile; manual input fallback; successful scan can add an item to inventory.
* **Inventory**: Items list loads; create/edit/delete work with instant UI updates; errors rollback and show toast.
* **Recipes**: User can generate recipes from inventory; loading and error states visible; saved recipes persist across reloads.
* **A11y**: Forms labeled; keyboard navigation works; modals focus trap; images have alt text.
* **Styling**: Consistent Tailwind design tokens; responsive layout; clean empty/zero-state views.

---