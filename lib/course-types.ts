export type CourseQuestion = { q: string; options: string[]; correct: number; explanation: string; sourceNumber?: number };
export type CourseBlock = { title: string; body: string };
export type QuickCheck = { type: 'quickCheck'; prompt: string; options: Array<{ text: string; correct: boolean }>; correctMessage: string; wrongMessage: string };
export type MatchingActivity = { type: 'matching'; prompt: string; leftTitle: string; rightTitle: string; pairs: Array<{ left: string; right: string }>; successMessage: string };
export type DragSortActivity = { type: 'dragSort'; prompt: string; groups: Array<{ id: string; title: string }>; items: Array<{ text: string; group: string }>; successMessage: string };
export type CourseActivity = QuickCheck | MatchingActivity | DragSortActivity;
export type CourseItem = {
  id: string; label: string; type: 'lesson' | 'assessment'; title: string; description?: string; subtitle?: string; chapter?: string; chapterTitle?: string;
  image?: string; blocks?: CourseBlock[]; activity?: CourseActivity; questions?: CourseQuestion[]; gradingNote?: string; passLabel?: string;
  chapterId?: string; chapterHeading?: string; chapterSubtitle?: string;
};
export type CourseChapter = { id: string; title: string; subtitle?: string; items: CourseItem[] };
export type CourseData = { title: string; imageIntro: string; chapters: CourseChapter[] };
export type AssessmentResult = { id: string; title: string; score: number; maxScore: number; answers: Array<number | null> };
