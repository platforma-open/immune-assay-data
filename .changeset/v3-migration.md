---
"@platforma-open/milaboratories.immune-assay-data.model": minor
"@platforma-open/milaboratories.immune-assay-data.ui": minor
"@platforma-open/milaboratories.immune-assay-data": minor
---

Migrate block to BlockModelV3. Unified `BlockData` (UI-shaped persistence); `.args` lambda derives the workflow-visible shape and validates by throw; `.prerunArgs` projects `fileHandle` for the file-import prerun. Persisted V1 state preserved via `DataModelBuilder.upgradeLegacy`. UI bindings move to `app.model.data`; `defineApp` → `defineAppV3`.

`defaultBlockLabel` is no longer stored: the args lambda and the subtitle derive it inline from `data.fileHandle + data.settings` (via the pure `getFileNameFromHandle`). The `syncDefaultBlockLabel` output→args watcher is removed.

The file-bytes watcher in `MainPage.vue` is preserved with a comment: it remains an `outputs → data` write, but the parsing function is deterministic on the input bytes, so multi-client writes are idempotent.
