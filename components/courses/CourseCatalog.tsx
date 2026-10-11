'use client';

import { useMemo, useState } from 'react';
import { catalogCourses } from '@/lib/catalog';
import { CourseCard } from '@/components/site/CourseCard';

const filters = [
  ['all', 'All'], ['hazmat', 'HazMat'], ['leadership', 'Leadership'], ['prevention', 'Prevention'], ['driver', 'Driver operator']
] as const;

export function CourseCatalog() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const courses = useMemo(() => catalogCourses.filter((course) => (filter === 'all' || course.category === filter) && `${course.title} ${course.description}`.toLowerCase().includes(search.toLowerCase())), [filter, search]);
  return (
    <>
      <div className="catalog-tools"><div className="search-box"><span aria-hidden="true">⌕</span><input type="search" placeholder="Search courses" aria-label="Search courses" value={search} onChange={(event) => setSearch(event.target.value)} /></div><div className="filters" aria-label="Course filters">{filters.map(([value, label]) => <button className={`filter-btn${filter === value ? ' active' : ''}`} key={value} onClick={() => setFilter(value)}>{label}</button>)}</div></div>
      <p style={{ color: 'var(--ink-soft)', margin: '0 0 20px' }}>{courses.length} course{courses.length === 1 ? '' : 's'} in the catalog</p>
      <div className="course-grid">{courses.map((course) => <CourseCard course={course} key={course.title} />)}</div>
    </>
  );
}
