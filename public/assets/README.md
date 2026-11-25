# CivicTrack Static Assets

Place static media files in these subfolders so Next.js serves them automatically from `/assets/...`:

- `public/assets/images/` — Photos, hero banners, backgrounds (e.g., `/assets/images/hero.png`)
- `public/assets/icons/` — Custom SVG/PNG icons (e.g., `/assets/icons/badge.svg`)
- `public/assets/logos/` — Municipal seals, brand logos (e.g., `/assets/logos/logo.svg`)
- `public/assets/illustrations/` — Empty-state or onboarding illustrations

## Usage in Components

```tsx
<img src="/assets/logos/logo.svg" alt="CivicTrack Logo" />
```
