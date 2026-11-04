# MDATE dashboard feature-separation overlay (layout-preserving)

This overlay separates the existing dashboard into feature-scoped components while preserving the original screen composition and styling.

## Merge

Extract this ZIP at the **repository root** (`MDATE-P-2/`) and allow the dashboard route file to be replaced.

## Preserved dashboard composition

1. Existing 75×75 circular profile image and user-information row.
2. Existing 180px carousel/data widget placeholder.
3. Existing two side-by-side metric boxes: coin placeholder and `TBD / Metric` placeholder.
4. Existing outer card, spacing, borders, colors, and shadow.
5. Existing four-column, two-row grid of eight square action buttons.

The carousel and coin/metric areas are intentionally placeholders. No carousel data loading, coin balance, or metric calculation is implemented. The coin value is shown as an em dash instead of the former hard-coded sample value (`129`) so it is not mistaken for a real balance.

## New feature structure

```text
src/expo-test/
├── app/(app)/(main)/dashboard.tsx
└── src/features/dashboard/
    ├── DashboardScreen.tsx
    ├── components/
    │   ├── DashboardActionGrid.tsx
    │   ├── DashboardCarouselPlaceholder.tsx
    │   ├── DashboardHeader.tsx
    │   └── DashboardMetricsRow.tsx
    └── data/
        └── dashboardActions.ts
```

The dashboard route is now a thin Expo Router entry point. Screen composition, UI components, and action/route definitions are separated under `src/features/dashboard`.

## Navigation

The current `app/(app)/(main)/_layout.tsx` declares four routes: `dashboard`, `modules`, `progress`, and `setting`. The eight buttons route to those declared destinations (some shortcuts share a destination):

- Dashboard → `/dashboard`
- Start Training and Modules → `/modules`
- Progress and History → `/progress`
- Settings, Accessibility, and Voice → `/setting`

No changes are made to `(main)/_layout.tsx`.

## User data

The display name and secondary label are sourced from the existing `useAuth()` context. The profile image remains a placeholder URL, matching the original dashboard's image placeholder.

## Verify locally

From `src/expo-test`:

```powershell
npx tsc --noEmit
npx expo start --web --port 8081 --clear
```

The overlay has not been typechecked against your local working tree. Run the commands above after merging it.
