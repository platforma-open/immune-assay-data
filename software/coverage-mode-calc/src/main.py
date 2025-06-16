import argparse


def get_fasta_stats(file_path):
    """
    Calculates the number of sequences and total length of all sequences in a FASTA file.
    """
    count = 0
    total_length = 0
    current_sequence = ""

    try:
        with open(file_path, 'r') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                if line.startswith('>'):
                    if current_sequence:
                        total_length += len(current_sequence)
                    count += 1
                    current_sequence = ""
                else:
                    current_sequence += line
            if current_sequence:  # Add the last sequence
                total_length += len(current_sequence)
    except FileNotFoundError:
        print(f"Warning: File not found at {file_path}. Returning 0 for count and length.")
        return 0, 0

    return count, total_length


def main():
    parser = argparse.ArgumentParser(
        description="Calculate coverage mode based on two FASTA files.")
    parser.add_argument("--clones-fasta", required=True,
                        help="Path to the clones FASTA file.")
    parser.add_argument("--assay-fasta", required=True,
                        help="Path to the assay FASTA file.")
    parser.add_argument("--output", required=True,
                        help="Path for the output file (e.g., coverage_mode.txt).")
    args = parser.parse_args()

    coverage_mode = "2"

    clones_count, clones_total_length = get_fasta_stats(args.clones_fasta)
    assay_count, assay_total_length = get_fasta_stats(args.assay_fasta)

    if clones_count > 0 and assay_count > 0:
        clones_avg = clones_total_length / clones_count
        assay_avg = assay_total_length / assay_count
        if assay_avg < clones_avg:
            coverage_mode = "1"

    with open(args.output, 'w') as f:
        f.write(coverage_mode)

    print(f"Coverage mode '{coverage_mode}' written to {args.output}")


if __name__ == "__main__":
    main() 