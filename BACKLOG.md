# Backlog — LDSP Alumni Website

## High Impact

- [ ] **Generate Supabase types** — `npx supabase gen types typescript --project-id nkjomnnyblwpezcsepgb > types/database.ts` — eliminates `any` in API routes
- [ ] **Error boundaries** — wrap page sections so one crash doesn't kill whole page
- [ ] **Tests** — Vitest + React Testing Library for critical flows (auth, jobs, messages, announcements CRUD)

## Medium Impact

- [ ] **Migrate remaining `<img>` → `<Image />`** — ~15 components (EventCard, JobCard, ProfileView, Navbar logos, Footer, etc.)
- [ ] **React Query / SWR** — replace manual `fetch` + `useEffect` in badges, inbox, chat — caching, deduping, retry
- [ ] **Admin UX** — activity log filters, bulk actions (delete multiple), export CSV
- [ ] **Loading skeletons** — replace spinners with content-shaped placeholders

## Lower Priority

- [ ] **Accessibility audit** — focus traps in modals, ARIA labels on icon buttons, heading hierarchy
- [ ] **PWA** — manifest, service worker for offline announcements/jobs
- [ ] **Analytics** — Vercel Analytics or Plausible (privacy-friendly)

## Nice-to-Have

- [ ] **Dark mode** — CSS variables already support it (`--primary-color`), just need toggle + persistence
- [ ] **Real-time** — Supabase Realtime for messages (new message appears without refresh), live like counts
- [ ] **Search** — full-text search on directory, jobs, announcements (PostgreSQL `tsvector` or Meilisearch)

---

## Separate Project: White-Label Alumni Platform

See `NEW_SCHOOL_PROJECT_BRIEF.md` — Neon + Clerk + Cloudinary + Pusher stack for multi-school deployment.