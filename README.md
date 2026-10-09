# Fire and Rescue Academy LMS

Fire and Rescue Academy is a static-first training website with a Supabase-backed account approval workflow and LMS. It includes role-aware dashboards, invitations, enrollment, course progress, assessments, rankings, audit logging, and optional approval email delivery.

## Roles and permissions

| Role | Access |
| --- | --- |
| Super Admin | The single protected owner account. Reviews every role, assigns roles, invites staff or students, suspends/restores accounts, sees all courses and audit events. |
| Admin | Reviews student applications, invites students, views members, courses, and academy analytics. |
| Instructor | Reviews student applications, invites students, views assigned course rosters, progress, quiz scores, and rankings. |
| Student | Enrolls in published courses, completes interactive lessons and quizzes, and sees personal progress. |

New self-service registrations always begin as `pending`. Admin and instructor accounts cannot approve other staff; only the Super Admin can do that. Database Row Level Security and server-side authorization enforce these rules even if someone modifies the browser interface.

## Supabase setup

1. Create or select the Supabase project for this site.
2. Open **SQL Editor** and run these files in order:
   - `supabase/migrations/202610090001_lms_core.sql`
   - `supabase/migrations/202610090002_seed_catalog.sql`
   - `supabase/migrations/202610090003_harden_student_writes.sql`
3. In **Authentication → URL Configuration**, set the Site URL to the production Vercel URL and allow these redirects:
   - `https://fireandrescueacademy.vercel.app/auth-callback.html`
   - `https://fireandrescueacademy.vercel.app/set-password.html`
   - Add matching localhost URLs when developing locally.
4. Register the owner through `register.html`, verify the email, replace the placeholder in `supabase/bootstrap-super-admin.sql.example`, and run it once. Its final query must return exactly one approved Super Admin.
5. Keep email confirmation enabled. Customize the confirmation and invitation templates with Fire and Rescue Academy branding if desired.

The frontend uses a publishable key with RLS. Privileged Vercel functions use a server-only secret key. Supabase documents that publishable keys are intended for public clients protected by RLS, while secret/service-role keys must remain on controlled servers: [Supabase API key guidance](https://supabase.com/docs/guides/getting-started/api-keys).

## Vercel environment variables

Copy the names from `.env.example` into the Vercel project settings:

```text
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
SITE_URL
RESEND_API_KEY        # optional
EMAIL_FROM            # optional
```

Legacy Supabase projects can use `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` instead. Never put the secret/service-role value in HTML, browser JavaScript, or Git.

Set `SITE_URL` to the exact deployed origin without a trailing slash. When using Resend, verify the sending domain and set `EMAIL_FROM` to a sender on that domain. Supabase Auth handles invitation links; approval decisions also create in-app notifications, so an email provider outage does not lose the decision.

## Local verification

Use Node.js 20 or newer:

```bash
npm install
npm test
npm run check
```

`npm test` verifies the role authorization matrix. `npm run check` validates critical pages, local file references, migrations, and the absence of server secrets in client modules.

For local browser testing, serve the repository through a Vercel-compatible development server so `/api/config` and the privileged `/api/*` functions are available. Opening HTML directly from the filesystem cannot run serverless functions.

## Launch checklist

- Confirm all three migrations completed without errors.
- Confirm exactly one row has `role = 'super_admin'`.
- Confirm Supabase email confirmation and redirect URLs.
- Confirm the Vercel environment variables in Production and Preview.
- Test a new student application, approval, login, enrollment, lesson completion, quiz submission, and instructor ranking.
- Test that an instructor/admin cannot approve a staff-role request.
- Configure Resend if approval email delivery is required.
- Review Supabase Security Advisor findings and Vercel function logs before launch.

The API verifies access tokens using `auth.getUser(token)` before applying role checks, following [Supabase's authenticated server-request guidance](https://supabase.com/docs/reference/javascript/auth-getuser). Invitations use the documented [`inviteUserByEmail`](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail) admin operation.
