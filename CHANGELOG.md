# Changelog

All notable changes to OhMyWedding are documented here.

---

## [1.1.0] — 2026-02-20

### ✨ New Features

#### Seating Chart (full feature)
- Interactive drag-and-drop seating canvas powered by react-konva
- Round, rectangular, and sweetheart table types with live seat visualisation
- Venue element layer (dance floor, stage, entrance, bar, DJ booth) with custom colors
- Guest assignment panel with group/individual sections and drag-to-assign
- Auto-assign guests while keeping groups together
- Undo / Redo (Ctrl+Z / Ctrl+Y) with full history stack
- Multi-table selection and alignment tools (left, right, center, top, bottom, distribute)
- Mirror-duplicate tables horizontally or vertically
- Print / export view
- Seating layout auto-save every 5 minutes; manual save with last-saved timestamp
- Discard changes (double-confirm) — reloads from server
- Zoom controls (scroll wheel, +/− buttons, fit-to-screen)
- Lasso selection box for multi-select
- Keyboard shortcuts: Space to pan, Shift to multi-select

#### Seating UI — floating overlay layout
- Stats bar at top with assignment progress, guest/table counts, overflow warnings, and guest panel toggle
- Toolbar at bottom with OMW logo, Add menu, Undo/Redo, Zoom, Auto-assign, Print, Discard, Save
- Left and right panels float over the canvas without pushing its width, and clear both toolbars
- Hover action menu on each table (Duplicate / Delete) without opening the config panel
- Light-colored tooltip on table hover with occupancy progress bar and seat breakdown
- Venue element inline color picker

#### Seating DB (migrations)
- `seating_tables` — table geometry, shape, capacity, seat distribution
- `seating_assignments` — guest ↔ table links
- `venue_elements` — decorative elements with position, size, rotation, color
- `head_a_count` / `head_b_count` columns for per-side seat distribution
- `sweetheart` shape support
- `color` column on venue elements

### 🎨 UI Polish

- Rotation preset buttons now use the app's primary gold (`--primary`) instead of amber-500
- Group headers in guest panel use a unified primary-gold left border (consistent across all groups)
- Save button uses `bg-primary` (warm rose gold) instead of amber
- Table config panel: mirror-duplicate buttons removed; Duplicate + Delete are now a compact two-button row
- Add/actions dropdowns open upward when toolbar is at the bottom
- OMW logo added to bottom toolbar with correct right padding

### 🐛 Fixes

- Tooltip re-render performance: replaced `setTooltipPos` state (fired on every mouse-move) with direct DOM ref mutation — zero React re-renders on hover
- Tooltip hover debounce to prevent flicker when moving between Konva canvas and HTML overlay
- Fixed non-existent `bg-gray-25` Tailwind class in guest panel groups
- Toolbar variable name collision (`t` used for both `useTranslation` and tick state)

### 🗑 Removed

- Top navigation header removed from the seating page (full-screen canvas experience)
- "Visit Wedding Website" button removed from seating page header

---

## [1.0.0] — 2026-02-01

Initial release.

- Wedding website builder with configurable sections
- RSVP, gallery, location, schedule, registry sections
- Stripe payments and Connect for registry contributions
- Guest management with groups, invitations, and OTP verification
- Admin dashboard with activity logs
- Superadmin panel with subscription and funnel analytics
- Multi-language support (English / Spanish)
- Premium and Deluxe plan tiers
