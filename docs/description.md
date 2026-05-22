# Overview

Imports assay data containing nucleotide or amino acid sequences with associated metadata and aligns it to clonotypes or peptides to assign functional annotations. The block uses MMseqs2's easy-search functionality to perform sensitive sequence alignment between input sequences and assay database sequences, assigning metadata (such as antigen specificity, binding affinity, or functional properties) to matching sequences.

The enriched data with assay annotations can be used in downstream analysis blocks such as Sequence Browser to filter, explore, and analyze sequences based on their functional properties.

MMseqs2 is developed by the Söding lab and Steinegger group. For more information, please see: [https://github.com/soedinglab/MMseqs2](https://github.com/soedinglab/MMseqs2) and cite the following publication if used in your research:

> Steinegger M and Soeding J. MMseqs2 enables sensitive protein sequence searching for the analysis of massive data sets. _Nature Biotechnology_, doi: 10.1038/nbt.3988 (2017). [https://doi.org/10.1038/nbt.3988](https://doi.org/10.1038/nbt.3988)
