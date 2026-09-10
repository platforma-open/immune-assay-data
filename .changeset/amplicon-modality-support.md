---
'@platforma-open/milaboratories.immune-assay-data.kind': patch
'@platforma-open/milaboratories.immune-assay-data.model': patch
'@platforma-open/milaboratories.immune-assay-data.workflow': patch
'@platforma-open/milaboratories.immune-assay-data': patch
---

Accept synthetic-repertoire-profiler datasets

A profiler dataset could be picked as the input, but its sequence dropdown stayed empty
("The selected dataset has no sequence columns"), and a run would have failed on a missing
`pl7.app/sequenceLength` column. Both blocks decided the input's modality from the
`pl7.app/variantKey` axis name, which several producers share, so a profiler dataset was
read as peptide and only peptide sequence columns were offered.

The block now reads the `pl7.app/modality` declaration the profiler stamps into that axis
domain, falling back to the per-producer run-id keys for producers that declare nothing.
A designed-library run is its own `amplicon` modality: its whole-variant and per-region
sequence columns are offered, matching runs with the antibody/TCR thresholds rather than
the short-peptide ones, and outputs are labelled variants. A profiler run that declares
itself `vdj` is treated as antibody/TCR data.
