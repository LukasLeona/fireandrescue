export type CatalogCourse = {
  title: string;
  description: string;
  category: 'hazmat' | 'leadership' | 'prevention' | 'driver';
  image: string;
  lessons: string;
  duration: string;
  href: string;
  available: boolean;
};

export const catalogCourses: CatalogCourse[] = [
  {
    title: 'HazMat Awareness',
    description: 'Recognize hazardous materials, identify safe actions, and use initial-response information resources.',
    category: 'hazmat',
    image: '/assets/images/course-covers/hazmat-awareness.png',
    lessons: '16 lessons',
    duration: '4–5 hours',
    href: '/hazmat-awareness',
    available: true
  },
  {
    title: 'HazMat Operations',
    description: 'Build operations-level response knowledge for defensive control, decontamination, and scene support.',
    category: 'hazmat',
    image: '/assets/images/course-covers/hazmat-operations.png',
    lessons: '14 lessons',
    duration: '6 hours',
    href: '/courses',
    available: false
  },
  {
    title: 'Fire Instructor 1',
    description: 'Plan, present, and evaluate structured fire-service instruction for adult learners.',
    category: 'leadership',
    image: '/assets/images/course-covers/fire-instructor.png',
    lessons: '10 modules + 3 tests',
    duration: 'Self-paced',
    href: '/courses/fire-instructor-1',
    available: true
  },
  {
    title: 'Fire Inspector 1',
    description: 'Develop foundational inspection, code-awareness, documentation, and public-safety skills.',
    category: 'prevention',
    image: '/assets/images/course-covers/fire-inspector.png',
    lessons: '12 modules + 3 tests',
    duration: 'Self-paced',
    href: '/courses/fire-inspector-1',
    available: true
  },
  {
    title: 'Firefighter I',
    description: 'Develop the essential knowledge and skills used in entry-level structural firefighting operations.',
    category: 'leadership',
    image: '/assets/images/course-covers/firefighter-1.png',
    lessons: 'Coming soon',
    duration: 'Not yet available',
    href: '/courses',
    available: false
  },
  {
    title: 'Firefighter II',
    description: 'Continue firefighter development through advanced operational responsibilities and team-based response.',
    category: 'leadership',
    image: '/assets/images/course-covers/firefighter-2.png',
    lessons: 'Coming soon',
    duration: 'Not yet available',
    href: '/courses',
    available: false
  },
  {
    title: 'Driver Operator – Pumper',
    description: 'Study apparatus positioning, pump operations, hydraulics, and safe vehicle practices.',
    category: 'driver',
    image: '/assets/images/course-covers/driver-pumper.png',
    lessons: '13 lessons',
    duration: '5 hours',
    href: '/courses',
    available: false
  },
  {
    title: 'Driver Operator – Aircraft Rescue and Firefighting',
    description: 'Prepare for aircraft rescue and firefighting apparatus operations and airfield response.',
    category: 'driver',
    image: '/assets/images/course-covers/driver-arff.png',
    lessons: '11 lessons',
    duration: '5 hours',
    href: '/courses',
    available: false
  },
  {
    title: 'Driver Operator – Mobile Water Supply',
    description: 'Study safe apparatus operation and mobile water-supply responsibilities for fireground support.',
    category: 'driver',
    image: '/assets/images/course-covers/driver-mobile-water.png',
    lessons: 'Coming soon',
    duration: 'Not yet available',
    href: '/courses',
    available: false
  },
  {
    title: 'Airport Firefighter',
    description: 'Prepare for airport emergency response, aircraft hazards, and specialized firefighting operations.',
    category: 'driver',
    image: '/assets/images/course-covers/airport-firefighter.png',
    lessons: 'Coming soon',
    duration: 'Not yet available',
    href: '/courses',
    available: false
  }
];
