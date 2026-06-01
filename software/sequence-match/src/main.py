"""Recall-guaranteed sequence matching for immune-assay-data.

Reports every clone whose sequence contains an assay sequence as an exact
substring (containment). This is the deterministic, recall-guaranteed equivalent
of an MMseqs2 id=1 / cov=1 search: an assay peptide that occurs verbatim inside a
(longer) clone sequence is reported, and nothing within the configured criterion
is ever silently missed.

Matching uses polars' built-in Aho-Corasick multi-pattern scan (`str.extract_many`):
the automaton is built once over all assay sequences and each clone is scanned a
single time, so cost is O(total clone length), independent of the assay-set size.

Output is a BLAST-tab TSV with the same columns the MMseqs2 path emits, so the
downstream post-processing in `analysis.tpl.tengo` is unchanged. The alignment
statistics are synthesized for an exact substring hit: 100% identity, no
mismatches/gaps, query fully covered. Coordinates use placeholder spans (the
in-clone offset is not reported in this version).
"""
import argparse

import polars as pl

# Canonical BLAST-tab columns the downstream post-processing reads (by name).
HEADER = [
    "query", "target", "pident", "alnlen", "mismatch", "gapopen",
    "qstart", "qend", "tstart", "tend", "evalue", "bits",
]


def write_empty(path: str) -> None:
    """Header-only output — matches the MMseqs2 path's empty-result shape."""
    pl.DataFrame({c: [] for c in HEADER}).write_csv(path, separator="\t")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--clones", required=True, help="Clones TSV with seqId, sequence.")
    ap.add_argument("--assay", required=True, help="Assay TSV with seqId, sequence.")
    ap.add_argument("--output", required=True, help="Output BLAST-tab TSV (with header).")
    args = ap.parse_args()

    # Upper-case both sides so matching is case-insensitive; the matched text then
    # equals the (upper-cased) assay needle, which keeps the join below exact.
    clones = pl.read_csv(args.clones, separator="\t").select(
        pl.col("seqId").cast(pl.Utf8).alias("target"),
        pl.col("sequence").cast(pl.Utf8).str.to_uppercase().alias("cseq"),
    )
    assay = pl.read_csv(args.assay, separator="\t").select(
        pl.col("seqId").cast(pl.Utf8).alias("query"),
        pl.col("sequence").cast(pl.Utf8).str.to_uppercase().alias("qseq"),
    ).unique(subset="qseq")

    needles = assay["qseq"].to_list()
    if not needles or clones.height == 0:
        write_empty(args.output)
        return

    # Aho-Corasick: which assay needles each clone contains. overlapping=True is
    # required for recall — every occurrence is reported, even overlapping ones.
    hits = (
        clones.with_columns(
            pl.col("cseq").str.extract_many(needles, overlapping=True).alias("qseq"),
        )
        .explode("qseq")
        .drop_nulls("qseq")
        .select("target", "qseq")
        .unique()  # one row per (clone, assay needle)
    )

    if hits.height == 0:
        write_empty(args.output)
        return

    res = (
        hits.join(assay, on="qseq", how="inner")  # attach the assay query id
        .with_columns(pl.col("qseq").str.len_chars().cast(pl.Int64).alias("alnlen"))
        .with_columns(
            pl.lit(100.0).alias("pident"),
            pl.lit(0, dtype=pl.Int64).alias("mismatch"),
            pl.lit(0, dtype=pl.Int64).alias("gapopen"),
            pl.lit(1, dtype=pl.Int64).alias("qstart"),
            pl.col("alnlen").alias("qend"),
            pl.lit(1, dtype=pl.Int64).alias("tstart"),
            pl.col("alnlen").alias("tend"),
            pl.lit(0.0).alias("evalue"),
            pl.col("alnlen").cast(pl.Float64).alias("bits"),
        )
        .select(HEADER)
        .sort(["target", "query"])  # deterministic, canonical output
    )
    res.write_csv(args.output, separator="\t")
    print(
        f"Sequence match (containment): {res.height} matches, "
        f"{res['target'].n_unique()} clonotypes, {res['query'].n_unique()} assay sequences.",
    )


if __name__ == "__main__":
    main()
