export interface FastaRecord {
  header: string;
  sequence: string;
}

export interface FastaParseResult {
  records: FastaRecord[];
  error?: string;
}

/**
 * Detect if a sequence is nucleotide, amino acid, or unknown
 */
function detectSequenceType(sequence: string): 'nucleotide' | 'aminoacid' | 'unknown' {
  const validDnaChars = /^[ACGTNRYWSKMBDHV]+$/;
  const validAminoAcidChars = /^[ACDEFGHIKLMNPQRSTVWY]+$/;

  if (validDnaChars.test(sequence)) {
    return 'nucleotide';
  } else if (validAminoAcidChars.test(sequence)) {
    return 'aminoacid';
  } else {
    return 'unknown';
  }
}

/**
 * Parse FASTA content and convert to tab-delimited table format
 */
export function parseFastaContent(content: string): FastaParseResult {
  const lines = content.split('\n');
  const records: FastaRecord[] = [];
  let currentHeader = '';
  let currentSequence = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) continue;

    if (line.startsWith('>')) {
      // Save previous record if exists
      if (currentHeader && currentSequence) {
        records.push({
          header: currentHeader,
          sequence: currentSequence,
        });
      }

      // Start new record
      currentHeader = line.substring(1).trim().replace(/\t/g, ' ');
      currentSequence = '';

      // Validate header is not empty
      if (!currentHeader) {
        return {
          records: [],
          error: `Empty header found at line ${i + 1}. Headers must contain text after ">".`,
        };
      }
    } else {
      // Sequence line
      if (!currentHeader) {
        return {
          records: [],
          error: `Sequence found without header at line ${i + 1}. All sequences must have headers starting with ">".`,
        };
      }

      // Clean sequence for validation
      const cleanSequence = line.toUpperCase().replace(/\s/g, '');

      // Determine sequence type and validate accordingly
      const sequenceType = detectSequenceType(cleanSequence);

      if (sequenceType === 'unknown') {
        const invalidChars = cleanSequence.match(/[^ACGTNRYWSKMBDHVACDEFGHIKLMNPQRSTVWY]/g);
        return {
          records: [],
          error: `Invalid characters in sequence at line ${i + 1}. Only DNA nucleotides (ACGT) with IUPAC wildcards (NRYWSKMBDHV) or amino acids (ACDEFGHIKLMNPQRSTVWY) are allowed. Invalid characters: ${invalidChars?.join(', ')}`,
        };
      }

      currentSequence += cleanSequence;
    }
  }

  // Save last record
  if (currentHeader && currentSequence) {
    records.push({
      header: currentHeader,
      sequence: currentSequence,
    });
  } else if (currentHeader && !currentSequence) {
    return {
      records: [],
      error: 'FASTA content ends with a header but no sequence. Each header must be followed by sequence data.',
    };
  }

  if (records.length === 0) {
    return {
      records: [],
      error: 'No valid FASTA records found. Please provide sequences in FASTA format with headers starting with ">".',
    };
  }

  return { records };
}

/**
 * Convert FASTA records to tab-delimited table format
 */
export function fastaToTable(records: FastaRecord[]): string {
  // Create header row
  const headerRow = 'Header\tSequence';

  // Create data rows
  const dataRows = records.map((record) => `${record.header}\t${record.sequence}`);

  // Combine header and data
  return [headerRow, ...dataRows].join('\n');
}
