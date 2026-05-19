import type {
  ImportFileHandle,
  PlDataTableStateV2,
  PlMultiSequenceAlignmentModel,
  PlRef,
  SUniversalPColumnId,
} from '@platforma-sdk/model';

export type Settings = {
  /** Fraction of aligned residues required (MMseqs2 coverage). */
  coverageThreshold: number;
  /** Identity threshold (0-1). */
  identity: number;
  similarityType: 'sequence-identity' | 'alignment-score';
};

export type ImportColumnInfo = {
  header: string;
  type: 'Int' | 'Double' | 'String';
  /** If this column is a sequence column, the type of the sequence. */
  sequenceType?: 'nucleotide' | 'aminoacid';
};

/** Unified V3 data: persisted state shaped on the UI's terms. */
export type BlockData = {
  customBlockLabel: string;
  datasetRef?: PlRef;
  targetRef?: SUniversalPColumnId;
  fileHandle?: ImportFileHandle;
  fileExtension?: string;
  detectedXsvType?: 'csv' | 'tsv';
  importColumns?: ImportColumnInfo[];
  sequenceColumnHeader?: string;
  selectedColumns: string[];
  settings: Settings;
  lessSensitive: boolean;
  mem?: number;
  cpu?: number;
  fileImportError?: string;
  tableState: PlDataTableStateV2;
  alignmentModel: PlMultiSequenceAlignmentModel;
};

/** Projected args consumed by the main workflow. */
export type BlockArgs = {
  defaultBlockLabel: string;
  customBlockLabel: string;
  datasetRef: PlRef;
  targetRef: SUniversalPColumnId;
  fileHandle: ImportFileHandle;
  detectedXsvType?: 'csv' | 'tsv';
  importColumns: ImportColumnInfo[];
  sequenceColumnHeader: string;
  selectedColumns: string[];
  settings: Settings;
  lessSensitive: boolean;
  mem?: number;
  cpu?: number;
};

/**
 * Projected prerun args. Prerun imports `fileHandle` and emits `assayFile` so
 * the UI can read the file bytes via ReactiveFileContent. The subtemplate
 * guards undefined, so the projection passes through without throwing.
 */
export type BlockPrerunArgs = {
  fileHandle?: ImportFileHandle;
};

/** Pre-V3 args shape, frozen snapshot for `upgradeLegacy`. */
export type LegacyBlockArgs = {
  defaultBlockLabel: string;
  customBlockLabel: string;
  datasetRef?: PlRef;
  targetRef?: SUniversalPColumnId;
  fileHandle?: ImportFileHandle;
  fileExtension?: string;
  detectedXsvType?: 'csv' | 'tsv';
  importColumns?: ImportColumnInfo[];
  sequenceColumnHeader?: string;
  selectedColumns: string[];
  settings: Settings;
  lessSensitive: boolean;
  mem?: number;
  cpu?: number;
};

/** Pre-V3 UI state shape, frozen snapshot for `upgradeLegacy`. */
export type LegacyBlockUiState = {
  fileImportError?: string;
  tableState: PlDataTableStateV2;
  alignmentModel: PlMultiSequenceAlignmentModel;
};
