import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { allLessons } from '@/content/modules';
import { drills } from '@/content/drills';
import { blindItems } from '@/content/blind';
import { oopChallenges } from '@/content/oop-challenges';
import { codeReadings } from '@/content/code-reading';

const python = spawnSync('python3', ['--version']).status === 0 ? 'python3' : null;

function run(code: string): { status: number | null; stderr: string } {
  const dir = mkdtempSync(join(tmpdir(), 'explore-py-'));
  const file = join(dir, 'sample.py');
  writeFileSync(file, code);
  const result = spawnSync(python!, ['-I', '-W', 'error::SyntaxWarning', file], { encoding: 'utf8', timeout: 20_000 });
  rmSync(dir, { recursive: true, force: true });
  return { status: result.status, stderr: result.stderr };
}

describe.skipIf(!python)('every lesson Python sample runs and its asserts pass', () => {
  for (const { key, lesson } of allLessons) {
    it(key, () => {
      const result = run(lesson.code);
      expect(result.stderr).toBe('');
      expect(result.status).toBe(0);
    });
  }
});

describe.skipIf(!python)('every Big-O drill snippet is valid Python', () => {
  for (const drill of drills) {
    it(drill.id, () => {
      const result = run(`import ast\nast.parse(${JSON.stringify(drill.code)})\n`);
      expect(result.stderr).toBe('');
      expect(result.status).toBe(0);
    });
  }
});

describe.skipIf(!python)('every blind-assessment reference solution passes its asserts', () => {
  for (const b of blindItems) {
    it(b.id, () => {
      const result = run(b.answer.solution);
      expect(result.stderr).toBe('');
      expect(result.status).toBe(0);
    });
  }
});

describe.skipIf(!python)('every OOP challenge: reference solution passes, starter is valid Python', () => {
  for (const c of oopChallenges) {
    it(`${c.id} solution`, () => {
      const result = run(c.solution);
      expect(result.stderr).toBe('');
      expect(result.status).toBe(0);
    });
    it(`${c.id} starter`, () => {
      const result = run(c.starter);
      expect(result.stderr).toBe('');
      expect(result.status).toBe(0);
    });
  }
});

describe.skipIf(!python)('every code-reading snippet behaves as its model answer claims', () => {
  for (const r of codeReadings) {
    it(r.id, () => {
      const result = run(r.code);
      expect(result.stderr).toBe('');
      expect(result.status).toBe(0);
    });
  }
});
