# @platforma-open/milaboratories.immune-assay-data.xlsx-to-csv

## 1.1.4

### Patch Changes

- 52688ec: Offer scFv construct sequences as a match target

  Datasets from scFv clonotyping expose the whole VH-linker-VL construct as a
  single `pl7.app/vdj/scFv-sequence` column alongside the per-chain sequence
  columns. It is now listed in "Sequence column to match", so an assay table
  carrying full construct sequences can be matched directly instead of against a
  single chain. Datasets without such columns are unaffected.

  SDK Update

## 1.1.3

### Patch Changes

- 48ac37e: Upgrade SDK

## 1.1.2

### Patch Changes

- ac20364: Bump everything to fix docker image

## 1.1.1

### Patch Changes

- 2036371: Migrate onto the block-tools structurer (tool-managed layout: oxlint/oxfmt,
  ts-builder, regenerated configs) and bump the SDK to latest (model/ui-vue
  1.79.14, workflow-tengo 6.6.3, tengo-builder 4.0.8). No block behavior change —
  the model was already on BlockModelV3.

## 1.1.0

### Minor Changes

- c98d8b5: - Introduce fast mode for sequence match
  - Support XLSX file as assay data input
