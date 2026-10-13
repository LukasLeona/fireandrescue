insert into public.courses (slug, title, description, cover_image, lesson_count, is_published)
values
  (
    'hazmat-awareness',
    'HazMat Awareness',
    'Recognize hazardous materials, identify safe actions, and use initial-response information resources.',
    'assets/images/course-covers/hazmat-awareness.png',
    24,
    true
  ),
  (
    'fire-inspector-1',
    'Fire Inspector 1',
    'Duties and authority, fire dynamics, construction, occupancy, egress, site access, hazard recognition, water systems, and fire suppression systems.',
    'assets/images/course-covers/fire-inspector.png',
    350,
    true
  ),
  (
    'fire-instructor-1',
    'Fire Instructor 1',
    'Professional instructor responsibilities, learning principles, planning, instructional materials, learning environments, classroom delivery, student interaction, skills training, testing, and records.',
    'assets/images/course-covers/fire-instructor.png',
    154,
    true
  )
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  cover_image = excluded.cover_image,
  lesson_count = excluded.lesson_count,
  is_published = excluded.is_published,
  updated_at = now();
