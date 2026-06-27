# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Phase 1: Foundation

## Current Goal

- Canvas foundation (React Flow setup, node/edge types).

## Completed

- Context files added (project overview, architecture, UI context, code standards, AI workflow rules).
- **01-design_system**: shadcn/ui configured with dark theme tokens in `globals.css`; Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea added to `components/ui/`; lucide-react installed; `lib/utils.ts` with `cn()` created. Build verified clean.
- **02-editor-chrome**: `EditorNavbar` and `ProjectSidebar` created in `components/editor/`. Navbar has fixed-height top bar with PanelLeftOpen/PanelLeftClose toggle. Sidebar floats as overlay (no content push), slides in from left, has My Projects/Shared tabs with empty states and full-width New Project button. Dialog pattern already in place via `components/ui/dialog.tsx` with correct color tokens.
- **03-auth**: Clerk wired into the app. `ClerkProvider` with `dark` theme wraps root layout; appearance variables reference CSS custom properties from `globals.css`. `proxy.ts` at project root protects all routes except sign-in/sign-up (env-var-driven). Sign-in and sign-up pages at `/sign-in` and `/sign-up` use a minimal two-panel layout (logo + tagline + feature list on the left, Clerk form on the right; form-only on small screens). Root `/` redirects authenticated users to `/editor` and unauthenticated to `/sign-in`. `UserButton` added to the navbar right section. `@clerk/ui` installed.
- **04-project-dialogs**: Editor home screen with heading, description, and New Project button. Create/Rename/Delete project dialogs. `useProjectDialogs` hook manages dialog, form, and loading state. Sidebar shows mock project items with rename/delete actions for owned projects only; shared projects show read-only. Mobile backdrop scrim added. Mock data in `lib/mock-projects.ts` with `nameToSlug` utility. Build and TypeScript verified clean.
- **05-prisma**: `prisma/models/project.prisma` added with `Project` and `ProjectCollaborator` models, `ProjectStatus` enum (DRAFT/ARCHIVED), cascade delete, indexes on ownerId/createdAt/email. `lib/prisma.ts` exports a cached singleton branching on `DATABASE_URL`: `prisma+postgres://` uses Accelerate (`@prisma/extension-accelerate`), otherwise uses `PrismaPg` adapter. Migration `20260627031319_init` applied. Build verified clean.
- **06-project-apis**: REST API routes for projects. `GET /api/projects` lists owner's projects. `POST /api/projects` creates with optional name (defaults to "Untitled Project"). `PATCH /api/projects/[projectId]` renames (owner only). `DELETE /api/projects/[projectId]` deletes (owner only). All routes enforce auth via Clerk `auth()`: unauthenticated returns 401, non-owner mutations return 403. `lib/prisma.ts` type updated to cast the union client to `PrismaClient` for consistent TypeScript signatures. Build verified clean.
- **07-wire-editor-home**: Editor home wired to real project API. `lib/projects.ts` added with `getOwnedProjects(userId)` and `getSharedProjects(email)` server helpers. `app/editor/page.tsx` converted to server component — fetches owned and shared projects via `currentUser()` and passes to `EditorHome`. `components/editor/editor-home.tsx` extracted as the client component holding sidebar + dialog state. `hooks/use-project-actions.ts` created: create calls `POST /api/projects` with a slugified name + short random suffix as the room ID (project ID and room ID stay aligned), navigates to new workspace; rename calls `PATCH`, refreshes; delete calls `DELETE`, redirects to `/editor` if deleting the active workspace otherwise refreshes. Sidebar updated to accept `ownedProjects`/`sharedProjects` props from real data. Create dialog shows Room ID preview. `POST /api/projects` updated to accept optional custom `id`. Build verified clean.
- **08-editor-workspace-shell**: `app/editor/[roomId]/page.tsx` added as a server component — awaits `params`, calls `getCurrentIdentity()`, redirects to `/sign-in` if unauthenticated, shows `AccessDenied` for missing/unauthorized projects, and renders `WorkspaceShell`. `lib/project-access.ts` added with `getCurrentIdentity()` and `getProjectWithAccess()` helpers. `components/editor/access-denied.tsx` created with centered lock icon, message, and link back to `/editor`. `components/editor/workspace-shell.tsx` created as the client shell: workspace navbar with project name, disabled Share button, and AI sidebar toggle; `ProjectSidebar` reused with `activeProjectId` for highlighting; canvas placeholder; collapsible AI chat placeholder. `ProjectSidebar` updated with optional `activeProjectId` prop — active item renders with `bg-[var(--bg-subtle)]` background and accent text. Build and TypeScript verified clean.
- **09-share-dialog**: Share dialog wired into the workspace navbar. `getProjectWithAccess` updated to return `isOwner` boolean alongside the project summary. `GET /api/projects/[projectId]/collaborators` lists collaborators enriched with Clerk display name and avatar via `clerkClient().users.getUserList`. `POST /api/projects/[projectId]/collaborators` invites by email (owner only, 409 on duplicate). `DELETE /api/projects/[projectId]/collaborators/[collaboratorId]` removes a collaborator (owner only). `components/editor/dialogs/share-dialog.tsx` created: owners see an email invite input, a collaborator list with remove buttons, and a copy-link button with "Copied!" feedback; collaborators see the list as read-only. Share button in `WorkspaceShell` is now active, opening the dialog; `isOwner` passed from the page via `getProjectWithAccess`. Build verified clean.

## In Progress

- None.

## Next Up

- Canvas foundation (React Flow setup, node/edge types).


## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- Add decisions that affect the system design or data model.

## Session Notes

- Add context needed to resume work in the next session.
