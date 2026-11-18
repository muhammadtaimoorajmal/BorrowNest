# BorrowNest — Production & GitHub Pages Deployment Guide

**Application:** BorrowNest — *Share what you own. Borrow what you need.*  
**Live Public Website:** [https://muhammadtaimoorajmal.github.io/BorrowNest/](https://muhammadtaimoorajmal.github.io/BorrowNest/)  
**Deployment Platform:** GitHub Pages (via GitHub Actions)  
**Target Branch:** `main`  

---

## 1. Architecture & Hosting Overview

BorrowNest is a **local-first client-side web application** built with React 19 and Vite 8. Because all application state is persisted locally inside the browser's native IndexedDB database, BorrowNest requires no remote application server or dynamic backend runtime.

It is deployed as a static Single-Page Application (SPA) to GitHub Pages.

---

## 2. GitHub Pages Configuration & Settings

To ensure GitHub Actions deploys the compiled Vite application rather than uncompiled repository files:

1. Navigate to repository settings: **Settings → Pages**
2. Under **Build and deployment**:
   - **Source**: Select `GitHub Actions`
3. Verify via GitHub REST API:
   ```json
   {
     "build_type": "workflow"
   }
   ```

---

## 3. Vite Base Path Configuration

GitHub Pages project sites are served under a repository path prefix: `/BorrowNest/`.

To support both convenient local development (root `/`) and GitHub Pages deployment (`/BorrowNest/`), `vite.config.js` implements an environment-aware base path:

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const isGitHubPages = process.env.GITHUB_PAGES === 'true';

export default defineConfig({
  base: isGitHubPages ? '/BorrowNest/' : '/',
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
});
```

- **Local Development (`npm run dev`)**: Serves from `/` with instant hot-reloading.
- **Local Preview (`npm run preview`)**: Previews standard production build at `/`.
- **GitHub Pages Build (`GITHUB_PAGES=true npm run build`)**: Compiles assets with `/BorrowNest/` prefix, ensuring all `<script>`, `<link>`, and asset URLs resolve correctly on the public site.

---

## 4. Deployment Workflow (`.github/workflows/deploy-pages.yml`)

The automated deployment pipeline is defined in `.github/workflows/deploy-pages.yml`:

### Triggers
- **Push to `main`**: Automatically triggers build and deployment whenever code is merged into `main`.
- **`workflow_dispatch`**: Enables manual deployment trigger from the GitHub Actions UI.
- Pull requests and feature branches do **not** trigger deployments.

### Jobs & Permissions
1. **`build` job**:
   - **Runner**: `ubuntu-latest`
   - **Permissions**: `contents: read`
   - Checks out `main`
   - Sets up Node.js 22.x with npm cache
   - Executes `npm ci`
   - Runs `npm run lint` and `npm run test`
   - Configures Pages with `actions/configure-pages@v5`
   - Builds production bundle with `GITHUB_PAGES: 'true'`
   - Uploads `dist/` directory via `actions/upload-pages-artifact@v3`

2. **`deploy` job**:
   - **Runner**: `ubuntu-latest`
   - **Permissions**: `pages: write`, `id-token: write`
   - **Environment**: `github-pages`
   - Deploys artifact using `actions/deploy-pages@v4`
   - Outputs deployment URL

### Concurrency Control
```yaml
concurrency:
  group: 'pages'
  cancel-in-progress: false
```
Prevents overlapping deployments and guarantees atomic site updates.

---

## 5. Verification & Health Checks

After a deployment completes:

1. **HTTP Status**: Verify `https://muhammadtaimoorajmal.github.io/BorrowNest/` returns HTTP `200 OK`.
2. **Assets**: Verify `dist/assets/index-*.js` and `dist/assets/index-*.css` load without `404` errors.
3. **Client Routing**: Verify hash navigation works smoothly across `#discover`, `#lending`, `#borrowing`, and `#account`.
4. **Data Isolation**: Verify client state operates in clean IndexedDB storage without cross-device or server leakage.

---

## 6. Maintenance & Future Updates

To update or redeploy:
1. Make and test changes locally: `npm run lint`, `npm run test`, `npm run build`.
2. Commit and push directly to `main`.
3. Monitor the GitHub Pages workflow run under the **Actions** tab.
4. Verify the live website at [https://muhammadtaimoorajmal.github.io/BorrowNest/](https://muhammadtaimoorajmal.github.io/BorrowNest/).
