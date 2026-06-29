---
'@platforma-open/milaboratories.immune-assay-data.ui': patch
'@platforma-open/milaboratories.immune-assay-data.model': patch
'@platforma-open/milaboratories.immune-assay-data.workflow': patch
---

Fix the per-row "Open" button showing "Please select at least one sequence
column and two or more rows to run alignment" instead of the alignment view.
Bumping the multiple sequence alignment component to 1.47.18 pulls the fix where
a linker-based row selection expands to all clonotypes matched to the assay
sequence instead of collapsing to no rows. Also bumps the rest of the SDK and
visualization libraries to latest.
