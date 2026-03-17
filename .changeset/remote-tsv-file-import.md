---
'@platforma-open/milaboratories.immune-assay-data.workflow': minor
'@platforma-open/milaboratories.immune-assay-data.model': minor
'@platforma-open/milaboratories.immune-assay-data.ui': minor
'@platforma-open/milaboratories.immune-assay-data': minor
---

Fix assay file import to support remote (non-local) files

Previously, column detection used `lsDriver.getLocalFileContent()` which only works for locally-mounted files. Files from remote storages would silently fail, leaving the block unconfigurable.

Now uses a prerun workflow step to import the file and expose it as a blob, and `ReactiveFileContent` in the UI to read it via `blobDriver` — the same pattern used by samples-and-data. This works for both local and remote files.
