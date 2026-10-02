---
"@platforma-open/milaboratories.immune-assay-data.workflow": minor
"@platforma-open/milaboratories.immune-assay-data.model": minor
"@platforma-open/milaboratories.immune-assay-data.kind": minor
"@platforma-open/milaboratories.immune-assay-data.ui": minor
"@platforma-open/milaboratories.immune-assay-data": minor
---

Support dataset filters from Repertoire Labeling and other subset columns

- The dataset can now be narrowed by one of its subset columns (for example a Repertoire Labeling label or a Lead Selection pick): only the subset's clonotypes are matched against the assay.
- The dataset filter is part of the block's template parameters, so a template made from a filtered block reproduces the filtered run.
- Outputs computed on a subset carry the subset's column id in `pl7.app/inputSubset`, and their trace starts from the filter, so labels name the subset.
- On peptide data, the short-peptide k-mer override is decided from the subset's peptides only.
- The clone and unique-value tables no longer pin memory and CPU: the step sizes itself from its input.
