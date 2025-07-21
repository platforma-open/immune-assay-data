#!/usr/bin/env python3
"""
Convert FASTA files to TSV format.

This script reads a FASTA file and converts it to TSV format with
Header and Sequence columns.
"""

import argparse
import sys
from typing import List, Tuple


def parse_fasta_content(content: str) -> List[Tuple[str, str]]:
    """
    Parse FASTA content and return list of (header, sequence) tuples.
    
    Args:
        content: FASTA file content as string
        
    Returns:
        List of (header, sequence) tuples
        
    Raises:
        ValueError: If FASTA format is invalid
    """
    lines = content.split('\n')
    records = []
    current_header = ''
    current_sequence = ''
    
    for i, line in enumerate(lines, 1):
        line = line.strip()
        
        if not line:
            continue
            
        if line.startswith('>'):
            # Save previous record if exists
            if current_header and current_sequence:
                records.append((current_header, current_sequence))
            
            # Start new record
            current_header = line[1:].strip()
            current_sequence = ''
            
            # Validate header is not empty
            if not current_header:
                raise ValueError(f"Empty header found at line {i}. Headers must contain text after '>'.")
        else:
            # Sequence line
            if not current_header:
                raise ValueError(f"Sequence found without header at line {i}. All sequences must have headers starting with '>'.")
            
            # Clean sequence (remove whitespace and convert to uppercase)
            clean_sequence = line.upper().replace(' ', '').replace('\t', '')
            
            current_sequence += clean_sequence
    
    # Save last record
    if current_header and current_sequence:
        records.append((current_header, current_sequence))
    elif current_header and not current_sequence:
        raise ValueError("FASTA content ends with a header but no sequence. Each header must be followed by sequence data.")
    
    if not records:
        raise ValueError("No valid FASTA records found. Please provide sequences in FASTA format with headers starting with '>'.")
    
    return records


def fasta_to_tsv(input_file: str, output_file: str) -> None:
    """
    Convert FASTA file to TSV format.
    
    Args:
        input_file: Path to input FASTA file
        output_file: Path to output TSV file
        
    Raises:
        ValueError: If FASTA format is invalid
        FileNotFoundError: If input file doesn't exist
    """
    try:
        with open(input_file, 'r') as f:
            content = f.read()
    except FileNotFoundError:
        raise FileNotFoundError(f"Input file '{input_file}' not found.")
    
    records = parse_fasta_content(content)
    
    with open(output_file, 'w') as f:
        # Write header
        f.write("Header\tSequence\n")
        
        # Write records
        for header, sequence in records:
            f.write(f"{header}\t{sequence}\n")


def main():
    """Main function."""
    parser = argparse.ArgumentParser(
        description="Convert FASTA files to TSV format with Header and Sequence columns."
    )
    parser.add_argument(
        "-i", "--input", 
        required=True,
        help="Input FASTA file path."
    )
    parser.add_argument(
        "-o", "--output", 
        required=True,
        help="Output TSV file path."
    )
    
    args = parser.parse_args()
    
    try:
        fasta_to_tsv(args.input, args.output)
        print(f"Successfully converted '{args.input}' to '{args.output}'")
    except (ValueError, FileNotFoundError) as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main() 