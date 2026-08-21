# Import Assay Data

Attach experimental results to the sequences they came from. This Platforma block imports assay data — binding measurements, antigen specificity, functional readouts — and uses MMseqs2 to align its sequences against your clonotypes or peptides, so the measurements land on the right candidates even when the sequences are not byte-identical.

Open-source analysis block for Platforma, the biologics discovery platform by MiLaboratories. For the full no-code workflow, see [platforma.bio](https://platforma.bio/).

> **Naming:** this block appears as **Import Assay Data** in the Platforma app; the repository is named `immune-assay-data`. They are the same block.

## What it does

Wet-lab results usually live apart from the sequencing analysis: a plate reader export, an SPR table, a spreadsheet of ELISA values, each keyed by a sequence written by whoever ran the assay. Joining that to a repertoire by exact string match rarely works — sequences get trimmed differently, translated differently, or recorded at a different region boundary.

This block does the join by alignment instead. Assay sequences are searched against your dataset's sequences with MMseqs2, and matching rows carry their metadata across. Matching can run in alignment mode, where similarity is scored with a BLOSUM matrix or by exact identity and gated by score and coverage thresholds, or in sequence-match mode when you want direct matching. A cap on how many candidate clonotypes are examined per assay sequence keeps large joins tractable.

You choose which assay columns to bring in, so a wide export contributes only the fields you care about. Those become columns on your clonotypes or peptides — filterable, rankable, and available to every downstream block. In [Sequence Browser](https://github.com/platforma-open/clonotype-browser) you can explore candidates by functional property; in [Lead Selection](https://github.com/platforma-open/antibody-tcr-lead-selection) you can rank on measured affinity alongside enrichment and developability; on the [Sequence Space](https://github.com/platforma-open/clonotype-space) map you can see where the active sequences sit.

## Inputs & outputs

* **Input:** a clonotype or peptide dataset, plus an assay data table containing nucleotide or amino acid sequences with associated measurements or annotations.
* **Output:** the selected assay columns joined onto matching sequences in your dataset, available to downstream blocks for filtering, ranking, and visualization.

## Specifications

| | |
|---|---|
| Block title in app | Import Assay Data |
| Aligner | [MMseqs2](https://github.com/soedinglab/MMseqs2) easy-search |
| Matching modes | Alignment, or direct sequence match |
| Alignment scoring | BLOSUM matrix or exact identity |
| Thresholds | Score threshold, coverage threshold, maximum clonotypes examined per assay sequence |
| Sequence types | Nucleotide or amino acid |
| Column selection | Choose which assay columns to import |

## Use cases

* **Binding data on candidates:** attach SPR, ELISA, or flow measurements to the clonotypes they were measured on.
* **Antigen specificity:** annotate clonotypes with known specificity from a reference table or a published dataset.
* **Validating a selection:** check whether the sequences enrichment ranked highest are the ones that actually bound.
* **Functional lead ranking:** rank in Lead Selection on measured activity alongside enrichment and developability scores.
* **Map overlay:** color the Sequence Space UMAP by assay values to see where functional sequences sit in the library.
* **Imperfect joins:** match assay sequences recorded at different region boundaries or trimmed differently from your dataset's sequences.
* **Reference panel annotation:** flag clonotypes matching a curated panel of known binders.

## FAQ

### Why align instead of matching sequences exactly?

Because assay records and sequencing results rarely agree character for character. The same antibody may be written as a CDR3, a full variable domain, or a construct with linkers, and may be trimmed differently by whoever recorded it. Alignment tolerates those differences; exact matching silently drops most of the rows.

### Which matching mode should I use?

Alignment mode when the assay sequences may differ in length or boundary from your dataset's — the common case. Sequence-match mode when you know both sides use identical representations and want a direct join.

### What do the score and coverage thresholds control?

How permissive the match is. The score threshold sets the minimum alignment quality accepted; the coverage threshold sets how much of the sequence must be aligned. Raise both to avoid spurious joins; lower them if legitimate matches are being missed.

### What does the maximum clonotypes per sequence setting do?

Caps how many candidate matches are examined for each assay sequence, which bounds runtime on large datasets. Raise it if you expect an assay sequence to legitimately match many clonotypes.

### Which columns should I import?

Only the ones you will use downstream. Assay exports are often wide with many irrelevant fields; importing selectively keeps the resulting table readable.

### Does it work with peptides?

Yes. Peptide datasets are supported alongside clonotypes, so peptide assay results can be joined the same way.

## Citation

If you use this block in your research, please cite MMseqs2:

> Steinegger, M., & Söding, J. (2017). MMseqs2 enables sensitive protein sequence searching for the analysis of massive data sets. *Nature Biotechnology* **35**(11), 1026–1028. [https://doi.org/10.1038/nbt.3988](https://doi.org/10.1038/nbt.3988)

## Documentation

Step-by-step guide: [Functional Assay Data Integration](https://docs.platforma.bio/guides/antibody-discovery/functinal-assay-data/)

## Part of the Platforma ecosystem

This block is part of [Platforma](https://platforma.bio/) by [MiLaboratories](https://github.com/milaboratory), built on [MMseqs2](https://github.com/soedinglab/MMseqs2). Explore the other open-source blocks at [github.com/platforma-open](https://github.com/platforma-open) and the docs for antibody discovery at [docs.platforma.bio/biology-guides/antibody-discovery](https://docs.platforma.bio/biology-guides/antibody-discovery/).
