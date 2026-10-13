import type { SourceCourseDefinition, SourceModule, SourceSlide } from './source-course-types';

export const SOURCE_SLIDES_PER_SECTION = 6;

export type SourceLessonItem = {
  id: string;
  type: 'lesson';
  label: string;
  title: string;
  description: string;
  moduleIndex: number;
  slides: SourceSlide[];
};

export type SourcePracticeItem = {
  id: string;
  type: 'practice';
  label: string;
  title: string;
  description: string;
  moduleIndex: number;
  module: SourceModule;
};

export type SourceOutlineItem = SourceLessonItem | SourcePracticeItem;

export type SourceOutlineChapter = {
  id: string;
  title: string;
  subtitle: string;
  moduleIndex: number;
  module: SourceModule;
  items: SourceOutlineItem[];
};

function hasCourseText(slide: SourceSlide) {
  return Boolean(slide.title.trim() || slide.content.some((block) => block.trim()) || slide.notes.some((note) => note.trim()));
}

function sectionTitle(slides: SourceSlide[], fallback: string) {
  return slides.find((slide) => slide.title.trim())?.title.trim() || fallback;
}

export function buildSourceLessonOutline(course: SourceCourseDefinition): SourceOutlineChapter[] {
  return course.modules.map((module, moduleIndex) => {
    const slides = module.slides.filter(hasCourseText);
    const items: SourceOutlineItem[] = [];
    for (let index = 0; index < slides.length; index += SOURCE_SLIDES_PER_SECTION) {
      const sectionSlides = slides.slice(index, index + SOURCE_SLIDES_PER_SECTION);
      const sectionNumber = items.length + 1;
      items.push({
        id: `${module.id}-section-${sectionNumber}`,
        type: 'lesson',
        label: `Section ${sectionNumber}`,
        title: sectionTitle(sectionSlides, course.meta.moduleNames[moduleIndex] || module.title),
        description: `${sectionSlides.length} supplied course screens reformatted into one focused lesson section.`,
        moduleIndex,
        slides: sectionSlides
      });
    }
    const moduleName = course.meta.moduleNames[moduleIndex] || module.title;
    items.push({
      id: `${module.id}-practice`,
      type: 'practice',
      label: 'Module practice',
      title: `${moduleName} Practice`,
      description: 'Complete the source-based challenge to check your understanding and earn training XP.',
      moduleIndex,
      module
    });
    return {
      id: module.id,
      title: `Module ${moduleIndex + 1}`,
      subtitle: moduleName,
      moduleIndex,
      module,
      items
    };
  });
}

export function countSourceLessonSections(course: SourceCourseDefinition) {
  return buildSourceLessonOutline(course).reduce((total, chapter) => total + chapter.items.length, 0);
}
