import { access, readFile, readdir } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requiredRoutes = [
  'app/page.tsx',
  'app/about/page.tsx',
  'app/application-status/page.tsx',
  'app/auth-callback/page.tsx',
  'app/contact/page.tsx',
  'app/courses/[slug]/page.tsx',
  'app/courses/page.tsx',
  'app/dashboard/page.tsx',
  'app/hazmat-awareness/page.tsx',
  'app/hazmat-course/page.tsx',
  'app/login/page.tsx',
  'app/privacy/page.tsx',
  'app/register/page.tsx',
  'app/set-password/page.tsx',
  'app/terms/page.tsx'
];
const legacyPages = [
  'index.html', 'about-us.html', 'application-status.html', 'auth-callback.html',
  'contact.html', 'courses.html', 'dashboard.html', 'hazmat-awareness.html',
  'hazmat-course.html', 'login.html', 'privacy-policy.html', 'register.html',
  'set-password.html', 'terms-conditions.html'
];
const errors = [];

async function exists(relativePath) {
  try {
    await access(path.join(root, relativePath), constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function sourceFiles(directory) {
  const entries = await readdir(path.join(root, directory), { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const relative = path.join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(relative) : [relative];
  }));
  return nested.flat();
}

for (const route of requiredRoutes) {
  if (!await exists(route)) errors.push(`Missing required route: ${route}`);
}

for (const page of legacyPages) {
  if (await exists(page)) errors.push(`Legacy HTML page should be removed: ${page}`);
}

const filesToScan = (await Promise.all(['app', 'components', 'lib'].map(sourceFiles))).flat()
  .filter((file) => /\.(?:ts|tsx|json)$/.test(file));
const publicReferences = new Set();
for (const file of filesToScan) {
  const source = await readFile(path.join(root, file), 'utf8');
  for (const match of source.matchAll(/\/assets\/[A-Za-z0-9_./%-]+/g)) publicReferences.add(match[0]);
  if (/^['"]use client['"];?/m.test(source) && /SUPABASE_(?:SECRET|SERVICE_ROLE)/.test(source)) {
    errors.push(`${file} must not reference a server secret.`);
  }
}

for (const reference of publicReferences) {
  const decoded = decodeURIComponent(reference).replace(/^\//, '');
  if (!await exists(path.join('public', decoded))) errors.push(`Missing public asset: ${reference}`);
}

const migrationDirectory = path.join(root, 'supabase', 'migrations');
const migrations = (await readdir(migrationDirectory)).filter((file) => file.endsWith('.sql')).sort();
if (migrations.length < 5) errors.push('Expected all five LMS database migrations.');

const course = JSON.parse(await readFile(path.join(root, 'lib', 'course-data.json'), 'utf8'));
const items = course.chapters.flatMap((chapter) => chapter.items);
const assessments = items.filter((item) => item.type === 'assessment');
const questionCount = assessments.reduce((sum, item) => sum + item.questions.length, 0);
if (course.chapters.length !== 4 || items.length !== 24 || assessments.length !== 6 || questionCount !== 160) {
  errors.push(`Course content changed unexpectedly: ${course.chapters.length} chapters, ${items.length} items, ${assessments.length} assessments, ${questionCount} questions.`);
}

const sourceCourseExpectations = [
  ['fire-inspector-1', 12, 1975],
  ['fire-instructor-1', 10, 824]
];
for (const [slug, moduleCount, slideCount] of sourceCourseExpectations) {
  const sourceCourse = JSON.parse(await readFile(path.join(root, 'lib', 'course-content', `${slug}.json`), 'utf8'));
  const actualSlideCount = sourceCourse.modules.reduce((total, module) => total + module.slides.length, 0);
  if (sourceCourse.moduleCount !== moduleCount || sourceCourse.modules.length !== moduleCount || sourceCourse.slideCount !== slideCount || actualSlideCount !== slideCount) {
    errors.push(`${slug} source content changed unexpectedly: ${sourceCourse.modules.length} modules and ${actualSlideCount} slides.`);
  }
}

const outlineSource = await readFile(path.join(root, 'lib', 'source-course-outline.ts'), 'utf8');
const testsSource = await readFile(path.join(root, 'lib', 'source-course-tests.ts'), 'utf8');
const playerSource = await readFile(path.join(root, 'components', 'source-course', 'SourceCoursePlayer.tsx'), 'utf8');
const catalogSource = await readFile(path.join(root, 'lib', 'catalog.ts'), 'utf8');
const sourceCoursesSource = await readFile(path.join(root, 'lib', 'source-courses.ts'), 'utf8');
const cardSource = await readFile(path.join(root, 'components', 'site', 'CourseCard.tsx'), 'utf8');
const dynamicRouteSource = await readFile(path.join(root, 'app', 'courses', '[slug]', 'page.tsx'), 'utf8');

if (!outlineSource.includes('SOURCE_SLIDES_PER_SECTION = 6') || !outlineSource.includes("type: 'practice'") || !outlineSource.includes("type: 'assessment'")) {
  errors.push('Imported course outline must retain lesson, practice, and assessment items.');
}
for (const slug of ['fire-inspector-1', 'fire-instructor-1']) {
  const testPrefix = slug === 'fire-inspector-1' ? 'inspector' : 'instructor';
  const testCount = [...testsSource.matchAll(new RegExp(`${testPrefix}-test-\\d+`, 'g'))].length;
  if (testCount !== 3) errors.push(`${slug} must retain exactly three course tests.`);
}
for (const className of ['player-shell', 'player-topbar', 'player-sidebar', 'outline-chapter', 'lesson-panel', 'player-actions']) {
  if (!playerSource.includes(className)) errors.push(`Imported course player is missing shared LMS class: ${className}`);
}
for (const legacyControl of ['source-mode-tabs', 'source-slide-jump', 'nearestVisual']) {
  if (playerSource.includes(legacyControl)) errors.push(`Imported course player must not restore legacy control: ${legacyControl}`);
}
for (const slug of ['hazmat-awareness', 'fire-inspector-1', 'fire-instructor-1']) {
  if (!catalogSource.includes(`href: '/courses/${slug}'`)) errors.push(`Catalog is missing canonical route /courses/${slug}.`);
  if (slug === 'hazmat-awareness' ? !dynamicRouteSource.includes(`'${slug}'`) : !sourceCoursesSource.includes(`'${slug}'`)) {
    errors.push(`Dynamic course route does not handle ${slug}.`);
  }
}
if (!dynamicRouteSource.includes('isSourceCourseSlug') || !dynamicRouteSource.includes('SourceCoursePlayer')) {
  errors.push('Dynamic course route must render supported source courses in the shared player.');
}
if (!cardSource.includes('View course →') || !cardSource.includes('CourseLoginDialog') || !cardSource.includes('getSessionProfile')) {
  errors.push('Available course cards must keep the View course action and require an authenticated profile.');
}

if (errors.length) {
  console.error(`Site check failed with ${errors.length} problem(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Next.js site check passed: ${requiredRoutes.length} routes, ${publicReferences.size} public assets, ${migrations.length} migrations, ${questionCount} preserved HazMat questions, and 2 preserved source courses.`);
}
