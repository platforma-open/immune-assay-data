---
"@platforma-open/milaboratories.immune-assay-data.model": patch
"@platforma-open/milaboratories.immune-assay-data": patch
---

Fix an empty "Sequence column to match" dropdown for bulk datasets. The probe that decides
whether a dataset is paired searched the whole result pool for a `pl7.app/vdj/sequence`
column with `pl7.app/vdj/scClonotypeChain/index: "primary"`. In a project with a single-cell
MiXCR block, the probe matched that block's columns and marked every bulk dataset as paired.
The paired matcher then found no sequence column on the bulk `clonotypeKey` axis, so
`targetOptions` was empty and Run stayed disabled. The probe and the scFv probe are now
scoped to the dataset's clonotype axis, in the same way as the matchers that follow them.
