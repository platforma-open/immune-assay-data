import argparse
import json


def main():
    parser = argparse.ArgumentParser(description="Split a FASTA file into two equal chunks.")
    parser.add_argument("-i", "--input", required=True, help="Input FASTA file.")
    parser.add_argument("--chunk1", required=True, help="Output path for chunk 1.")
    parser.add_argument("--chunk2", required=True, help="Output path for chunk 2.")
    parser.add_argument("--counts", required=True, help="Output JSON with sequence counts.")
    args = parser.parse_args()

    chunk1_count = 0
    chunk2_count = 0
    seq_index = 0
    current_out = None

    with open(args.input) as f, \
         open(args.chunk1, 'w') as out1, \
         open(args.chunk2, 'w') as out2:
        for line in f:
            if line.startswith('>'):
                seq_index += 1
                if seq_index % 2 == 1:  # odd sequences → chunk1
                    current_out = out1
                    chunk1_count += 1
                else:                    # even sequences → chunk2
                    current_out = out2
                    chunk2_count += 1
            current_out.write(line)

    total = chunk1_count + chunk2_count
    counts = {"total": total, "chunk1": chunk1_count, "chunk2": chunk2_count}
    with open(args.counts, 'w') as f:
        json.dump(counts, f)

    print(f"Split {total} sequences into chunks of {chunk1_count} and {chunk2_count}")


if __name__ == "__main__":
    main()
