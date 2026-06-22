---
"@platforma-open/milaboratories.immune-assay-data.model": patch
"@platforma-open/milaboratories.immune-assay-data.ui": patch
"@platforma-open/milaboratories.immune-assay-data.workflow": patch
"@platforma-open/milaboratories.immune-assay-data.add-header": patch
"@platforma-open/milaboratories.immune-assay-data.check-content-empty": patch
"@platforma-open/milaboratories.immune-assay-data.coverage-mode-calc": patch
"@platforma-open/milaboratories.immune-assay-data.fasta-to-tsv": patch
"@platforma-open/milaboratories.immune-assay-data.merge-results": patch
"@platforma-open/milaboratories.immune-assay-data.prepare-fasta": patch
"@platforma-open/milaboratories.immune-assay-data.sequence-match": patch
"@platforma-open/milaboratories.immune-assay-data.split-fasta": patch
"@platforma-open/milaboratories.immune-assay-data.xlsx-to-csv": patch
---

Migrate onto the block-tools structurer (tool-managed layout: oxlint/oxfmt,
ts-builder, regenerated configs) and bump the SDK to latest (model/ui-vue
1.79.14, workflow-tengo 6.6.3, tengo-builder 4.0.8). No block behavior change —
the model was already on BlockModelV3.
