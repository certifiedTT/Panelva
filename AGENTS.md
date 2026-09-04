# Panelva Engineering Standards

You are working on Panelva, a production comic and creator platform.

## Tech Stack

- Next.js
- React Native (Expo)
- TypeScript
- Tailwind CSS
- React Query

## UI Principles

- Mobile first.
- Use an 8 point spacing system only.
- Use Lucide line icons only.
- Never use emoji icons.
- Use subtle borders instead of heavy shadows.
- Maximum card radius: 16px.
- Keep layouts clean and centered.
- Strictly adhere to the platform colour scheme (Cobalt Blue brand palette); no feature should be created or styled without following the colour scheme.
- No purple gradients or rogue off-brand gradient accents anywhere on the platform; use the official cobalt blue and brand token gradients.


## Navigation Standards

- Every page must use a Shell component.
- Do not create custom navigation bars.
- Mobile uses BottomNav only.
- Desktop uses TopBar + Sidebar.
- Creator Studio uses CreatorShell.
- Admin uses AdminShell with RBAC.
- Search is globally accessible.
- Notifications are opened from Alerts.

## Components

Always reuse components from packages/ui.

Never duplicate buttons, cards or inputs.

## Code Style

- Functional components only.
- TypeScript strict mode.
- No inline colors.
- Strictly adhere to theme colour tokens (no arbitrary purple or off-brand colors).
- No hardcoded spacing values.
- Extract reusable logic into hooks.

## Performance

- Prefer Server Components on web.
- Prefetch feeds when possible.
- Use skeleton loaders instead of spinners.

## Backend Standards

- Backend: Supabase not Firebase
- Database: PostgreSQL
- Authentication: Supabase Auth
- Storage: Supabase Storage
- Realtime: Supabase Realtime
- Use Row Level Security on every table.
- Never query Supabase directly inside UI components.
- All database access goes through query and mutation modules.
- Use React Query for caching.
- Prefetch Home, Creator Hub and Notifications after login.

## Database Rules

- Supabase is the source of truth.
- PostgreSQL first. UI second.
- Never hardcode roles.
- Never hardcode chapter access.
- Use enums for status, roles and tiers.
- Use junction tables for follows and likes.
- Enable Row Level Security on every table.

## Monetization Standards

- Credits use a ledger system.
- Creator earnings are separate from reader wallets.
- Never update balances directly.
- All purchases go through Edge Functions.
- Subscriptions are validated server-side.
- Analytics use aggregated tables, not live calculations.

## Discovery Standards

- Home is personalized.
- Trending is algorithmic, not newest.
- Search prioritizes exact matches.
- Creator Hub ranks creators separately from series.
- Never duplicate the same series across multiple home sections.
- Use cached recommendation queries.

## Studio Standards

- Studios are organizations, not user roles.
- Use role-based permissions through PostgreSQL.
- Every collaborative series supports revenue splitting.
- Never overwrite production files. Create versions.
- Use Kanban workflow for chapter production.
- Revenue splits must total exactly 100%.

## Enterprise Standards

- Every admin action must create an audit log.
- All permissions are enforced with PostgreSQL RLS.
- Financial data uses immutable ledgers.
- Notifications are generated server-side.
- Reports enter a moderation queue.
- Support uses ticket workflow.
- Never expose service role keys to the client.
- Every new feature must include loading, empty and error states.





## Before completing any task

- Check for reusable components first.
- Preserve existing functionality.
- Maintain accessibility.
