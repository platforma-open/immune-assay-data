---
"@platforma-open/milaboratories.immune-assay-data.workflow": minor
"@platforma-open/milaboratories.immune-assay-data.model": minor
"@platforma-open/milaboratories.immune-assay-data.ui": minor
"@platforma-open/milaboratories.immune-assay-data": minor
---

Accept peptide datasets alongside VDJ clonotypes; rename to "Sequence Assay Data".

The block now discovers peptide-extraction anchors (`pl7.app/variantKey`) in addition to bulk and single-cell VDJ; target-column selection branches on the dataset axis. A new retentive `modality` model output exposes `'peptide' | 'antibody_tcr'` derived from the dataset spec. The UI applies modality-aware threshold defaults — antibody/TCR keeps the previous BLOSUM defaults (`alignment-score / 0.9 / 0.95`); peptide flips to exact-match (`sequence-identity / 1.0 / 1.0`). Switching between datasets of the same modality preserves user-tuned thresholds; legacy projects' tuning is preserved via `lastAppliedModality: 'antibody_tcr'` in `upgradeLegacy`.

Block-emitted column and axis names are now modality-neutral — `pl7.app/assay-data/*`, `pl7.app/assay/queryCount`, `pl7.app/sequence` (assay sequence), `pl7.app/assay/sequenceId`, `pl7.app/assay/sequenceIdLabel`, `pl7.app/link`. The `assay/` and `assay-data/` sub-namespaces remain; modality is recovered by consumers from the natural input axis on each column. Downstream blocks consuming via axis-anchored queries are unaffected.

Short-peptide k-mer override: when the shortest input peptide is below 10 aa, the MMseqs2 prefilter is reconfigured for short sequences (`-k 5 --spaced-kmer-mode 0 --min-ungapped-score 0 -s 7.5 -e inf`). The spec called only for `-k 5`; the additional flags were required empirically to make sub-7-aa exact matches actually return hits — defaults silently filter them. Mirrors clonotype-clustering's `highPrecision` short-CDR mode. The override takes precedence over Fast mode's hardcoded `-k 7`.

Block catalog name changes from "Immune Assay Data" to "Sequence Assay Data"; `block.meta.tags` gains `peptide`; description and long-form docs rewritten to be modality-neutral. The block ID, npm package name, and directory remain `immune-assay-data` — technical identifiers unchanged.

UI: `isAssayColumn` and `isSequenceColumn` predicates updated for neutral names and the peptide variant axis; `isSequenceColumn` now reads both VDJ-namespaced and neutral `isAssemblingFeature` annotations so peptide aa columns are default-selected in the MSA dialog. Empty-state alert, target-dropdown label/tooltip, and coverage-threshold tooltip rewritten to drop VDJ flavor.
