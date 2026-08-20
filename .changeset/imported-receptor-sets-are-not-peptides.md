---
'@platforma-open/milaboratories.immune-assay-data.model': minor
'@platforma-open/milaboratories.immune-assay-data.workflow': minor
'@platforma-open/milaboratories.immune-assay-data': minor
---

Treat imported receptor sets as receptors, not as peptides

`import-vdj-data` emits bare imported sets — amino-acid variable domains with no gene calls and
no counts — on `pl7.app/variantKey`, the axis peptide-extraction already uses. The block read
that axis NAME as "peptide" in three places, so such a dataset could be selected and then went
nowhere:

- **The sequence-column picker was empty.** For `variantKey` the block installed the peptide
  matcher (`pl7.app/sequence` + `pl7.app/feature: peptide`), which matches nothing an imported
  set emits. `targetRef` is required, so Run never enabled.
- **The workflow would have panicked** the moment the picker was fixed: the same test required
  a `pl7.app/sequenceLength` column that an imported set does not carry, and the run died on
  `"Peptide input is missing required pl7.app/sequenceLength column"` — naming a column the
  scientist never chose. Downstream of that flag, the short-peptide k-mer override (k=5,
  relaxed prefilter) would have been applied to ~120 aa variable domains.
- **The UI applied peptide thresholds** — sequence-identity at 1.0/1.0 rather than
  alignment-score at 0.9/0.95 — and the outputs were labelled "Matched Peptides" and
  "Peptide to assay link".

The question is now asked of the axis DOMAIN, which is the only thing that separates the three
producers sharing that axis: `pl7.app/peptide/extractionRunId` is peptide-extraction,
`pl7.app/repertoire/extractionRunId` is synthetic-repertoire-profiler, and
`pl7.app/vdj/clonotypingRunId` is an imported receptor set. Peptide behaviour is unchanged.

The workflow's copy lives in a new `modality.lib.tengo` shared by `main` and `build-outputs`,
which previously tested the axis independently — a disagreement between them would have sent a
dataset down the peptide alignment path while labelling its outputs as clones.

Paired imported sets take the per-chain matcher. Legacy MiXCR single-cell declares pairing on
the axis name; an imported set declares it only in the `pl7.app/vdj/scClonotypeChain` column
domain, so the block probes for such a column instead of trusting the axis. A single-chain
imported set is bulk-shaped and takes the unfiltered matcher, as bulk MiXCR does.

The scFv probe is now skipped for peptides rather than for `variantKey`, so it reaches imported
sets. They carry no scFv column today, so nothing is offered — the guard just stops being wrong
about why.
