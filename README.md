# COSMOS

A browser-based deep-space exploration experience built with React, TypeScript,
Vite, Three.js, React Three Fiber, Drei, Tailwind CSS, Zustand and Lucide.

## Scripts

- `npm run dev` — start the development server
- `npm run build` — type-check and build for production
- `npm run preview` — preview the production build locally
- `npm run lint` — run Oxlint

## Architecture

```text
src/
  components/
    ui/       reusable interface primitives
    layout/   app-level layout shells
  scenes/     3D scenes (Three.js / React Three Fiber)
  systems/    game / world systems
  store/      Zustand state stores
  hooks/      reusable React hooks
  types/      shared TypeScript types
  utils/      pure helpers
  assets/     static assets
  styles/     global stylesheets
```

This repository is at the initialization stage: a clean starter shell is in place
and the production build is green. Universe, planets, spacecraft, HUD and
gameplay are implemented in later tasks.
