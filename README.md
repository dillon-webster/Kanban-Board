# Kanban Board

A job-tracking kanban board for small shops. Admins manage workflows and assign jobs; employees see their assigned jobs and advance them through stages via swipe or button.

## Features

- Role-based views: admins see the full kanban board, employees see only their assigned jobs
- Configurable workflows (job types with ordered stages)
- Per-stage checklists that block stage advancement until completed
- Swipe-to-advance on mobile, button on desktop
- Real-time updates via Supabase realtime subscriptions
- Invite-only employee registration

## Tech Stack

- React 19 + TypeScript
- Vite
- Supabase (Postgres + Auth + Realtime)
- Deployed on Railway via Docker

## Local Development

1. Install dependencies:
   ```sh
   npm install
   ```

2. Create a `.env` file with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://<project>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon-key>
   ```

3. Start the dev server:
   ```sh
   npm run dev
   ```

   To test on a phone on the same network:
   ```sh
   npm run dev -- --host
   # then open http://<your-local-ip>:5173 on mobile
   ```

## Database Schema

### Tables

| Table | Description |
|---|---|
| `profiles` | One row per user; `role` is `admin` or `employee` |
| `invites` | Email allowlist; employees must be invited before signing up |
| `job_types` | Named workflows (e.g. "Cabinet", "Furniture") |
| `stages` | Ordered steps within a job type; `position` is 0-indexed; `notify_admin` flags stages that should alert the admin on completion |
| `stage_checklist_items` | Required items for a stage; must all be completed before an employee can advance |
| `jobs` | Individual jobs; linked to a job type and current stage |
| `job_assignments` | Many-to-many: employees assigned to a job |
| `job_checklist_completions` | Records which checklist items have been completed on which job, and by whom |

### Roles

Supabase RLS restricts access by role:
- **admin** — full CRUD on all tables
- **employee** — read-only on their assigned jobs; can write to `job_checklist_completions` and advance their own job stages

## Deployment

The app deploys to Railway using the included `Dockerfile`. Set the following environment variables in Railway:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Build and preview locally:
```sh
npm run build
npm run preview
```
