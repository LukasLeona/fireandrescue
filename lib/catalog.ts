export type CatalogCourse = {
  title: string;
  description: string;
  category: 'hazmat' | 'leadership' | 'prevention' | 'driver';
  image: string;
  lessons: string;
  duration: string;
  href: string;
};

export const catalogCourses: CatalogCourse[] = [
  {
    title: 'HazMat Awareness',
    description: 'Recognize hazardous materials, identify safe actions, and use initial-response information resources.',
    category: 'hazmat',
    image: '/assets/images/course-hazmat.svg',
    lessons: '16 lessons',
    duration: '4–5 hours',
    href: '/hazmat-awareness'
  },
  {
    title: 'HazMat Operations',
    description: 'Build operations-level response knowledge for defensive control, decontamination, and scene support.',
    category: 'hazmat',
    image: '/assets/images/course-operations.svg',
    lessons: '14 lessons',
    duration: '6 hours',
    href: '/courses'
  },
  {
    title: 'Fire Instructor 1',
    description: 'Plan, present, and evaluate structured fire-service instruction for adult learners.',
    category: 'leadership',
    image: '/assets/images/course-instructor.svg',
    lessons: '12 lessons',
    duration: '5 hours',
    href: '/courses'
  },
  {
    title: 'Fire Inspector 1',
    description: 'Develop foundational inspection, code-awareness, documentation, and public-safety skills.',
    category: 'prevention',
    image: '/assets/images/course-inspector.svg',
    lessons: '15 lessons',
    duration: '6 hours',
    href: '/courses'
  },
  {
    title: 'Driver Operator – Pumper',
    description: 'Study apparatus positioning, pump operations, hydraulics, and safe vehicle practices.',
    category: 'driver',
    image: '/assets/images/course-pumper.svg',
    lessons: '13 lessons',
    duration: '5 hours',
    href: '/courses'
  },
  {
    title: 'Driver Operator – ARFF',
    description: 'Prepare for aircraft rescue and firefighting apparatus operations and airfield response.',
    category: 'driver',
    image: '/assets/images/course-arff.svg',
    lessons: '11 lessons',
    duration: '5 hours',
    href: '/courses'
  }
];
