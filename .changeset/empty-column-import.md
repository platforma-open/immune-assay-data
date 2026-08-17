---
'@platforma-open/milaboratories.immune-assay-data.ui': patch
---

Handle empty columns in imported assay files: fully empty headerless columns are skipped, and a headerless column that contains data now produces a clear import error instead of crashing the workflow prerun with "invalid index type: undefined". The header-uniqueness check now applies to named columns only.
