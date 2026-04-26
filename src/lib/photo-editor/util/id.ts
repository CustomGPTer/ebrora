// src/lib/photo-editor/util/id.ts
//
// Collision-resistant ID generator for project objects.
// Uses crypto.randomUUID where available (modern browsers + Node 19+),
// falls back to Math.random for older runtimes.

export function newId(prefix = ""): string {
  let id: string;
  try {
    id = crypto.randomUUID();
  } catch {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
  return prefix ? `${prefix}_${id}` : id;
}
