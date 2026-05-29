---
'@platforma-open/milaboratories.immune-assay-data.workflow': minor
'@platforma-open/milaboratories.immune-assay-data.model': minor
'@platforma-open/milaboratories.immune-assay-data.ui': minor
'@platforma-open/milaboratories.immune-assay-data': minor
---

Add "Identical sequences" matching mode — a recall-guaranteed exact (byte-identical) match that bypasses MMseqs2 alignment. Selectable in the Alignment Score dropdown; hides the MMseqs2-only controls (score/coverage thresholds, fast mode) and is gated to same-alphabet assay/target pairs.
