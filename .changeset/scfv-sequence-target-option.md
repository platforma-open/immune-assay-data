---
'@platforma-open/milaboratories.immune-assay-data.workflow': patch
'@platforma-open/milaboratories.immune-assay-data.ui': patch
'@platforma-open/milaboratories.immune-assay-data.add-header': patch
'@platforma-open/milaboratories.immune-assay-data.check-content-empty': patch
'@platforma-open/milaboratories.immune-assay-data.coverage-mode-calc': patch
'@platforma-open/milaboratories.immune-assay-data.fasta-to-tsv': patch
'@platforma-open/milaboratories.immune-assay-data.merge-results': patch
'@platforma-open/milaboratories.immune-assay-data.prepare-fasta': patch
'@platforma-open/milaboratories.immune-assay-data.sequence-match': patch
'@platforma-open/milaboratories.immune-assay-data.split-fasta': patch
'@platforma-open/milaboratories.immune-assay-data.xlsx-to-csv': patch
'@platforma-open/milaboratories.immune-assay-data.model': patch
'@platforma-open/milaboratories.immune-assay-data': patch
---

Offer scFv construct sequences as a match target

Datasets from scFv clonotyping expose the whole VH-linker-VL construct as a
single `pl7.app/vdj/scFv-sequence` column alongside the per-chain sequence
columns. It is now listed in "Sequence column to match", so an assay table
carrying full construct sequences can be matched directly instead of against a
single chain. Datasets without such columns are unaffected.

SDK Update
