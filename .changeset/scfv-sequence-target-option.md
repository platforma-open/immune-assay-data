---
'@platforma-open/milaboratories.immune-assay-data.model': minor
'@platforma-open/milaboratories.immune-assay-data': minor
---

Offer scFv construct sequences as a match target

Datasets from scFv clonotyping expose the whole VH-linker-VL construct as a
single `pl7.app/vdj/scFv-sequence` column alongside the per-chain sequence
columns. It is now listed in "Sequence column to match", so an assay table
carrying full construct sequences can be matched directly instead of against a
single chain. Datasets without such columns are unaffected.
