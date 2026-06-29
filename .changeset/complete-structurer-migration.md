---
'@platforma-open/milaboratories.immune-assay-data': patch
---

Complete the block-tools structurer migration: move the block facade to the
managed `block/src` layout and regenerate the package manifests and CI
workflows. This adds the `--registry-serve-url` flag that the bumped block-tools
now requires for `block-tools publish`, fixing the block-registry publish step
that failed after the SDK bump.
