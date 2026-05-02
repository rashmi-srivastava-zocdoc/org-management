# Org Management Prototype

Interactive prototype for the Org Management tool, built with React + TypeScript + Vite.

## Features

- **Tree View**: Expand/collapse org hierarchy (Northwell Health sample data)
- **Search**: Filter organizations by name, ID, or city
- **Detail Panel**: View org metadata, children, members, and audit history
- **Create/Edit**: Modal forms for creating and editing organizations

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deploy to GitHub Pages

### Option 1: Manual Deploy

```bash
# Build and deploy
npm run build
npm run deploy
```

### Option 2: GitHub Actions (Automated)

Push to `main` branch - GitHub Actions will automatically build and deploy.

## Configuration

Update `vite.config.ts` to change the base path if deploying to a different repo name:

```ts
export default defineConfig({
  base: '/your-repo-name/',
  // ...
})
```

## Tech Stack

- React 18
- TypeScript
- Vite 5
- CSS (no framework - lightweight)

## Project Structure

```
prototype/
├── src/
│   ├── components/
│   │   ├── OrgTree.tsx      # Tree view with expand/collapse
│   │   ├── DetailPanel.tsx  # Side panel with org details
│   │   ├── CreateOrgModal.tsx
│   │   └── EditOrgModal.tsx
│   ├── data/
│   │   └── mockData.ts      # Northwell Health sample data
│   ├── types.ts             # TypeScript interfaces
│   ├── App.tsx              # Main app layout
│   ├── App.css              # All styles
│   └── main.tsx             # Entry point
├── index.html
├── package.json
└── vite.config.ts
```
