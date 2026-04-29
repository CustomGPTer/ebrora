// src/components/photo-editor/toolbar/BottomToolbar.tsx
//
// DEAD CODE — stubbed in Batch H.
//
// This file's original implementation was the desktop sidebar toolbar
// for the editor. It was superseded by the BottomDock pattern in
// Batch B and flagged for deletion at that time. The original
// implementation referenced ActivePanel union members (`format`,
// `stroke`, `highlight`, `shadow`, `color`, `position`) that have
// since been removed in D3 + H. Keeping the original file would
// potentially break Jon's TS build against the post-H ActivePanel
// union via TS2367 ("no overlap") on the now-impossible literal
// comparisons.
//
// The fix is to delete the file entirely via the GitHub web UI
// (zips can't represent deletions). This stub is a defensive cushion
// for the window between "Jon applies the H zip" and "Jon deletes
// this file in the GitHub UI" so the build doesn't break in between.
//
// No live code imports BottomToolbar — verified with
//   grep -rln 'import.*BottomToolbar' src/
// before stubbing.

export {};
