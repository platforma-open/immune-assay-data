# @platforma-open/milaboratories.immune-assay-data.model

## 1.11.0

### Minor Changes

- 1496183: Treat imported receptor sets as receptors, not as peptides

  `import-vdj-data` emits bare imported sets — amino-acid variable domains with no gene calls and
  no counts — on `pl7.app/variantKey`, the axis peptide-extraction already uses. The block read
  that axis NAME as "peptide" in three places, so such a dataset could be selected and then went
  nowhere:

  - **The sequence-column picker was empty.** For `variantKey` the block installed the peptide
    matcher (`pl7.app/sequence` + `pl7.app/feature: peptide`), which matches nothing an imported
    set emits. `targetRef` is required, so Run never enabled.
  - **The workflow would have panicked** the moment the picker was fixed: the same test required
    a `pl7.app/sequenceLength` column that an imported set does not carry, and the run died on
    `"Peptide input is missing required pl7.app/sequenceLength column"` — naming a column the
    scientist never chose. Downstream of that flag, the short-peptide k-mer override (k=5,
    relaxed prefilter) would have been applied to ~120 aa variable domains.
  - **The UI applied peptide thresholds** — sequence-identity at 1.0/1.0 rather than
    alignment-score at 0.9/0.95 — and the outputs were labelled "Matched Peptides" and
    "Peptide to assay link".

  The question is now asked of the axis DOMAIN, which is the only thing that separates the three
  producers sharing that axis: `pl7.app/peptide/extractionRunId` is peptide-extraction,
  `pl7.app/repertoire/extractionRunId` is synthetic-repertoire-profiler, and
  `pl7.app/vdj/clonotypingRunId` is an imported receptor set. Peptide behaviour is unchanged.

  The workflow's copy lives in a new `modality.lib.tengo` shared by `main` and `build-outputs`,
  which previously tested the axis independently — a disagreement between them would have sent a
  dataset down the peptide alignment path while labelling its outputs as clones.

  Paired imported sets take the per-chain matcher. Legacy MiXCR single-cell declares pairing on
  the axis name; an imported set declares it only in the `pl7.app/vdj/scClonotypeChain` column
  domain, so the block probes for such a column instead of trusting the axis. A single-chain
  imported set is bulk-shaped and takes the unfiltered matcher, as bulk MiXCR does.

  The scFv probe is now skipped for peptides rather than for `variantKey`, so it reaches imported
  sets. They carry no scFv column today, so nothing is offered — the guard just stops being wrong
  about why.

## 1.10.5

### Patch Changes

- 52688ec: Offer scFv construct sequences as a match target

  Datasets from scFv clonotyping expose the whole VH-linker-VL construct as a
  single `pl7.app/vdj/scFv-sequence` column alongside the per-chain sequence
  columns. It is now listed in "Sequence column to match", so an assay table
  carrying full construct sequences can be matched directly instead of against a
  single chain. Datasets without such columns are unaffected.

  SDK Update

## 1.10.4

### Patch Changes

- ec0c7d6: Allow to configure mmseqs2 --max-seqs parameter to improve recall results

## 1.10.3

### Patch Changes

- ac20364: Bump everything to fix docker image

## 1.10.2

### Patch Changes

- d2b5924: Fix the per-row "Open" button showing "Please select at least one sequence
  column and two or more rows to run alignment" instead of the alignment view.
  Bumping the multiple sequence alignment component to 1.47.18 pulls the fix where
  a linker-based row selection expands to all clonotypes matched to the assay
  sequence instead of collapsing to no rows. Also bumps the rest of the SDK and
  visualization libraries to latest.

## 1.10.1

### Patch Changes

- 2036371: Migrate onto the block-tools structurer (tool-managed layout: oxlint/oxfmt,
  ts-builder, regenerated configs) and bump the SDK to latest (model/ui-vue
  1.79.14, workflow-tengo 6.6.3, tengo-builder 4.0.8). No block behavior change —
  the model was already on BlockModelV3.

## 1.10.0

### Minor Changes

- cd67e1a: Add "Sequence Match" matching mode — a recall-guaranteed, alignment-free match that reports every target containing an assay sequence as an exact substring (the deterministic equivalent of an MMseqs2 id=1/cov=1 search). Implemented in a new `sequence-match` Python software package using polars' Aho-Corasick scan. Exposed via a top-level "Matching mode" control (Alignment vs Sequence Match); Sequence Match hides the MMseqs2-only controls and is gated to same-alphabet assay/target pairs.

## 1.9.0

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

## 1.8.0

### Minor Changes

- 4a7083b: Fix assay file import to support remote (non-local) files

  Previously, column detection used `lsDriver.getLocalFileContent()` which only works for locally-mounted files. Files from remote storages would silently fail, leaving the block unconfigurable.

  Now uses a prerun workflow step to import the file and expose it as a blob, and `ReactiveFileContent` in the UI to read it via `blobDriver` — the same pattern used by samples-and-data. This works for both local and remote files.

## 1.7.0

### Minor Changes

- de02090: Allow deduplication and minor fixes

## 1.6.0

### Minor Changes

- c98d8b5: - Introduce fast mode for sequence match
  - Support XLSX file as assay data input

## 1.5.4

### Patch Changes

- 7b51d0b: Fix performance issue

## 1.5.3

### Patch Changes

- 59c14ff: Set default block label, use sdk strings for status messages

## 1.5.2

### Patch Changes

- c903a35: Add MSA
- b85d0b1: Update SDK again
- f5ad6b1: Add MSA

## 1.5.1

### Patch Changes

- f10bacb: Labels migration

## 1.5.0

### Minor Changes

- a47580b: Support custom block title

## 1.4.3

### Patch Changes

- 35cde6e: Show running state for tables and graphs

## 1.4.2

### Patch Changes

- 8e80807: technical release
- 6d5fccb: technical release
- 0017c0f: technical release
- 9b40999: technical release

## 1.4.1

### Patch Changes

- 2183585: Full SDK update

## 1.4.0

### Minor Changes

- 7cc0824: downgrade dependencies

## 1.3.0

### Minor Changes

- be23254: Expanded clonotype sequence options to match.

## 1.2.0

### Minor Changes

- bd219bf: Update SDK and bugfixes

## 1.1.0

### Minor Changes

- 40fd1d2: Updated matching parameters. Handle empty results (no matching clonotypes). Fixed logic for assay sequence column detection. Allow for assay column selection.

## 1.0.1

### Patch Changes

- f59e17e: Initial release
