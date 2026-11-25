# Critical UX Refactor — Seven-Day Guided Microsoft Explore Bootcamp

> Stored verbatim as supplied by the learner on 2026-11-25. Day 1 = Nov 25, 2026 … Day 7 = Dec 1, 2026; interview Dec 2, 2026.
> Supersedes the 12-day calendar for Nov 25 onward. Study allocation and evidence rules from
> sources/scope-priority-correction.md and sources/colorstack-explore-research.md still apply.

The current platform has a significant usability problem: I have to manually navigate through different pages, search for lessons, locate problems and decide what to study next.

I only have approximately seven days before my Microsoft Explore interview. I cannot afford to waste time navigating the platform or planning my own curriculum every morning.

Refactor the application into a linear, structured, day-by-day guided interview preparation bootcamp.

## 1. Primary user experience

When I open the application, I should immediately see:

- Days remaining until my interview.
- My current study day.
- Today's learning objectives.
- Today's ordered study activities.
- Estimated completion time.
- Progress through the day.
- A prominent Continue Studying button.

The Continue Studying button must automatically take me to the next incomplete activity.

I should never need to search for a lesson, problem, exercise or review activity.

The application should tell me exactly what to do next.

## 2. Sequential learning engine

Every study day must contain a predefined, ordered sequence of learning activities.

Each activity must link directly to its actual content.

The general learning sequence should be:

1. Learn the concept.
2. Understand the vocabulary.
3. Understand the relevant Big-O complexity.
4. Study a visual execution walkthrough.
5. Learn how to recognize the pattern.
6. Complete a guided exercise.
7. Independently solve assigned LeetCode problems.
8. Review mistakes.
9. Complete practical OOP exercises where scheduled.
10. Complete a blind interview assessment.
11. Complete a short behavioral, architecture or product design exercise.
12. Complete end-of-day review.

Do not treat this sequence as twelve separate pages that I must manually locate.

Connect every activity using Previous, Complete & Continue, Skip for Now and Resume controls.

Completing one activity should automatically navigate to the next scheduled activity.

Support revisiting previous lessons without losing progress.

Save the exact activity I was completing so refreshing the browser or returning later resumes my position.

## 3. Seven-day curriculum

Reorganize the existing curriculum around the following schedule.

### Day 1 — Arrays, Strings and Hashing

Concepts:
- Python dictionaries and sets
- Frequency counting
- Array and string traversal
- Counter and defaultdict
- Time and space complexity

Priority problems:
- Two Sum
- Roman to Integer
- Contains Duplicate
- Valid Anagram
- Group Anagrams
- Reverse String

OOP:
- Classes and objects
- Constructors
- self
- Instance attributes and methods

Practical exercise:
- Implement a phone book.

Assessment:
- Unseen hashing or string problem.

### Day 2 — Two Pointers and Sliding Window

Concepts:
- Opposite-direction pointers
- Same-direction pointers
- Sorted array traversal
- Fixed-size windows
- Variable-size windows
- Maintaining window state

Priority problems:
- Valid Palindrome
- Move Zeroes
- Remove Duplicates from Sorted Array
- Two Sum II
- Best Time to Buy and Sell Stock
- Longest Substring Without Repeating Characters

OOP:
- Inheritance
- super()
- Composition

Practical exercise:
- Implement a library management system.

Assessment:
- Unseen array or string problem without pattern labels.

### Day 3 — Linked Lists, Stacks and Queues

Concepts:
- Nodes and object references
- Traversal
- Insertion and deletion
- Dummy nodes
- Fast and slow pointers
- LIFO and FIFO
- Python deque

Priority problems:
- Reverse Linked List
- Merge Two Sorted Lists
- Linked List Cycle
- Delete Node in a Linked List
- Valid Parentheses
- Implement Queue Using Stacks

OOP:
- Managing collections of objects
- Validation
- Object copying

Practical exercise:
- Simplified Canva implementation inspired by the reported ColorStack interview.

Assessment:
- Unseen linked list or stack problem.

### Day 4 — Recursion and Binary Trees

Teach recursion thoroughly because this is one of my weakest areas.

Concepts:
- Base cases
- Recursive cases
- Call stack
- Returning recursive results
- Recursive execution tracing
- Binary tree structure
- DFS
- BFS

Priority problems:
- Maximum Depth of Binary Tree
- Invert Binary Tree
- Same Tree
- Validate Binary Search Tree
- Binary Tree Level Order Traversal

Use visual call-stack walkthroughs and step-by-step execution examples.

Architecture preparation:
- Road Report high-level architecture and data flow.

Assessment:
- Unseen recursive or tree problem.

### Day 5 — Backtracking, Sorting and Binary Search

Concepts:
- Decision trees
- Choose, explore and undo
- Recursive state
- Sorting trade-offs
- Binary search boundaries

Priority problems:
- Subsets
- Permutations
- Binary Search
- Search Insert Position
- Missing Number

Secondary topics if time permits:
- Basic graph traversal
- Matrix traversal
- Basic dynamic programming

Architecture preparation:
- SpeakLab AI and ZBXP high-level architecture.

Product design:
- Test a pen.
- Design an accessible calculator.

Assessment:
- Unseen foundational coding question.

### Day 6 — Mixed Interview Simulation

Do not introduce significant new material.

Activities:
- Mixed blind Easy and Medium coding problems.
- One practical OOP challenge.
- Code comprehension.
- Complexity analysis.
- Edge-case identification.
- Behavioral questions.
- Product design questions.

Complete two simulated interview rounds.

Do not disclose the pattern, difficulty or source of coding questions before an attempt.

Generate a targeted review plan based on demonstrated weaknesses.

### Day 7 — Final Review and Retention

Do not introduce new advanced topics.

Activities:
- Reattempt previously failed problems.
- Review common algorithmic patterns.
- Review Python OOP fundamentals.
- Practice explaining time and space complexity.
- Review project architecture explanations.
- Review STAR stories.
- Complete one short confidence-building mock interview.

Keep the final day lighter to avoid exhaustion.

## 4. Intelligent problem scheduling

The problems listed above are priority candidates, not a requirement to complete every problem regardless of available time.

Audit my existing progress.

For problems I have already solved:
- Schedule short independent retention checks.
- Avoid unnecessarily repeating full introductory lessons.
- Reassign the problem if I cannot solve it independently.

For unfamiliar problems:
- Ensure the prerequisites have been taught.
- Provide independent attempt time.
- Offer progressive hints.
- Reveal solutions only when requested.

Separate daily activities into:
- Core: must prioritize.
- Reinforcement: complete if time permits.
- Stretch: optional.

If I fall behind, automatically deprioritize stretch activities instead of creating an impossible workload the next day.

## 5. Activity page structure

Every activity page should have a consistent layout:

Top navigation:
- Day number.
- Activity number.
- Daily progress bar.
- Estimated duration.

Main content:
- The actual lesson, exercise or problem.
- Relevant visual explanations.
- Runnable Python examples where appropriate.
- Direct LeetCode link for assigned problems.
- Hints and explanations when appropriate.

Bottom navigation:
- Previous.
- Skip for Now.
- Complete & Continue.

The next activity should be precomputed and immediately accessible.

Opening an external LeetCode problem should not break my position in the study flow.

## 6. Daily study priorities

Maintain approximately:

- 65% algorithms, LeetCode, blind coding assessments and mistake review.
- 15% Python OOP and practical implementation.
- 10% behavioral and product design.
- 5% résumé and high-level architecture.
- 5% technical vocabulary and code comprehension.

Target approximately eight productive study hours on full study days, with configurable availability.

Reduce the workload on the final day.

Do not artificially inflate the schedule to fill time.

## 7. Dashboard redesign

Make the guided curriculum the primary interface.

The dashboard should display seven day cards with:
- Day title.
- Primary topics.
- Completion percentage.
- Estimated workload.
- Current status.
- Start or Continue button.

The current day should be prominently featured.

Keep existing standalone resource pages accessible through a secondary Reference Library navigation area.

Do not force me to use the reference library to complete scheduled activities.

## 8. Completion and retention

Distinguish between:
- Read a lesson.
- Attempted a problem.
- Solved with assistance.
- Solved independently.
- Demonstrated retention.

Do not mark a problem as mastered merely because I viewed its solution.

Use previous mistakes to populate short daily review activities automatically.

## 9. Implementation requirements

Inspect and reuse the existing application architecture.

Preserve:
- Completed lessons.
- Previously solved problems.
- Notes.
- Existing progress.
- Question source classifications.
- Existing educational content.
- Visual design system.

Do not rebuild the entire application.

Prioritize navigation, curriculum sequencing and learning effectiveness over additional features.

Test the entire seven-day experience from start to finish.

Verify that every scheduled activity links to real content, every Continue button works, progress persists and no activity requires manually searching for resources.

Add regression tests for the sequential navigation engine.

Run the existing tests, linting and type checking.

Implement the changes, verify them and commit the result.

## Final acceptance criterion

I should be able to open the platform on any study day, press Continue Studying and complete my entire preparation session by repeatedly pressing Complete & Continue.

I should never have to ask what to study next.

The platform is my instructor, curriculum planner and interview practice environment, not simply a collection of study materials.
