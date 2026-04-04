# @platforma-open/milaboratories.immune-assay-data.workflow

## 1.11.0

### Minor Changes

- ac74170: Improved performance on large datasets, eliminating disk and memory pressure

## 1.10.0

### Minor Changes

- 29a44a2: Improved performance on large datasets

## 1.9.0

### Minor Changes

- 4a7083b: Fix assay file import to support remote (non-local) files

  Previously, column detection used `lsDriver.getLocalFileContent()` which only works for locally-mounted files. Files from remote storages would silently fail, leaving the block unconfigurable.

  Now uses a prerun workflow step to import the file and expose it as a blob, and `ReactiveFileContent` in the UI to read it via `blobDriver` — the same pattern used by samples-and-data. This works for both local and remote files.

## 1.8.1

### Patch Changes

- 36ed105: Improve empty input detection
- Updated dependencies [36ed105]
  - @platforma-open/milaboratories.immune-assay-data.check-content-empty@1.0.1

## 1.8.0

### Minor Changes

- de02090: Allow deduplication and minor fixes

## 1.7.1

### Patch Changes

- cc7794e: Update mmseqs binary

## 1.7.0

### Minor Changes

- c98d8b5: - Introduce fast mode for sequence match
  - Support XLSX file as assay data input

### Patch Changes

- Updated dependencies [c98d8b5]
  - @platforma-open/milaboratories.immune-assay-data.coverage-mode-calc@1.2.0
  - @platforma-open/milaboratories.immune-assay-data.xlsx-to-csv@1.1.0

## 1.6.3

### Patch Changes

- 7b51d0b: Fix performance issue

## 1.6.2

### Patch Changes

- c903a35: Add MSA
- b85d0b1: Update SDK again
- f5ad6b1: Add MSA

## 1.6.1

### Patch Changes

- f10bacb: Labels migration

## 1.6.0

### Minor Changes

- a47580b: Support custom block title

## 1.5.1

### Patch Changes

- 35cde6e: Show running state for tables and graphs
- Updated dependencies [35cde6e]
  - @platforma-open/milaboratories.immune-assay-data.coverage-mode-calc@1.1.3
  - @platforma-open/milaboratories.immune-assay-data.prepare-fasta@1.1.3
  - @platforma-open/milaboratories.immune-assay-data.add-header@1.1.3
  - @platforma-open/milaboratories.immune-assay-data.fasta-to-tsv@1.1.3

## 1.5.0

### Minor Changes

- b21c35e: Add isDiscreteFilter and discreteValues annotation to string pcolumn export specs

## 1.4.3

### Patch Changes

- af2e338: Support parquet format (update SDK)

## 1.4.2

### Patch Changes

- 8e80807: technical release
- 6d5fccb: technical release
- 0017c0f: technical release
- 9b40999: technical release
- Updated dependencies [8e80807]
- Updated dependencies [6d5fccb]
- Updated dependencies [0017c0f]
- Updated dependencies [9b40999]
  - @platforma-open/milaboratories.immune-assay-data.add-header@1.1.2
  - @platforma-open/milaboratories.immune-assay-data.coverage-mode-calc@1.1.2
  - @platforma-open/milaboratories.immune-assay-data.fasta-to-tsv@1.1.2
  - @platforma-open/milaboratories.immune-assay-data.prepare-fasta@1.1.2

## 1.4.1

### Patch Changes

- Updated dependencies [2183585]
  - @platforma-open/milaboratories.immune-assay-data.coverage-mode-calc@1.1.1
  - @platforma-open/milaboratories.immune-assay-data.prepare-fasta@1.1.1
  - @platforma-open/milaboratories.immune-assay-data.fasta-to-tsv@1.1.1
  - @platforma-open/milaboratories.immune-assay-data.add-header@1.1.1

## 1.4.0

### Minor Changes

- 8e515a8: Support fasta file as assay data

### Patch Changes

- Updated dependencies [8e515a8]
  - @platforma-open/milaboratories.immune-assay-data.coverage-mode-calc@1.1.0
  - @platforma-open/milaboratories.immune-assay-data.prepare-fasta@1.1.0
  - @platforma-open/milaboratories.immune-assay-data.fasta-to-tsv@1.1.0
  - @platforma-open/milaboratories.immune-assay-data.add-header@1.1.0

## 1.3.0

### Minor Changes

- b18f925: Update trace label and importance

## 1.2.0

### Minor Changes

- bd219bf: Update SDK and bugfixes

## 1.1.0

### Minor Changes

- 40fd1d2: Updated matching parameters. Handle empty results (no matching clonotypes). Fixed logic for assay sequence column detection. Allow for assay column selection.

## 1.0.2

### Patch Changes

- 1566e7d: chore: update deps
- Updated dependencies [1566e7d]
  - @platforma-open/milaboratories.immune-assay-data.prepare-fasta@1.0.3
  - @platforma-open/milaboratories.immune-assay-data.add-header@1.0.2

## 1.0.1

### Patch Changes

- f59e17e: Initial release
- Updated dependencies [f59e17e]
  - @platforma-open/milaboratories.immune-assay-data.prepare-fasta@1.0.2
