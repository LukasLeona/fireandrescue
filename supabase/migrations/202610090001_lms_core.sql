-- Fire and Rescue Academy: authentication, approval workflow, LMS records, and RLS.
create extension if not exists pgcrypto;

create type public.app_role as enum ('super_admin', 'admin', 'instructor', 'student');
create type public.approval_status as enum ('pending', 'approved', 'rejected', 'suspended', 'archived');
create type public.enrollment_status as enum ('active', 'completed', 'withdrawn');
create type public.invitation_status as enum ('sent', 'accepted', 'expired', 'revoked');

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  phone text,
  organization text,
  application_note text,
  requested_role public.app_role not null default 'student',
  role public.app_role not null default 'student',
  status public.approval_status not null default 'pending',
  rejection_reason text,
  approved_by uuid references public.profiles(user_id) on delete set null,
  approved_at timestamptz,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_single_super_admin_idx
  on public.profiles ((role = 'super_admin'))
  where role = 'super_admin';
create index profiles_status_idx on public.profiles(status, requested_role, created_at desc);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  cover_image text,
  lesson_count integer not null default 0 check (lesson_count >= 0),
  is_published boolean not null default false,
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.course_instructors (
  course_id uuid not null references public.courses(id) on delete cascade,
  instructor_id uuid not null references public.profiles(user_id) on delete cascade,
  assigned_by uuid references public.profiles(user_id) on delete set null,
  assigned_at timestamptz not null default now(),
  primary key (course_id, instructor_id)
);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  student_id uuid not null references public.profiles(user_id) on delete cascade,
  status public.enrollment_status not null default 'active',
  progress_percent numeric(5,2) not null default 0 check (progress_percent between 0 and 100),
  enrolled_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (course_id, student_id)
);
create index enrollments_student_idx on public.enrollments(student_id, status);
create index enrollments_course_idx on public.enrollments(course_id, status);

create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  lesson_id text not null,
  completed boolean not null default true,
  xp integer not null default 100 check (xp >= 0),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (course_id, user_id, lesson_id)
);
create index lesson_progress_user_course_idx on public.lesson_progress(user_id, course_id);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  assessment_id text not null,
  assessment_title text not null,
  score integer not null check (score >= 0),
  max_score integer not null check (max_score > 0),
  percent numeric(5,2) generated always as (round((score::numeric / max_score::numeric) * 100, 2)) stored,
  answers jsonb not null default '[]'::jsonb,
  submitted_at timestamptz not null default now()
);
create index quiz_attempts_course_ranking_idx on public.quiz_attempts(course_id, percent desc, submitted_at);
create index quiz_attempts_user_idx on public.quiz_attempts(user_id, submitted_at desc);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role public.app_role not null default 'student',
  status public.invitation_status not null default 'sent',
  created_by uuid not null references public.profiles(user_id) on delete restrict,
  accepted_by uuid references public.profiles(user_id) on delete set null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);
create unique index invitations_active_email_idx on public.invitations(lower(email)) where status = 'sent';

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  title text not null,
  message text not null,
  action_url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications(user_id, created_at desc);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  course_id uuid references public.courses(id) on delete cascade,
  created_by uuid not null references public.profiles(user_id) on delete restrict,
  published_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_user_id uuid references public.profiles(user_id) on delete set null,
  action text not null,
  target_user_id uuid references public.profiles(user_id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_created_idx on public.audit_logs(created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger courses_set_updated_at before update on public.courses
for each row execute function public.set_updated_at();
create trigger enrollments_set_updated_at before update on public.enrollments
for each row execute function public.set_updated_at();
create trigger lesson_progress_set_updated_at before update on public.lesson_progress
for each row execute function public.set_updated_at();

create or replace function public.current_user_role()
returns public.app_role
language sql stable security definer
set search_path = public
as $$
  select role from public.profiles
  where user_id = auth.uid() and status = 'approved'
$$;

create or replace function public.is_approved_user()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists(
    select 1 from public.profiles
    where user_id = auth.uid() and status = 'approved'
  )
$$;

create or replace function public.is_super_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'super_admin', false)
$$;

create or replace function public.is_staff()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('super_admin', 'admin', 'instructor'), false)
$$;

create or replace function public.is_course_instructor(target_course uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select public.current_user_role() in ('super_admin', 'admin')
    or exists(
      select 1 from public.course_instructors
      where course_id = target_course and instructor_id = auth.uid()
    )
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  requested public.app_role;
  pending_invite public.invitations%rowtype;
begin
  requested := case lower(coalesce(new.raw_user_meta_data ->> 'requested_role', 'student'))
    when 'admin' then 'admin'::public.app_role
    when 'instructor' then 'instructor'::public.app_role
    else 'student'::public.app_role
  end;

  select * into pending_invite
  from public.invitations
  where lower(email) = lower(new.email)
    and status = 'sent'
    and expires_at > now()
  order by created_at desc
  limit 1;

  insert into public.profiles (
    user_id, email, full_name, phone, organization, application_note,
    requested_role, role, status, approved_by, approved_at
  ) values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    nullif(new.raw_user_meta_data ->> 'organization', ''),
    nullif(new.raw_user_meta_data ->> 'application_note', ''),
    coalesce(pending_invite.role, requested),
    coalesce(pending_invite.role, 'student'::public.app_role),
    case when pending_invite.id is null then 'pending'::public.approval_status else 'approved'::public.approval_status end,
    pending_invite.created_by,
    case when pending_invite.id is null then null else now() end
  );

  if pending_invite.id is not null then
    update public.invitations
      set status = 'accepted', accepted_by = new.id, accepted_at = now()
      where id = pending_invite.id;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.refresh_enrollment_progress()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  target_user uuid := coalesce(new.user_id, old.user_id);
  target_course uuid := coalesce(new.course_id, old.course_id);
  expected integer;
  finished integer;
  calculated numeric(5,2);
begin
  select greatest(lesson_count, 1) into expected from public.courses where id = target_course;
  select count(*) into finished from public.lesson_progress
    where user_id = target_user and course_id = target_course and completed;
  calculated := least(100, round((finished::numeric / expected::numeric) * 100, 2));
  update public.enrollments
    set progress_percent = calculated,
        status = case when calculated >= 100 then 'completed'::public.enrollment_status else status end,
        completed_at = case when calculated >= 100 then coalesce(completed_at, now()) else completed_at end
    where student_id = target_user and course_id = target_course;
  return coalesce(new, old);
end;
$$;

create trigger lesson_progress_refresh_enrollment
  after insert or update or delete on public.lesson_progress
  for each row execute function public.refresh_enrollment_progress();

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.course_instructors enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.invitations enable row level security;
alter table public.notifications enable row level security;
alter table public.announcements enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_select_own_or_staff on public.profiles for select to authenticated
using (user_id = auth.uid() or public.is_staff());
create policy profiles_update_own on public.profiles for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

revoke update on public.profiles from authenticated;
grant update (full_name, phone, organization, application_note, last_seen_at) on public.profiles to authenticated;

create policy courses_select_published_or_staff on public.courses for select to authenticated
using (is_published or public.is_staff());
create policy courses_manage_super_admin on public.courses for all to authenticated
using (public.is_super_admin()) with check (public.is_super_admin());

create policy instructors_select_staff on public.course_instructors for select to authenticated
using (public.is_staff());
create policy instructors_manage_super_admin on public.course_instructors for all to authenticated
using (public.current_user_role() in ('super_admin', 'admin'))
with check (public.current_user_role() in ('super_admin', 'admin'));

create policy enrollments_select_own_or_course_staff on public.enrollments for select to authenticated
using (student_id = auth.uid() or public.is_course_instructor(course_id));
create policy enrollments_student_self_enroll on public.enrollments for insert to authenticated
with check (
  student_id = auth.uid()
  and public.current_user_role() = 'student'
  and status = 'active'
  and exists(select 1 from public.courses where id = course_id and is_published)
);
create policy enrollments_student_withdraw on public.enrollments for update to authenticated
using (student_id = auth.uid())
with check (student_id = auth.uid() and status in ('active', 'withdrawn'));

create policy progress_select_own_or_course_staff on public.lesson_progress for select to authenticated
using (user_id = auth.uid() or public.is_course_instructor(course_id));
create policy progress_insert_own_enrollment on public.lesson_progress for insert to authenticated
with check (
  user_id = auth.uid()
  and exists(select 1 from public.enrollments where course_id = lesson_progress.course_id and student_id = auth.uid() and status in ('active', 'completed'))
);
create policy progress_update_own_enrollment on public.lesson_progress for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy attempts_select_own_or_course_staff on public.quiz_attempts for select to authenticated
using (user_id = auth.uid() or public.is_course_instructor(course_id));
create policy attempts_insert_own_enrollment on public.quiz_attempts for insert to authenticated
with check (
  user_id = auth.uid()
  and exists(select 1 from public.enrollments where course_id = quiz_attempts.course_id and student_id = auth.uid() and status in ('active', 'completed'))
);

create policy invitations_select_staff on public.invitations for select to authenticated
using (public.is_staff());

create policy notifications_select_own on public.notifications for select to authenticated
using (user_id = auth.uid());
create policy notifications_update_own on public.notifications for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy announcements_select_approved on public.announcements for select to authenticated
using (public.is_approved_user() and (expires_at is null or expires_at > now()));
create policy announcements_manage_staff on public.announcements for all to authenticated
using (public.is_staff()) with check (public.is_staff());

create policy audit_logs_select_super_admin on public.audit_logs for select to authenticated
using (public.is_super_admin());

grant usage on schema public to authenticated;
grant select on public.profiles, public.courses, public.course_instructors, public.enrollments,
  public.lesson_progress, public.quiz_attempts, public.invitations, public.notifications,
  public.announcements, public.audit_logs to authenticated;
grant insert, update on public.enrollments, public.lesson_progress to authenticated;
grant insert on public.quiz_attempts to authenticated;
grant update on public.notifications to authenticated;
grant insert, update, delete on public.courses, public.course_instructors, public.announcements to authenticated;
grant execute on function public.current_user_role(), public.is_approved_user(),
  public.is_super_admin(), public.is_staff(), public.is_course_instructor(uuid) to authenticated;

comment on table public.profiles is 'One profile per Supabase Auth user, including approval and role state.';
comment on table public.audit_logs is 'Immutable server-written record of privileged account actions.';
