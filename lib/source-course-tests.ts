import type { SourceCourseSlug } from './source-courses';

export type SourceCourseTest = {
  id: string;
  title: string;
  description: string;
  moduleIndexes: number[];
  questionCount: number;
  passingPercent: number;
};

const tests: Partial<Record<SourceCourseSlug, SourceCourseTest[]>> = {
  'fire-inspector-1': [
    {
      id: 'inspector-test-1',
      title: 'Test 1: Duties, Fire Dynamics, and Construction',
      description: 'Source-based assessment covering Modules 1 through 4.',
      moduleIndexes: [0, 1, 2, 3],
      questionCount: 10,
      passingPercent: 70
    },
    {
      id: 'inspector-test-2',
      title: 'Test 2: Occupancy, Egress, Access, and Hazard Recognition',
      description: 'Source-based assessment covering Modules 5 through 8.',
      moduleIndexes: [4, 5, 6, 7],
      questionCount: 10,
      passingPercent: 70
    },
    {
      id: 'inspector-test-3',
      title: 'Test 3: Hazardous Materials and Protection Systems',
      description: 'Source-based assessment covering Modules 9 through 12.',
      moduleIndexes: [8, 9, 10, 11],
      questionCount: 10,
      passingPercent: 70
    }
  ],
  'fire-instructor-1': [
    {
      id: 'instructor-test-1',
      title: 'Test 1: Professional Practice, Learning, and Planning',
      description: 'Source-based assessment covering Modules 1 through 3.',
      moduleIndexes: [0, 1, 2],
      questionCount: 10,
      passingPercent: 70
    },
    {
      id: 'instructor-test-2',
      title: 'Test 2: Materials, Environment, and Classroom Instruction',
      description: 'Source-based assessment covering Modules 4 through 6.',
      moduleIndexes: [3, 4, 5],
      questionCount: 10,
      passingPercent: 70
    },
    {
      id: 'instructor-test-3',
      title: 'Test 3: Student Interaction, Skills Training, Testing, and Records',
      description: 'Source-based assessment covering Modules 7 through 10.',
      moduleIndexes: [6, 7, 8, 9],
      questionCount: 10,
      passingPercent: 70
    }
  ]
};

export function getSourceCourseTests(slug: SourceCourseSlug) {
  return tests[slug] || [];
}
