import type { ImportFileHandle, PlRef, SUniversalPColumnId } from "@milaboratories/pl-model-common";
import { isColumnUniversalId, isPlRef } from "@milaboratories/pl-model-common";
import { assertParamsObject, defineBlockKind } from "@platforma-sdk/block-kind";
import { isBoolean, isPlainObject, isString } from "es-toolkit";
import { isArray, isNumber } from "es-toolkit/compat";
import { name, version } from "../package.json" with { type: "json" };

/**
 * Matching method and thresholds.
 */
export type Settings = {
  coverageThreshold: number;
  identity: number;
  /**
   * `alignment-score` / `sequence-identity` run MMseqs2; `exact-match` reports only
   * byte-identical sequences and ignores identity/coverage/fast-mode.
   */
  similarityType: "sequence-identity" | "alignment-score" | "exact-match";
};

/** Which upstream the block is pointed at. Lives here for the same reason as {@link Settings}. */
export type Modality = "antibody_tcr" | "peptide";

/**
 * This block's init-params contract — everything a creator or a project template chooses,
 * and nothing derived. Excluded on purpose: state the block recomputes from the assay file's
 * own bytes (`importColumns`, `detectedXsvType`, `fileImportError`) and pure view state
 * (`tableState`, `alignmentModel`).
 *
 * `mem` / `cpu` are excluded deliberately and permanently: resource allocation belongs to
 * the machine a block runs on, not to configuration a template carries between machines.
 *
 * `fileHandle` travels only when it is an `index://` handle — that is `{storageId, path}`,
 * which resolves for anyone whose server registers that storage. An `upload://` handle
 * carries a signature bound to the instance that made it and will not resolve elsewhere.
 * The model's `templateParams` projection is what drops an `upload://` handle, so one never
 * reaches a template by export. It is still accepted here rather than rejected: a parser
 * stricter than the states the UI reaches would make the block refuse its own exports, and a
 * hand-written entry naming a local file is the author's call to make.
 *
 * Every field is optional: a block may be created without a template, and a template need
 * not set all of them.
 */
export type BlockParams = {
  customBlockLabel?: string;
  datasetRef?: PlRef;
  targetRef?: SUniversalPColumnId;
  targetColumnLabel?: string;
  fileHandle?: ImportFileHandle;
  fileExtension?: string;
  sequenceColumnHeader?: string;
  selectedColumns?: string[];
  settings?: Settings;
  lessSensitive?: boolean;
  maxSeqs?: number;
  /**
   * Carried on purpose, like the rest of the recipe. The UI reapplies modality threshold
   * defaults whenever the resolved modality differs from this field, so a template that
   * carried `settings` without it would land, see `undefined`, and have its thresholds
   * overwritten. Carrying it also stays correct when a template lands on the other
   * modality: the values then differ, the watcher fires, and the new defaults win.
   */
  lastAppliedModality?: Modality;
};

type Guard<T> = (v: unknown) => v is T;
type Check<T> = { is: Guard<T>; must: string };

function check<T>(is: Guard<T>, must: string): Check<T> {
  return { is, must };
}

/** Both handle forms are `<scheme>://<scheme>/<urlencoded JSON>`; the scheme is the envelope. */
const isImportFileHandle: Guard<ImportFileHandle> = (v): v is ImportFileHandle =>
  isString(v) && (v.startsWith("upload://") || v.startsWith("index://"));

const isStringArray: Guard<string[]> = (v): v is string[] => isArray(v) && v.every(isString);

const isModality: Guard<Modality> = (v): v is Modality => v === "antibody_tcr" || v === "peptide";

/**
 * A whole number of at least `min`. `Number.isInteger` rather than es-toolkit's `isInteger`,
 * which returns a plain boolean and so leaves the value un-narrowed for the comparison after it.
 */
function isIntAtLeast(min: number): Guard<number> {
  return (v): v is number => isNumber(v) && Number.isInteger(v) && v >= min;
}

const SIMILARITY_TYPES: readonly Settings["similarityType"][] = [
  "sequence-identity",
  "alignment-score",
  "exact-match",
];

const isSettings: Guard<Settings> = (v): v is Settings =>
  isPlainObject(v) &&
  isNumber(v.coverageThreshold) &&
  isNumber(v.identity) &&
  SIMILARITY_TYPES.includes(v.similarityType as Settings["similarityType"]);

/**
 * The runtime half of the contract. The `satisfies` clause is what stops it drifting: every
 * field `BlockParams` declares must appear here, and each guard must narrow to that field's
 * own type — so adding a param without a check stops compiling.
 */
const CONTRACT = {
  customBlockLabel: check(isString, "a string"),
  datasetRef: check(isPlRef, "a reference to an input dataset"),
  targetRef: check(isColumnUniversalId, "a sequence column identifier"),
  targetColumnLabel: check(isString, "a string"),
  fileHandle: check(isImportFileHandle, "an upload:// or index:// file handle"),
  fileExtension: check(isString, "a string"),
  sequenceColumnHeader: check(isString, "a string"),
  selectedColumns: check(isStringArray, "an array of column names"),
  settings: check(isSettings, "an object with coverageThreshold, identity and similarityType"),
  lessSensitive: check(isBoolean, "a boolean"),
  maxSeqs: check(isIntAtLeast(0), "a whole number of 0 or more, where 0 means no limit"),
  lastAppliedModality: check(isModality, '"antibody_tcr" or "peptide"'),
} satisfies { [K in keyof Required<BlockParams>]: Check<NonNullable<BlockParams[K]>> };

/**
 * The contract at runtime, for params arriving from a template file rather than typed code.
 * An absent field is always allowed — every param is optional and the block's own default
 * takes over — so each guard runs only on what is present. Keys the contract does not name
 * are dropped by never being read.
 */
function parseInitializationParams(value: unknown): BlockParams {
  assertParamsObject(value);

  const params: Record<string, unknown> = {};
  for (const [field, { is, must }] of Object.entries(CONTRACT)) {
    const v = value[field];
    if (v === undefined) continue;
    if (!is(v)) throw new Error(`'${field}' must be ${must}.`);
    params[field] = v;
  }
  return params as BlockParams;
}

// Identity comes from this package's own package.json, so the on-wire `{name}@{version}`
// reference can never drift from what is published; the bundler inlines the JSON import.
export const kind = defineBlockKind<BlockParams>({
  name,
  version,
  parseInitializationParams,
});
