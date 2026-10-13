# Fire and Rescue Academy LMS

Fire and Rescue Academy is a Next.js LMS for emergency-response training. It combines public academy pages, a role-based Supabase account workflow, staff and student dashboards, and three published, gamified courses.

## Application features

- Responsive React pages for the homepage, academy, catalog, course overview, contact, and policies.
- Pending-account workflow with email verification and approval status tracking.
- Exactly one protected `super_admin`, plus `admin`, `instructor`, and `student` roles.
- Staff application review, invitations, member management, reporting, rankings, and audit history.
- Student enrollment, lesson completion, quiz attempts, scores, and progress tracking.
- A shared interactive player for HazMat Awareness, Fire Inspector 1, and Fire Instructor 1, with collapsible outlines, XP, ranks, achievements, practice activities, and course tests.
- Preserved Fire Inspector 1 and Fire Instructor 1 source wording, reformatted from 2,799 supplied presentation slides into focused lesson sections.
- Canonical course URLs under `/courses/`, with legacy HazMat links permanently redirected for compatibility.
- Login-required catalog entry and automatic enrollment for approved students opening an available course.
- Local course progress for visitors and Supabase cloud sync for approved, enrolled students.

## Requirements

- Node.js 24
- A Supabase project
- A Vercel project for production deployment

## Local development

```bash
npm install
npm run dev
```

Copy the variable names in `.env.example` to `.env.local`. Public Supabase values are served to the browser through `/api/config`; the secret key is only read in server route handlers.

Run all verification before deployment:

```bash
npm test
npm run check
npm run build
```

## Supabase setup

Apply the migrations in filename order. The current schema includes five migrations, ending with:

1. `supabase/migrations/202610090001_lms_core.sql`
2. `supabase/migrations/202610090002_seed_catalog.sql`
3. `supabase/migrations/202610090003_harden_student_writes.sql`
4. `supabase/migrations/202610120004_publish_source_courses.sql`
5. `supabase/migrations/202610130005_publish_available_courses.sql`

Set the Authentication Site URL to `https://fireandrescueacademy.vercel.app` and allow these redirect URLs:

- `https://fireandrescueacademy.vercel.app/auth-callback`
- `https://fireandrescueacademy.vercel.app/set-password`
- `http://localhost:3000/auth-callback`
- `http://localhost:3000/set-password`

Register `luke@lukasleona.com`, then use `supabase/bootstrap-super-admin.sql.example` once to promote and protect the owner. Its final query must return exactly one approved Super Admin.

## Roles

| Role | Permissions |
| --- | --- |
| Super Admin | Approves every role, assigns roles, invites users, manages account status, and sees all LMS data. |
| Admin | Reviews and invites students, views members, courses, and academy analytics. |
| Instructor | Reviews and invites students, views course rosters, progress, quiz scores, and rankings. |
| Student | Enrolls in published courses, completes training and assessments, and sees personal progress. |

Authorization is enforced by database Row Level Security and server-side checks. A modified browser interface cannot grant additional permissions.

## Vercel configuration

Add these environment variables to Production, Preview, and Development:

```text
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
SITE_URL
RESEND_API_KEY        # optional
EMAIL_FROM            # optional
```

`vercel.json` declares the Next.js framework, install/build commands, and security headers. `SITE_URL` must be the exact production origin without a trailing slash. Keep secret and service-role values out of client code and Git.

Legacy `.html` addresses permanently redirect to their current Next.js routes so existing links continue to work.
