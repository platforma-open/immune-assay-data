import argparse
import json


def count_sequences(path):
    count = 0
    with open(path) as f:
        for line in f:
            if line.startswith('>'):
                count += 1
    return count


def split_stream(input_path, chunk1_path, chunk2_path, split_at):
    """Stream sequences from input, writing first split_at to chunk1, rest to chunk2."""
    seq_index = 0
    with open(input_path) as f, \
         open(chunk1_path, 'w') as out1, \
         open(chunk2_path, 'w') as out2:
        current_out = out1
        for line in f:
            if line.startswith('>'):
                seq_index += 1
                if seq_index > split_at:
                    current_out = out2
            current_out.write(line)


def main():
    parser = argparse.ArgumentParser(description="Split a FASTA file into two equal chunks.")
    parser.add_argument("-i", "--input", required=True, help="Input FASTA file.")
    parser.add_argument("--chunk1", required=True, help="Output path for chunk 1.")
    parser.add_argument("--chunk2", required=True, help="Output path for chunk 2.")
    parser.add_argument("--counts", required=True, help="Output JSON with sequence counts.")
    args = parser.parse_args()

    total = count_sequences(args.input)
    split_at = (total + 1) // 2  # chunk1 gets ceil(total/2)

    split_stream(args.input, args.chunk1, args.chunk2, split_at)

    counts = {"total": total, "chunk1": split_at, "chunk2": total - split_at}
    with open(args.counts, 'w') as f:
        json.dump(counts, f)

    print(f"Split {total} sequences into chunks of {split_at} and {total - split_at}")


if __name__ == "__main__":
    main()
