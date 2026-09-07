---
'@platforma-open/milaboratories.immune-assay-data': patch
---

Fix the kind refusing the column id the block itself writes. `targetRef` holds an id minted by `resultPool.getCanonicalOptions`, which is an *anchored* key; `isColumnUniversalId` recognizes only the newer key forms and rejects those, so applying a template exported from this block failed with "'targetRef' must be a sequence column identifier." Both forms are now accepted, matching what `clonotype-clustering`, `clonotype-enrichment`, `clonotype-space` and `redefine-clonotypes` already do.
