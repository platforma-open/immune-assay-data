import argparse
import polars as pl


def main():
    parser = argparse.ArgumentParser(
        description="Convert a TSV file to FASTA format.")
    parser.add_argument("-i", "--input", required=True,
                        help="Input TSV file path.")
    parser.add_argument("-o", "--output", required=True,
                        help="Output FASTA file path.")
    parser.add_argument("--seq_col", required=True,
                        help="Name of the column containing sequences.")
    parser.add_argument("--id_col", required=True,
                        help="Name of the column containing FASTA headers (IDs).")

    args = parser.parse_args()

    try:
        # Read the TSV file
        df = pl.read_csv(args.input, separator="\t")

        with open(args.output, "w") as outfile:
            for row in df.iter_rows(named=True):
                seq_id = row[args.id_col]
                sequence = row[args.seq_col]

                if seq_id is None or sequence is None:
                    print(
                        f"Warning: Skipping row due to missing ID or sequence: {row}")
                    continue

                # Ensure sequence and ID are strings
                seq_id_str = str(seq_id)
                sequence_str = str(sequence)

                # Write original sequence if input and output types are the same
                outfile.write(f">{seq_id_str}\n")
                for i in range(0, len(sequence_str), 80):
                    outfile.write(f"{sequence_str[i:i+80]}\n")

    except pl.exceptions.NoDataError:
        print(
            f"Error: The input file '{args.input}' is empty or could not be read.")
    except pl.exceptions.ColumnNotFoundError as e:
        print(
            f"Error: A specified column was not found in the input file: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")


if __name__ == "__main__":
    main()
