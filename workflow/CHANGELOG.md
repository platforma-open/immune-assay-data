# @platforma-open/milaboratories.immune-assay-data.workflow

## 1.14.1

### Patch Changes

- 2036371: Migrate onto the block-tools structurer (tool-managed layout: oxlint/oxfmt,
  ts-builder, regenerated configs) and bump the SDK to latest (model/ui-vue
  1.79.14, workflow-tengo 6.6.3, tengo-builder 4.0.8). No block behavior change —
  the model was already on BlockModelV3.
- Updated dependencies [2036371]
  - @platforma-open/milaboratories.immune-assay-data.add-header@1.1.4
  - @platforma-open/milaboratories.immune-assay-data.check-content-empty@1.0.2
  - @platforma-open/milaboratories.immune-assay-data.coverage-mode-calc@1.3.1
  - @platforma-open/milaboratories.immune-assay-data.fasta-to-tsv@1.1.4
  - @platforma-open/milaboratories.immune-assay-data.merge-results@1.1.1
  - @platforma-open/milaboratories.immune-assay-data.prepare-fasta@1.1.4
  - @platforma-open/milaboratories.immune-assay-data.sequence-match@1.1.1
  - @platforma-open/milaboratories.immune-assay-data.split-fasta@1.2.1
  - @platforma-open/milaboratories.immune-assay-data.xlsx-to-csv@1.1.1

## 1.14.0

### Minor Changes

- cd67e1a: Add "Sequence Match" matching mode — a recall-guaranteed, alignment-free match that reports every target containing an assay sequence as an exact substring (the deterministic equivalent of an MMseqs2 id=1/cov=1 search). Implemented in a new `sequence-match` Python software package using polars' Aho-Corasick scan. Exposed via a top-level "Matching mode" control (Alignment vs Sequence Match); Sequence Match hides the MMseqs2-only controls and is gated to same-alphabet assay/target pairs.

### Patch Changes

- Updated dependencies [cd67e1a]
  - @platforma-open/milaboratories.immune-assay-data.sequence-match@1.1.0

## 1.13.1

### Patch Changes

- 2816b0f: Fix unstable CIDs from non-canonical Tengo map iteration in `extract-unique-values.tpl.tengo`.

## 1.13.0

### Minor Changes

- baeb04e: Accept peptide datasets alongside VDJ clonotypes; rename to "Sequence Assay Data".

  The block now discovers peptide-extraction anchors (`pl7.app/variantKey`) in addition to bulk and single-cell VDJ; target-column selection branches on the dataset axis. A new retentive `modality` model output exposes `'peptide' | 'antibody_tcr'` derived from the dataset spec. The UI applies modality-aware threshold defaults — antibody/TCR keeps the previous BLOSUM defaults (`alignment-score / 0.9 / 0.95`); peptide flips to exact-match (`sequence-identity / 1.0 / 1.0`). Switching between datasets of the same modality preserves user-tuned thresholds; legacy projects' tuning is preserved via `lastAppliedModality: 'antibody_tcr'` in `upgradeLegacy`.

  Block-emitted column and axis names are now modality-neutral — `pl7.app/assay-data/*`, `pl7.app/assay/queryCount`, `pl7.app/sequence` (assay sequence), `pl7.app/assay/sequenceId`, `pl7.app/assay/sequenceIdLabel`, `pl7.app/link`. The `assay/` and `assay-data/` sub-namespaces remain; modality is recovered by consumers from the natural input axis on each column. Downstream blocks consuming via axis-anchored queries are unaffected.

  Short-peptide k-mer override: when the shortest input peptide is below 10 aa, the MMseqs2 prefilter is reconfigured for short sequences (`-k 5 --spaced-kmer-mode 0 --min-ungapped-score 0 -s 7.5 -e inf`). The spec called only for `-k 5`; the additional flags were required empirically to make sub-7-aa exact matches actually return hits — defaults silently filter them. Mirrors clonotype-clustering's `highPrecision` short-CDR mode. The override takes precedence over Fast mode's hardcoded `-k 7`.

  Block catalog name changes from "Immune Assay Data" to "Sequence Assay Data"; `block.meta.tags` gains `peptide`; description and long-form docs rewritten to be modality-neutral. The block ID, npm package name, and directory remain `immune-assay-data` — technical identifiers unchanged.

  UI: `isAssayColumn` and `isSequenceColumn` predicates updated for neutral names and the peptide variant axis; `isSequenceColumn` now reads both VDJ-namespaced and neutral `isAssemblingFeature` annotations so peptide aa columns are default-selected in the MSA dialog. Empty-state alert, target-dropdown label/tooltip, and coverage-threshold tooltip rewritten to drop VDJ flavor.

## 1.12.1

### Patch Changes

- Updated dependencies [2eff9dc]
  - @platforma-open/milaboratories.immune-assay-data.split-fasta@1.2.0

## 1.12.0

### Minor Changes

- 5f43c2b: Improved scalability for large datasets

### Patch Changes

- Updated dependencies [5f43c2b]
  - @platforma-open/milaboratories.immune-assay-data.coverage-mode-calc@1.3.0
  - @platforma-open/milaboratories.immune-assay-data.merge-results@1.1.0
  - @platforma-open/milaboratories.immune-assay-data.split-fasta@1.1.0

## 1.11.0

### Minor Changes

- ac74170: Improved performance on large datasets, eliminating disk and memory pressure

## 1.10.0

### Minor Changes

- 29a44a2: Improved performance on large datasets

## 1.9.0

### Minor Changes

- 4a7083b: Fix assay file import to support remote (non-local) files

  Previously, column detection used `lsDriver.getLocalFileContent()` which only works for locally-mounted files. Files from remote storages would silently fail, leaving the block unconfigurable.

  Now uses a prerun workflow step to import the file and expose it as a blob, and `ReactiveFileContent` in the UI to read it via `blobDriver` — the same pattern used by samples-and-data. This works for both local and remote files.

## 1.8.1

### Patch Changes

- 36ed105: Improve empty input detection
- Updated dependencies [36ed105]
  - @platforma-open/milaboratories.immune-assay-data.check-content-empty@1.0.1

## 1.8.0

### Minor Changes

- de02090: Allow deduplication and minor fixes

## 1.7.1

### Patch Changes

- cc7794e: Update mmseqs binary

## 1.7.0

### Minor Changes

- c98d8b5: - Introduce fast mode for sequence match
  - Support XLSX file as assay data input

### Patch Changes

- Updated dependencies [c98d8b5]
  - @platforma-open/milaboratories.immune-assay-data.coverage-mode-calc@1.2.0
  - @platforma-open/milaboratories.immune-assay-data.xlsx-to-csv@1.1.0

## 1.6.3

### Patch Changes

- 7b51d0b: Fix performance issue

## 1.6.2

### Patch Changes

- c903a35: Add MSA
- b85d0b1: Update SDK again
- f5ad6b1: Add MSA

## 1.6.1

### Patch Changes

- f10bacb: Labels migration

## 1.6.0

### Minor Changes

- a47580b: Support custom block title

## 1.5.1

### Patch Changes

- 35cde6e: Show running state for tables and graphs
- Updated dependencies [35cde6e]
  - @platforma-open/milaboratories.immune-assay-data.coverage-mode-calc@1.1.3
  - @platforma-open/milaboratories.immune-assay-data.prepare-fasta@1.1.3
  - @platforma-open/milaboratories.immune-assay-data.add-header@1.1.3
  - @platforma-open/milaboratories.immune-assay-data.fasta-to-tsv@1.1.3

## 1.5.0

### Minor Changes

- b21c35e: Add isDiscreteFilter and discreteValues annotation to string pcolumn export specs

## 1.4.3

### Patch Changes

- af2e338: Support parquet format (update SDK)

## 1.4.2

### Patch Changes

- 8e80807: technical release
- 6d5fccb: technical release
- 0017c0f: technical release
- 9b40999: technical release
- Updated dependencies [8e80807]
- Updated dependencies [6d5fccb]
- Updated dependencies [0017c0f]
- Updated dependencies [9b40999]
  - @platforma-open/milaboratories.immune-assay-data.add-header@1.1.2
  - @platforma-open/milaboratories.immune-assay-data.coverage-mode-calc@1.1.2
  - @platforma-open/milaboratories.immune-assay-data.fasta-to-tsv@1.1.2
  - @platforma-open/milaboratories.immune-assay-data.prepare-fasta@1.1.2

## 1.4.1

### Patch Changes

- Updated dependencies [2183585]
  - @platforma-open/milaboratories.immune-assay-data.coverage-mode-calc@1.1.1
  - @platforma-open/milaboratories.immune-assay-data.prepare-fasta@1.1.1
  - @platforma-open/milaboratories.immune-assay-data.fasta-to-tsv@1.1.1
  - @platforma-open/milaboratories.immune-assay-data.add-header@1.1.1

## 1.4.0

### Minor Changes

- 8e515a8: Support fasta file as assay data

### Patch Changes

- Updated dependencies [8e515a8]
  - @platforma-open/milaboratories.immune-assay-data.coverage-mode-calc@1.1.0
  - @platforma-open/milaboratories.immune-assay-data.prepare-fasta@1.1.0
  - @platforma-open/milaboratories.immune-assay-data.fasta-to-tsv@1.1.0
  - @platforma-open/milaboratories.immune-assay-data.add-header@1.1.0

## 1.3.0

### Minor Changes

- b18f925: Update trace label and importance

## 1.2.0

### Minor Changes

- bd219bf: Update SDK and bugfixes

## 1.1.0

### Minor Changes

- 40fd1d2: Updated matching parameters. Handle empty results (no matching clonotypes). Fixed logic for assay sequence column detection. Allow for assay column selection.

## 1.0.2

### Patch Changes

- 1566e7d: chore: update deps
- Updated dependencies [1566e7d]
  - @platforma-open/milaboratories.immune-assay-data.prepare-fasta@1.0.3
  - @platforma-open/milaboratories.immune-assay-data.add-header@1.0.2

## 1.0.1

### Patch Changes

- f59e17e: Initial release
- Updated dependencies [f59e17e]
  - @platforma-open/milaboratories.immune-assay-data.prepare-fasta@1.0.2
