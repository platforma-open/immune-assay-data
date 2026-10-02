# @platforma-open/milaboratories.immune-assay-data.kind

## 1.2.0

### Minor Changes

- 6ca6a1a: Support dataset filters from Repertoire Labeling and other subset columns

  - The dataset can now be narrowed by one of its subset columns (for example a Repertoire Labeling label or a Lead Selection pick): only the subset's clonotypes are matched against the assay.
  - The dataset filter is part of the block's template parameters, so a template made from a filtered block reproduces the filtered run.
  - Outputs computed on a subset carry the subset's column id in `pl7.app/inputSubset`, and their trace starts from the filter, so labels name the subset.
  - On peptide data, the short-peptide k-mer override is decided from the subset's peptides only.
  - The clone and unique-value tables no longer pin memory and CPU: the step sizes itself from its input.

## 1.1.2

### Patch Changes

- 1465cbb: Accept synthetic-repertoire-profiler datasets

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

## 1.1.1

### Patch Changes

- d352b0b: Bump the kind version alongside the widened column-id check. A kind version's content is immutable in the registry: republishing the same version with a different `sourceHash` hard-fails and takes the whole block publish with it.

## 1.1.0

### Minor Changes

- 3ced003: Fix trace gap
