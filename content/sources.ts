import type { Source } from './types';

/** Reference links from the study plan, with confidence labels. Explanations in this app are original. */
export const sources: Source[] = [
  { title: 'Microsoft Careers — Technical interviewing', url: 'https://careers.microsoft.com/v2/global/en/hiring-tips/technical-interviewing.html', label: 'OFFICIAL', note: 'Microsoft’s own guidance on technical interviews.' },
  { title: 'Microsoft Careers — Interview tips', url: 'https://careers.microsoft.com/v2/global/en/hiring-tips/interview-tips', label: 'OFFICIAL', note: 'General interview preparation guidance.' },
  { title: 'Microsoft Careers — Student interviewing', url: 'https://careers.microsoft.com/v2/global/en/hiring-tips/student-interviewing.html', label: 'OFFICIAL', note: 'Guidance aimed at students and interns.' },
  { title: 'MIT 6.006 Introduction to Algorithms (Spring 2020)', url: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/', label: 'EDUCATIONAL', note: 'Rigorous background on asymptotic analysis and core data structures.' },
  { title: 'Python — Time complexity of built-in operations', url: 'https://docs.python.org/3.14/builtins/time-complexity.html', label: 'EDUCATIONAL', note: 'Reference for list/dict/set/deque operation costs.' },
  { title: 'Python — collections (deque, Counter, defaultdict)', url: 'https://docs.python.org/3/library/collections.html', label: 'EDUCATIONAL', note: 'Official documentation for the collections module.' },
  { title: 'NeetCode roadmap', url: 'https://neetcode.io/roadmap', label: 'CURATED', note: 'A popular curated ordering of interview patterns.' },
  { title: 'VisuAlgo', url: 'https://visualgo.net/en', label: 'EDUCATIONAL', note: 'Interactive algorithm visualizations (link only; illustrations not reused).' },
  { title: 'U of T — first-year Microsoft Explore experience (2023)', url: 'https://www.teach.cs.toronto.edu/ambassadors/blog/2023-microsoft-explore/first-year/', label: 'ANECDOTAL', note: 'One first-person account. Formats vary by team and interviewer.' },
  { title: 'ColorStack community document — Microsoft Explore interview experiences (stored locally)', url: 'https://github.com/BigZ509/microsoft-interview-prep/blob/main/sources/colorstack-explore-research.md', label: 'ANECDOTAL', note: 'Firsthand member reports (Roman to Integer, Two Sum + sorted follow-up, code explanation, linked-list node removal, Merge Two Sorted Lists, a Canva OOP question), plus practice recommendations. Publication date unknown. Stored verbatim in sources/colorstack-explore-research.md.' },
  { title: 'CourtneyThurston/microsoft-internships (historical question reports)', url: 'https://github.com/CourtneyThurston/microsoft-internships', label: 'ANECDOTAL', note: 'Historical reports (phone book, doubly linked list, invert BST, clock angle, remove duplicates, reverse string, missing number). Not confirmed for the current cycle.' },
  { title: 'FastPrep — aggregated Microsoft Explore & student SWE experiences', url: 'https://www.fastprep.io/experience/microsoft-explore-and-student-swe-12-experiences-part-6-of-6-1t6v0p8cg8', label: 'ANECDOTAL', note: 'Aggregated reports; only some are Explore. Source of the digit-grouping problem shape used here as a reconstruction.' },
];

export const disclaimers = [
  'LeetCode company tags are Microsoft-wide, not a confirmed Explore-only question bank.',
  'Interview formats vary by team and interviewer; nothing here guarantees specific questions or a fixed round structure.',
  'Priorities (P0/P1/P2) are study recommendations from your plan, not verified interview-frequency data.',
  'The digit-permutation grouping exercise is a reconstruction of a candidate report, not an official question.',
  'ColorStack and GitHub reports are anecdotal; the Canva OOP exercise lists every requirement the app had to infer because the source screenshot was partly obscured.',
];
