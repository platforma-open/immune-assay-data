# @platforma-open/milaboratories.immune-assay-data

## 1.4.0

### Minor Changes

- baeb04e: Accept peptide datasets alongside VDJ clonotypes; rename to "Sequence Assay Data".

  The block now discovers peptide-extraction anchors (`pl7.app/variantKey`) in addition to bulk and single-cell VDJ; target-column selection branches on the dataset axis. A new retentive `modality` model output exposes `'peptide' | 'antibody_tcr'` derived from the dataset spec. The UI applies modality-aware threshold defaults — antibody/TCR keeps the previous BLOSUM defaults (`alignment-score / 0.9 / 0.95`); peptide flips to exact-match (`sequence-identity / 1.0 / 1.0`). Switching between datasets of the same modality preserves user-tuned thresholds; legacy projects' tuning is preserved via `lastAppliedModality: 'antibody_tcr'` in `upgradeLegacy`.

  Block-emitted column and axis names are now modality-neutral — `pl7.app/assay-data/*`, `pl7.app/assay/queryCount`, `pl7.app/sequence` (assay sequence), `pl7.app/assay/sequenceId`, `pl7.app/assay/sequenceIdLabel`, `pl7.app/link`. The `assay/` and `assay-data/` sub-namespaces remain; modality is recovered by consumers from the natural input axis on each column. Downstream blocks consuming via axis-anchored queries are unaffected.

  Short-peptide k-mer override: when the shortest input peptide is below 10 aa, the MMseqs2 prefilter is reconfigured for short sequences (`-k 5 --spaced-kmer-mode 0 --min-ungapped-score 0 -s 7.5 -e inf`). The spec called only for `-k 5`; the additional flags were required empirically to make sub-7-aa exact matches actually return hits — defaults silently filter them. Mirrors clonotype-clustering's `highPrecision` short-CDR mode. The override takes precedence over Fast mode's hardcoded `-k 7`.

  Block catalog name changes from "Immune Assay Data" to "Sequence Assay Data"; `block.meta.tags` gains `peptide`; description and long-form docs rewritten to be modality-neutral. The block ID, npm package name, and directory remain `immune-assay-data` — technical identifiers unchanged.

  UI: `isAssayColumn` and `isSequenceColumn` predicates updated for neutral names and the peptide variant axis; `isSequenceColumn` now reads both VDJ-namespaced and neutral `isAssemblingFeature` annotations so peptide aa columns are default-selected in the MSA dialog. Empty-state alert, target-dropdown label/tooltip, and coverage-threshold tooltip rewritten to drop VDJ flavor.

- fab9f9c: Migrate block to BlockModelV3. Unified `BlockData` (UI-shaped persistence); `.args` lambda derives the workflow-visible shape and validates by throw; `.prerunArgs` projects `fileHandle` for the file-import prerun. Persisted V1 state preserved via `DataModelBuilder.upgradeLegacy`. UI bindings move to `app.model.data`; `defineApp` → `defineAppV3`.

  `defaultBlockLabel` is no longer stored: the args lambda and the subtitle derive it inline from `data.fileHandle + data.settings` (via the pure `getFileNameFromHandle`). The `syncDefaultBlockLabel` output→args watcher is removed.

  The file-bytes watcher in `MainPage.vue` is preserved with a comment: it remains an `outputs → data` write, but the parsing function is deterministic on the input bytes, so multi-client writes are idempotent.

### Patch Changes

- Updated dependencies [baeb04e]
- Updated dependencies [fab9f9c]
  - @platforma-open/milaboratories.immune-assay-data.workflow@1.13.0
  - @platforma-open/milaboratories.immune-assay-data.model@1.9.0
  - @platforma-open/milaboratories.immune-assay-data.ui@1.8.0

## 1.3.6

### Patch Changes

- 9608716: Update ts-builder version (for opportunity to build block on Windows), add supported platforms (block is not available on Windows Built-In)

## 1.3.5

### Patch Changes

- @platforma-open/milaboratories.immune-assay-data.workflow@1.12.1

## 1.3.4

### Patch Changes

- Updated dependencies [5f43c2b]
  - @platforma-open/milaboratories.immune-assay-data.workflow@1.12.0

## 1.3.3

### Patch Changes

- Updated dependencies [ac74170]
  - @platforma-open/milaboratories.immune-assay-data.workflow@1.11.0

## 1.3.2

### Patch Changes

- Updated dependencies [29a44a2]
  - @platforma-open/milaboratories.immune-assay-data.workflow@1.10.0

## 1.3.1

### Patch Changes

- Updated dependencies [002abd6]
  - @platforma-open/milaboratories.immune-assay-data.ui@1.7.1

## 1.3.0

### Minor Changes

- 4a7083b: Fix assay file import to support remote (non-local) files

  Previously, column detection used `lsDriver.getLocalFileContent()` which only works for locally-mounted files. Files from remote storages would silently fail, leaving the block unconfigurable.

  Now uses a prerun workflow step to import the file and expose it as a blob, and `ReactiveFileContent` in the UI to read it via `blobDriver` — the same pattern used by samples-and-data. This works for both local and remote files.

### Patch Changes

- Updated dependencies [4a7083b]
  - @platforma-open/milaboratories.immune-assay-data.workflow@1.9.0
  - @platforma-open/milaboratories.immune-assay-data.model@1.8.0
  - @platforma-open/milaboratories.immune-assay-data.ui@1.7.0

## 1.2.23

### Patch Changes

- Updated dependencies [36ed105]
  - @platforma-open/milaboratories.immune-assay-data.workflow@1.8.1

## 1.2.22

### Patch Changes

- Updated dependencies [de02090]
  - @platforma-open/milaboratories.immune-assay-data.workflow@1.8.0
  - @platforma-open/milaboratories.immune-assay-data.model@1.7.0
  - @platforma-open/milaboratories.immune-assay-data.ui@1.6.0

## 1.2.21

### Patch Changes

- Updated dependencies [cc7794e]
  - @platforma-open/milaboratories.immune-assay-data.workflow@1.7.1

## 1.2.20

### Patch Changes

- Updated dependencies [c98d8b5]
  - @platforma-open/milaboratories.immune-assay-data.workflow@1.7.0
  - @platforma-open/milaboratories.immune-assay-data.model@1.6.0
  - @platforma-open/milaboratories.immune-assay-data.ui@1.5.0

## 1.2.19

### Patch Changes

- Updated dependencies [7b51d0b]
  - @platforma-open/milaboratories.immune-assay-data.workflow@1.6.3
  - @platforma-open/milaboratories.immune-assay-data.model@1.5.4
  - @platforma-open/milaboratories.immune-assay-data.ui@1.4.4

## 1.2.18

### Patch Changes

- Updated dependencies [59c14ff]
  - @platforma-open/milaboratories.immune-assay-data.model@1.5.3
  - @platforma-open/milaboratories.immune-assay-data.ui@1.4.3

## 1.2.17

### Patch Changes

- c903a35: Add MSA
- b85d0b1: Update SDK again
- Updated dependencies [c903a35]
- Updated dependencies [b85d0b1]
- Updated dependencies [f5ad6b1]
  - @platforma-open/milaboratories.immune-assay-data.workflow@1.6.2
  - @platforma-open/milaboratories.immune-assay-data.model@1.5.2
  - @platforma-open/milaboratories.immune-assay-data.ui@1.4.2

## 1.2.16

### Patch Changes

- Updated dependencies [f10bacb]
  - @platforma-open/milaboratories.immune-assay-data.workflow@1.6.1
  - @platforma-open/milaboratories.immune-assay-data.model@1.5.1
  - @platforma-open/milaboratories.immune-assay-data.ui@1.4.1

## 1.2.15

### Patch Changes

- Updated dependencies [a47580b]
  - @platforma-open/milaboratories.immune-assay-data.workflow@1.6.0
  - @platforma-open/milaboratories.immune-assay-data.model@1.5.0
  - @platforma-open/milaboratories.immune-assay-data.ui@1.4.0

## 1.2.14

### Patch Changes

- 35cde6e: Show running state for tables and graphs
- Updated dependencies [35cde6e]
  - @platforma-open/milaboratories.immune-assay-data.workflow@1.5.1
  - @platforma-open/milaboratories.immune-assay-data.model@1.4.3
  - @platforma-open/milaboratories.immune-assay-data.ui@1.3.4

## 1.2.13

### Patch Changes

- Updated dependencies [b21c35e]
  - @platforma-open/milaboratories.immune-assay-data.workflow@1.5.0

## 1.2.12

### Patch Changes

- 651b28b: Block metadata updated.

## 1.2.11

### Patch Changes

- 050153e: Update SDK

## 1.2.10

### Patch Changes

- Updated dependencies [f7fa342]
  - @platforma-open/milaboratories.immune-assay-data.ui@1.3.3

## 1.2.9

### Patch Changes

- Updated dependencies [af2e338]
  - @platforma-open/milaboratories.immune-assay-data.workflow@1.4.3

## 1.2.8

### Patch Changes

- 8e80807: technical release
- 6d5fccb: technical release
- 0017c0f: technical release
- 9b40999: technical release
- Updated dependencies [8e80807]
- Updated dependencies [6d5fccb]
- Updated dependencies [0017c0f]
- Updated dependencies [9b40999]
  - @platforma-open/milaboratories.immune-assay-data.model@1.4.2
  - @platforma-open/milaboratories.immune-assay-data.ui@1.3.2
  - @platforma-open/milaboratories.immune-assay-data.workflow@1.4.2

## 1.2.7

### Patch Changes

- Updated dependencies [2183585]
  - @platforma-open/milaboratories.immune-assay-data.model@1.4.1
  - @platforma-open/milaboratories.immune-assay-data.ui@1.3.1
  - @platforma-open/milaboratories.immune-assay-data.workflow@1.4.1

## 1.2.6

### Patch Changes

- Updated dependencies [8e515a8]
  - @platforma-open/milaboratories.immune-assay-data.workflow@1.4.0
  - @platforma-open/milaboratories.immune-assay-data.ui@1.3.0

## 1.2.5

### Patch Changes

- Updated dependencies [56a1047]
  - @platforma-open/milaboratories.immune-assay-data.ui@1.2.3

## 1.2.4

### Patch Changes

- Updated dependencies [b18f925]
  - @platforma-open/milaboratories.immune-assay-data.workflow@1.3.0

## 1.2.3

### Patch Changes

- Updated dependencies [7cc0824]
  - @platforma-open/milaboratories.immune-assay-data.model@1.4.0
  - @platforma-open/milaboratories.immune-assay-data.ui@1.2.2

## 1.2.2

### Patch Changes

- Updated dependencies [be23254]
  - @platforma-open/milaboratories.immune-assay-data.model@1.3.0
  - @platforma-open/milaboratories.immune-assay-data.ui@1.2.1

## 1.2.1

### Patch Changes

- Updated dependencies [bd219bf]
  - @platforma-open/milaboratories.immune-assay-data.workflow@1.2.0
  - @platforma-open/milaboratories.immune-assay-data.model@1.2.0
  - @platforma-open/milaboratories.immune-assay-data.ui@1.2.0

## 1.2.0

### Minor Changes

- e2e7ebe: Update dependencies

## 1.1.0

### Minor Changes

- 40fd1d2: Updated matching parameters. Handle empty results (no matching clonotypes). Fixed logic for assay sequence column detection. Allow for assay column selection.

### Patch Changes

- Updated dependencies [40fd1d2]
  - @platforma-open/milaboratories.immune-assay-data.workflow@1.1.0
  - @platforma-open/milaboratories.immune-assay-data.model@1.1.0
  - @platforma-open/milaboratories.immune-assay-data.ui@1.1.0

## 1.0.2

### Patch Changes

- Updated dependencies [1566e7d]
  - @platforma-open/milaboratories.immune-assay-data.workflow@1.0.2

## 1.0.1

### Patch Changes

- 3a3eb0a: Release v1
- Updated dependencies [f59e17e]
  - @platforma-open/milaboratories.immune-assay-data.workflow@1.0.1
  - @platforma-open/milaboratories.immune-assay-data.model@1.0.1
  - @platforma-open/milaboratories.immune-assay-data.ui@1.0.1
