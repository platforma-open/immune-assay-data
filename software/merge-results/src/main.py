import argparse
import json

HEADER = "query\ttarget\tpident\talnlen\tmismatch\tgapopen\tqstart\tqend\ttstart\ttend\tevalue\tbits"
EVALUE_COL = 10  # 0-indexed in tab-separated mmseqs2 output


def copy_scaled(infile, outfile, scale_factor):
    for line in infile:
        line = line.rstrip('\n')
        if not line:
            continue
        cols = line.split('\t')
        if len(cols) > EVALUE_COL:
            try:
                cols[EVALUE_COL] = repr(float(cols[EVALUE_COL]) * scale_factor)
            except ValueError:
                pass
        outfile.write('\t'.join(cols) + '\n')


def main():
    parser = argparse.ArgumentParser(
        description="Merge two raw mmseqs2 result TSVs, add header, and normalize e-values.")
    parser.add_argument("-i1", required=True, help="Chunk 1 raw TSV (no header).")
    parser.add_argument("-i2", required=True, help="Chunk 2 raw TSV (no header).")
    parser.add_argument("--counts", required=True, help="JSON file with total/chunk1/chunk2 counts.")
    parser.add_argument("-o", "--output", required=True, help="Output TSV with header.")
    args = parser.parse_args()

    with open(args.counts) as f:
        counts = json.load(f)

    total = counts["total"]
    scale1 = total / counts["chunk1"] if counts["chunk1"] > 0 else 1.0
    scale2 = total / counts["chunk2"] if counts["chunk2"] > 0 else 1.0

    with open(args.output, 'w') as out:
        out.write(HEADER + '\n')
        with open(args.i1) as f1:
            copy_scaled(f1, out, scale1)
        with open(args.i2) as f2:
            copy_scaled(f2, out, scale2)

    print(f"Merged results with e-value scale factors: chunk1={scale1:.4f}, chunk2={scale2:.4f}")


if __name__ == "__main__":
    main()
