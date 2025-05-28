import argparse
import shutil

HEADER = "query\ttarget\tpident\talnlen\tmismatch\tgapopen\tqstart\tqend\ttstart\ttend\tevalue\tbits"

def main():
    parser = argparse.ArgumentParser(description="Add a header to a TSV file.")
    parser.add_argument("-i", "--input_file", required=True, help="Path to the input TSV file.")
    parser.add_argument("-o", "--output_file", required=True, help="Path to the output TSV file.")
    args = parser.parse_args()

    with open(args.output_file, 'w') as outfile:
        outfile.write(HEADER + '\n')
        with open(args.input_file, 'r') as infile:
            shutil.copyfileobj(infile, outfile)

    print(f"Header added to {args.input_file} and saved to {args.output_file}")

if __name__ == "__main__":
    main()
