'use client';

/**
 * Browser persistence for progress (localStorage), exposed through useSyncExternalStore.
 * Progress is validated on load and on every write; unreadable data is preserved, never overwritten.
 */
import { useEffect, useState, useSyncExternalStore } from 'react';
import { emptyProgress, normalizeProgress, parseProgress, type Progress } from './progress';
import { toDateKey } from './dates';

export const STORAGE_KEY = 'explore-prep-v1';

type Listener = () => void;
const listeners = new Set<Listener>();
const serverSnapshot = emptyProgress();
let progress: Progress = emptyProgress();
let initialized = false;
let corrupt = false;
let storageError: string | null = null;

function emit() {
  for (const l of listeners) l();
}

function describe(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown storage error';
}

function load() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      try {
        progress = parseProgress(raw);
      } catch (error) {
        corrupt = true;
        storageError = `Saved progress could not be read and was left untouched: ${describe(error)}`;
      }
    }
  } catch (error) {
    storageError = `Browser storage is unavailable; progress will last only for this session (${describe(error)}).`;
  }
}

function persist() {
  if (typeof window === 'undefined' || corrupt) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    storageError = null;
  } catch (error) {
    storageError = `Progress could not be saved to this browser: ${describe(error)}`;
  }
}

function subscribe(listener: Listener) {
  load();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useProgress(): Progress {
  useEffect(load, []);
  return useSyncExternalStore(subscribe, () => progress, () => serverSnapshot);
}

/** True once the client has read storage (avoids flashing "0 done" during hydration). */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

export function useStorageError(): string | null {
  return useSyncExternalStore(subscribe, () => storageError, () => null);
}

export function update(updater: (current: Progress) => Progress): void {
  load();
  try {
    progress = normalizeProgress(JSON.parse(JSON.stringify(updater(progress))));
    persist();
  } catch (error) {
    storageError = `Change not applied: ${describe(error)}`;
  }
  emit();
}

export function replaceProgress(next: unknown): { ok: true } | { ok: false; error: string } {
  try {
    progress = normalizeProgress(next);
    corrupt = false;
    persist();
    emit();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: describe(error) };
  }
}

export function exportProgress(): string {
  load();
  return JSON.stringify(progress, null, 2);
}

export function resetProgress(): void {
  progress = emptyProgress();
  corrupt = false;
  persist();
  emit();
}

/** The client's local date as YYYY-MM-DD; null during server render. Updates at midnight. */
export function useToday(): string | null {
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => setToday(toDateKey(new Date()));
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);
  return today;
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return;
    try {
      progress = event.newValue ? parseProgress(event.newValue) : emptyProgress();
      corrupt = false;
      storageError = null;
    } catch (error) {
      corrupt = true;
      storageError = `Progress changed in another tab but could not be read: ${describe(error)}`;
    }
    emit();
  });
}
