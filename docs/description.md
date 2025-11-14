# Overview

Imports immune assay data containing nucleotide or amino acid sequences with associated metadata and aligns clonotypes from V(D)J analysis with the assay database to assign functional annotations. The block uses MMseqs2's easy-search functionality to perform sensitive sequence alignment between clonotype sequences and assay database sequences, assigning metadata (such as antigen specificity, binding affinity, or functional properties) to matching clonotypes.

The enriched clonotype data with assay annotations can be used in downstream analysis blocks such as Clonotype Browser to filter, explore, and analyze clonotypes based on their functional properties.

MMseqs2 is developed by the Söding lab and Steinegger group. For more information, please see: [https://github.com/soedinglab/MMseqs2](https://github.com/soedinglab/MMseqs2) and cite the following publication if used in your research:

> Steinegger M and Soeding J. MMseqs2 enables sensitive protein sequence searching for the analysis of massive data sets. _Nature Biotechnology_, doi: 10.1038/nbt.3988 (2017). [https://doi.org/10.1038/nbt.3988](https://doi.org/10.1038/nbt.3988)
