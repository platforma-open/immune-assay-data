import argparse

def main():
    parser = argparse.ArgumentParser(description="Check if a file is empty or contains only whitespace.")
    parser.add_argument("-i", "--input", required=True, help="Input file path.")
    
    args = parser.parse_args()

    try:
        has_content = False
        with open(args.input, 'r') as f:
            for line in f:
                if line.strip():
                    has_content = True
                    break
        
        # print "true" if it's empty, "false" if it has content
        print("true" if not has_content else "false")
        
    except FileNotFoundError:
        print(f"Error: File '{args.input}' not found.")
        sys.exit(1)
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        sys.exit(1)

if __name__ == "__main__":
    import sys
    main()
