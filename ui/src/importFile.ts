import { getFileNameFromHandle, getRawPlatformaInstance, type LocalImportFileHandle } from '@platforma-sdk/model';

import { useApp } from './app';

import type { ImportColumnInfo } from '@platforma-open/milaboratories.immune-assay-data.model';
import * as XLSX from 'xlsx';

// Define a more specific type for raw Excel data
type TableRow = string[];
type TableData = TableRow[];

// Helper function to infer data type from a value
function inferValueType(value: unknown): 'Int' | 'Double' | 'String' {
  if (value === null || value === undefined || value === '') {
    return 'String'; // Default to String for empty values
  }

  const stringValue = String(value).trim();

  // Try to parse as integer
  const intValue = parseInt(stringValue, 10);
  if (!isNaN(intValue) && String(intValue) === stringValue) {
    return 'Int';
  }

  // Try to parse as double/float
  const floatValue = parseFloat(stringValue);
  if (!isNaN(floatValue) && isFinite(floatValue) && /^-?\d*\.?\d+([eE][+-]?\d+)?$/.test(stringValue)) {
    return 'Double';
  }

  return 'String';
}

// Helper function to infer column type from array of values
function inferColumnType(values: unknown[]): 'Int' | 'Double' | 'String' {
  const typeCounts = { Int: 0, Double: 0, String: 0 };
  let nonEmptyCount = 0;

  for (const value of values) {
    if (value !== null && value !== undefined && String(value).trim() !== '') {
      nonEmptyCount++;
      const type = inferValueType(value);
      typeCounts[type]++;
    }
  }

  // If no non-empty values, default to String
  if (nonEmptyCount === 0) {
    return 'String';
  }

  // If any value is String, the whole column is String
  if (typeCounts.String > 0) {
    return 'String';
  }

  // If any value is Double, the whole column is Double
  if (typeCounts.Double > 0) {
    return 'Double';
  }

  // Otherwise, it's Int
  return 'Int';
}

// Helper function to infer sequence type from array of values
function inferSequenceType(values: unknown[]): 'nucleotide' | 'aminoacid' | undefined {
  const validSequences = values
    .filter((v) => v !== null && v !== undefined && String(v).trim() !== '')
    .map((v) => String(v).trim())
    .filter((v) => v.length >= 3) // Only consider sequences of meaningful length
    .slice(0, 1000); // Check only first 1000 sequences

  if (validSequences.length === 0) return undefined;

  // Count characters across all sequences
  let nucleotideCharCount = 0;
  let aminoAcidCharCount = 0;
  let totalCharCount = 0;

  // Basic nucleotide characters
  const nucleotideChars = new Set(['A', 'T', 'G', 'C', 'N']);
  // Standard 20 amino acids plus X and * (excluding nucleotide overlap)
  const aminoAcidOnlyChars = new Set(['R', 'D', 'E', 'Q', 'H', 'I', 'L', 'K', 'M', 'F', 'P', 'S', 'W', 'Y', 'V', 'X', '*']);

  for (const sequence of validSequences) {
    const upperSeq = sequence.toUpperCase();
    for (const char of upperSeq) {
      if (char === '-') {
        // Skip gap characters
        continue;
      }

      if (nucleotideChars.has(char)) {
        nucleotideCharCount++;
      } else if (aminoAcidOnlyChars.has(char)) {
        aminoAcidCharCount++;
      }
      totalCharCount++;
    }
  }

  const totalValidCharCount = nucleotideCharCount + aminoAcidCharCount;

  // Need at least some valid characters to make a decision
  if (totalValidCharCount < 10 || totalValidCharCount / totalCharCount < 0.9) {
    return undefined;
  }

  // Calculate percentages
  const nucleotidePercentage = nucleotideCharCount / totalValidCharCount;

  // If nucleotide characters dominate (>90%), it's nucleotide
  if (nucleotidePercentage > 0.9) {
    return 'nucleotide';
  } else {
    return 'aminoacid';
  }
}

export async function importFile(file: LocalImportFileHandle) {
  const app = useApp();

  app.model.args.fileHandle = file;

  // clear state
  app.model.args.importColumns = undefined;
  app.model.ui.fileImportError = undefined;

  const fileName = getFileNameFromHandle(file);
  const extension = fileName.split('.').pop();
  app.model.args.fileExtension = extension;

  if (extension === 'xlsx' || extension === 'xls') {
    app.model.ui.fileImportError = 'XLS import is not yet available; use CSV instead';
    return;
  }

  const data = await getRawPlatformaInstance().lsDriver.getLocalFileContent(file);
  const wb = XLSX.read(data);

  // @TODO: allow user to select worksheet
  const worksheet = wb.Sheets[wb.SheetNames[0]];

  const rawData = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    raw: true,
    blankrows: false,
  }) as TableData;

  const header = rawData[0];
  if (!header) {
    app.model.ui.fileImportError = 'File does not contain any data';
    return;
  }

  if (new Set(header).size !== header.length) {
    app.model.ui.fileImportError = 'Headers in the input file must be unique';
    return;
  }

  const importColumns: ImportColumnInfo[] = [];

  // Process each column to infer its type
  for (let colIndex = 0; colIndex < header.length; colIndex++) {
    const columnHeader = header[colIndex];
    const columnValues = rawData.slice(1).map((row) => row[colIndex]);
    const inferredType = inferColumnType(columnValues);
    const sequenceType = inferredType === 'String' ? inferSequenceType(columnValues) : undefined;

    importColumns.push({
      header: columnHeader,
      type: inferredType,
      sequenceType,
    });
  }

  app.model.args.importColumns = importColumns;
  if (!importColumns.some((c) => c.sequenceType !== undefined)) {
    app.model.ui.fileImportError = 'No sequence columns found';
    return;
  }
}
