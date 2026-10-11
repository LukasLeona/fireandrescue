export type SourceSlide = {
  number: number;
  title: string;
  content: string[];
  notes: string[];
};

export type SourceVisual = {
  slide: number;
  src: string;
  alt: string;
};

export type SourceModule = {
  id: string;
  chapter: number;
  title: string;
  sourceFile: string;
  slideCount: number;
  visuals: SourceVisual[];
  slides: SourceSlide[];
};

export type SourceCourse = {
  slug: string;
  title: string;
  standard: string;
  sourceNotice: string;
  moduleCount: number;
  slideCount: number;
  modules: SourceModule[];
};

export type SourceCourseMeta = {
  eyebrow: string;
  description: string;
  cover: string;
  illustration: string;
  illustrationAlt: string;
  accent: 'inspection' | 'instruction';
  moduleNames: string[];
};

export type SourceCourseDefinition = SourceCourse & { meta: SourceCourseMeta };
