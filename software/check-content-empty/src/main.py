import argparse
import sys

def main():
    parser = argparse.ArgumentParser(description="Check if a file has a minimum number of non-empty lines.")
    parser.add_argument("-i", "--input", required=True, help="Input file path.")
    parser.add_argument("-n", "--min_lines", type=int, default=1, help="Minimum number of non-empty lines required to be considered 'not empty'.")
    
    args = parser.parse_args()

    try:
        count = 0
        with open(args.input, 'r') as f:
            for line in f:
                if line.strip():
                    count += 1
                    if count >= args.min_lines:
                        break
        
        # print "true" if it's empty (count < min_lines), "false" if it has enough content
        print("true" if count < args.min_lines else "false")
        
    except FileNotFoundError:
        print(f"Error: File '{args.input}' not found.")
        sys.exit(1)
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
