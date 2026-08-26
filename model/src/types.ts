import type {
  ImportFileHandle,
  PlDataTableStateV2,
  PlMultiSequenceAlignmentModel,
  PlRef,
  SUniversalPColumnId,
} from "@platforma-sdk/model";

// Settings is part of the init-params contract, so it is defined in the kind (the layer the
// model depends on) and re-exported here to keep one import site for block code.
import type { Modality, Settings } from "@platforma-open/milaboratories.immune-assay-data.kind";

export type { Modality, Settings };

export type ImportColumnInfo = {
  header: string;
  type: "Int" | "Double" | "String";
  /** If this column is a sequence column, the type of the sequence. */
  sequenceType?: "nucleotide" | "aminoacid";
};

/** Unified V3 data: persisted state shaped on the UI's terms. */
export type BlockData = {
  customBlockLabel: string;
  datasetRef?: PlRef;
  targetRef?: SUniversalPColumnId;
  targetColumnLabel?: string;
  fileHandle?: ImportFileHandle;
  fileExtension?: string;
  detectedXsvType?: "csv" | "tsv";
  importColumns?: ImportColumnInfo[];
  sequenceColumnHeader?: string;
  selectedColumns: string[];
  settings: Settings;
  lessSensitive: boolean;
  maxSeqs?: number;
  mem?: number;
  cpu?: number;
  fileImportError?: string;
  tableState: PlDataTableStateV2;
  alignmentModel: PlMultiSequenceAlignmentModel;
  // Last modality the UI applied defaults for
  lastAppliedModality?: Modality;
};

/** Projected args consumed by the main workflow. */
export type BlockArgs = {
  defaultBlockLabel: string;
  customBlockLabel: string;
  datasetRef: PlRef;
  targetRef: SUniversalPColumnId;
  fileHandle: ImportFileHandle;
  detectedXsvType?: "csv" | "tsv";
  importColumns: ImportColumnInfo[];
  sequenceColumnHeader: string;
  selectedColumns: string[];
  settings: Settings;
  lessSensitive: boolean;
  maxSeqs: number;
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
  detectedXsvType?: "csv" | "tsv";
  importColumns?: ImportColumnInfo[];
  sequenceColumnHeader?: string;
  selectedColumns: string[];
  settings: Settings;
  lessSensitive: boolean;
  maxSeqs?: number;
  mem?: number;
  cpu?: number;
};

/** Pre-V3 UI state shape, frozen snapshot for `upgradeLegacy`. */
export type LegacyBlockUiState = {
  fileImportError?: string;
  tableState: PlDataTableStateV2;
  alignmentModel: PlMultiSequenceAlignmentModel;
};
