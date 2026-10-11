import inspectorJson from './course-content/fire-inspector-1.json';
import instructorJson from './course-content/fire-instructor-1.json';
import type { SourceCourse, SourceCourseDefinition, SourceCourseMeta } from './source-course-types';

export const sourceCourseSlugs = ['fire-inspector-1', 'fire-instructor-1'] as const;
export type SourceCourseSlug = (typeof sourceCourseSlugs)[number];

const metadata: Record<SourceCourseSlug, SourceCourseMeta> = {
  'fire-inspector-1': {
    eyebrow: 'Fire prevention curriculum',
    description: 'Duties and authority, fire dynamics, construction, occupancy, egress, site access, hazard recognition, water systems, and fire suppression systems.',
    cover: '/assets/images/course-covers/fire-inspector.png',
    illustration: '/assets/images/course-illustrations/fire-inspector-visual.png',
    illustrationAlt: 'Fire inspector reviewing an exit, emergency light, and extinguisher during a building inspection',
    accent: 'inspection',
    moduleNames: [
      'Duties & Authority',
      'Fire Dynamics',
      'Construction and Structural Systems',
      'Building Components and Systems',
      'Occupancy Classifications',
      'Means of Egress',
      'Site Access',
      'Fire Hazard Recognition',
      'Hazardous Materials',
      'Water Supply Distribution Systems',
      'Water-Based Fire Suppression Systems',
      'Portable Extinguishers and Special Agent Fire Extinguishing Systems'
    ]
  },
  'fire-instructor-1': {
    eyebrow: 'NFPA 1041 course',
    description: 'Professional instructor responsibilities, learning principles, planning, instructional materials, learning environments, classroom delivery, student interaction, skills training, testing, and records.',
    cover: '/assets/images/course-covers/fire-instructor.png',
    illustration: '/assets/images/course-illustrations/fire-instructor-visual.png',
    illustrationAlt: 'Fire service instructor guiding a classroom equipment demonstration',
    accent: 'instruction',
    moduleNames: [
      'The Instructor as a Professional',
      'Principles of Learning',
      'Instructional Planning',
      'Instructional Materials and Equipment',
      'Learning Environment',
      'Classroom Instruction',
      'Student Interaction',
      'Skills-Based Training Beyond the Classroom',
      'Testing and Evaluation',
      'Records, Reports, and Scheduling'
    ]
  }
};

const content: Record<SourceCourseSlug, SourceCourse> = {
  'fire-inspector-1': inspectorJson as SourceCourse,
  'fire-instructor-1': instructorJson as SourceCourse
};

export function isSourceCourseSlug(value: string): value is SourceCourseSlug {
  return sourceCourseSlugs.includes(value as SourceCourseSlug);
}

export function getSourceCourse(slug: SourceCourseSlug): SourceCourseDefinition {
  return { ...content[slug], meta: metadata[slug] };
}
