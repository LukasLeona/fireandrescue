insert into public.courses (slug, title, description, cover_image, lesson_count, is_published)
values (
  'hazmat-awareness',
  'HazMat Awareness',
  'Recognize hazardous materials, identify safe actions, and use initial-response information resources.',
  'assets/images/course-hazmat.svg',
  24,
  true
)
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  cover_image = excluded.cover_image,
  lesson_count = excluded.lesson_count,
  is_published = excluded.is_published;
