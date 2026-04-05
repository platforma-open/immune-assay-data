import argparse
import json


def read_fasta(path):
    sequences = []
    current_header = None
    current_lines = []
    with open(path) as f:
        for line in f:
            line = line.rstrip('\n')
            if line.startswith('>'):
                if current_header is not None:
                    sequences.append((current_header, current_lines))
                current_header = line
                current_lines = []
            elif line:
                current_lines.append(line)
    if current_header is not None:
        sequences.append((current_header, current_lines))
    return sequences


def write_fasta(path, sequences):
    with open(path, 'w') as f:
        for header, lines in sequences:
            f.write(header + '\n')
            for line in lines:
                f.write(line + '\n')


def main():
    parser = argparse.ArgumentParser(description="Split a FASTA file into two equal chunks.")
    parser.add_argument("-i", "--input", required=True, help="Input FASTA file.")
    parser.add_argument("--chunk1", required=True, help="Output path for chunk 1.")
    parser.add_argument("--chunk2", required=True, help="Output path for chunk 2.")
    parser.add_argument("--counts", required=True, help="Output JSON with sequence counts.")
    args = parser.parse_args()

    sequences = read_fasta(args.input)
    total = len(sequences)
    split = (total + 1) // 2  # chunk1 gets ceil(total/2)

    chunk1 = sequences[:split]
    chunk2 = sequences[split:]

    write_fasta(args.chunk1, chunk1)
    write_fasta(args.chunk2, chunk2)

    counts = {"total": total, "chunk1": len(chunk1), "chunk2": len(chunk2)}
    with open(args.counts, 'w') as f:
        json.dump(counts, f)

    print(f"Split {total} sequences into chunks of {len(chunk1)} and {len(chunk2)}")


if __name__ == "__main__":
    main()
