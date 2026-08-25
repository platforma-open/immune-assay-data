import type {
  InferOutputsType,
  PColumn,
  PColumnDataUniversal,
  PColumnSpec,
  RenderCtxBase,
} from "@platforma-sdk/model";
import {
  BlockModelV3,
  createPFrameForGraphs,
  createPlDataTableStateV2,
  createPlDataTableV2,
  DataModelBuilder,
  getFileNameFromHandle,
} from "@platforma-sdk/model";
import { getDefaultBlockLabel } from "./label";
import type {
  BlockArgs,
  BlockData,
  BlockPrerunArgs,
  LegacyBlockArgs,
  LegacyBlockUiState,
  Modality,
  Settings,
} from "./types";

// `undefined` is part of the data union on purpose: `getAnchoredPColumns` returns
// columns whose data is not yet resolved, and `createPFrameForGraphs` accepts them
// as-is. Filtering them out instead would drop columns from the MSA frame while
// data is still loading. Do not narrow this to drop `undefined`.
type Column = PColumn<PColumnDataUniversal | undefined>;

const defaultSettings = (): Settings => ({
  coverageThreshold: 0.95,
  identity: 0.9,
  similarityType: "alignment-score",
});

const blockDataModel = new DataModelBuilder()
  .from<BlockData>("V20260519")
  .upgradeLegacy<LegacyBlockArgs, LegacyBlockUiState>(({ args, uiState }) => ({
    customBlockLabel: args?.customBlockLabel ?? "",
    datasetRef: args?.datasetRef,
    targetRef: args?.targetRef,
    targetColumnLabel: undefined,
    fileHandle: args?.fileHandle,
    fileExtension: args?.fileExtension,
    detectedXsvType: args?.detectedXsvType,
    importColumns: args?.importColumns,
    sequenceColumnHeader: args?.sequenceColumnHeader,
    selectedColumns: args?.selectedColumns ?? [],
    settings: args?.settings ?? defaultSettings(),
    lessSensitive: args?.lessSensitive ?? false,
    maxSeqs: args?.maxSeqs ?? 10000,
    mem: args?.mem,
    cpu: args?.cpu,
    fileImportError: uiState?.fileImportError,
    tableState: uiState?.tableState ?? createPlDataTableStateV2(),
    alignmentModel: uiState?.alignmentModel ?? {},
    // Pre-peptide-support projects are always antibody/TCR; seeding this prevents
    // the modality-reset watcher from clobbering user-tuned thresholds on reopen.
    lastAppliedModality: "antibody_tcr",
  }))
  .init(() => ({
    customBlockLabel: "",
    datasetRef: undefined,
    targetRef: undefined,
    targetColumnLabel: undefined,
    fileHandle: undefined,
    fileExtension: undefined,
    detectedXsvType: undefined,
    importColumns: undefined,
    sequenceColumnHeader: undefined,
    selectedColumns: [],
    settings: defaultSettings(),
    lessSensitive: false,
    maxSeqs: 10000,
    mem: undefined,
    cpu: undefined,
    fileImportError: undefined,
    tableState: createPlDataTableStateV2(),
    alignmentModel: {},
    lastAppliedModality: undefined,
  }));

export function deriveDefaultLabel(data: BlockData): string {
  return getDefaultBlockLabel({
    fileName: data.fileHandle ? getFileNameFromHandle(data.fileHandle) : undefined,
    targetColumnLabel: data.targetColumnLabel,
    similarityType: data.settings.similarityType,
    identity: data.settings.identity,
    coverageThreshold: data.settings.coverageThreshold,
  });
}

/**
 * Whether a dataset's row axis holds peptides.
 *
 * `pl7.app/variantKey` is shared by three producers and the axis name alone does not say which:
 * peptide-extraction stamps `pl7.app/peptide/extractionRunId`, synthetic-repertoire-profiler
 * stamps `pl7.app/repertoire/extractionRunId`, and import-vdj-data's bare receptor sets stamp
 * `pl7.app/vdj/clonotypingRunId`. Only the first is peptide.
 *
 * This is the block's one modality question, and it decides three things that used to be read
 * off the axis name: which sequence columns are offered, which threshold defaults the UI
 * applies, and — in the workflow — whether the short-peptide k-mer override is switched on.
 */
export function isPeptideAxis(axis: PColumnSpec["axesSpec"][number] | undefined): boolean {
  if (axis?.name !== "pl7.app/variantKey") return false;
  return axis.domain?.["pl7.app/vdj/clonotypingRunId"] === undefined;
}

function getAnchoredClonotypeProps(
  ctx: Pick<RenderCtxBase<BlockArgs, BlockData>, "data" | "resultPool">,
): Column[] | undefined {
  const anchor = ctx.data.datasetRef;
  if (anchor === undefined) return undefined;
  const anchorSpec = ctx.resultPool.getPColumnSpecByRef(anchor);
  if (anchorSpec === undefined) return undefined;
  return (
    ctx.resultPool.getAnchoredPColumns({ main: anchor }, [
      { axes: [{ anchor: "main", idx: 1 }] },
    ]) ?? []
  ).filter((p) => p.spec.annotations?.["pl7.app/sequence/isAnnotation"] !== "true");
}

export const platforma = BlockModelV3.create(blockDataModel)

  .args<BlockArgs>((data) => {
    if (data.datasetRef === undefined) throw new Error("Dataset is required");
    if (data.targetRef === undefined) throw new Error("Sequence column to match is required");
    if (data.fileHandle === undefined) throw new Error("Assay file is required");
    if (data.importColumns === undefined) throw new Error("Assay file has not been parsed yet");
    if (data.sequenceColumnHeader === undefined)
      throw new Error("Assay sequence column is required");
    if (data.fileImportError !== undefined) throw new Error(data.fileImportError);

    // In exact-match mode the MMseqs2-only parameters carry no meaning. Pin
    // them so editing a hidden threshold (or toggling fast mode) does not
    // stale the block.
    const exact = data.settings.similarityType === "exact-match";

    return {
      defaultBlockLabel: deriveDefaultLabel(data),
      customBlockLabel: data.customBlockLabel,
      datasetRef: data.datasetRef,
      targetRef: data.targetRef,
      fileHandle: data.fileHandle,
      detectedXsvType: data.detectedXsvType,
      importColumns: data.importColumns,
      sequenceColumnHeader: data.sequenceColumnHeader,
      selectedColumns: data.selectedColumns,
      settings: exact
        ? { similarityType: "exact-match", identity: 1, coverageThreshold: 1 }
        : data.settings,
      lessSensitive: exact ? false : data.lessSensitive,
      maxSeqs: exact ? 10000 : (data.maxSeqs ?? 10000),
      mem: data.mem,
      cpu: data.cpu,
    };
  })

  .prerunArgs(
    (data): BlockPrerunArgs => ({
      fileHandle: data.fileHandle,
    }),
  )

  .output("datasetOptions", (ctx) =>
    ctx.resultPool.getOptions(
      [
        {
          axes: [{ name: "pl7.app/sampleId" }, { name: "pl7.app/vdj/clonotypeKey" }],
          annotations: { "pl7.app/isAnchor": "true" },
        },
        {
          axes: [{ name: "pl7.app/sampleId" }, { name: "pl7.app/vdj/scClonotypeKey" }],
          annotations: { "pl7.app/isAnchor": "true" },
        },
        {
          axes: [{ name: "pl7.app/sampleId" }, { name: "pl7.app/variantKey" }],
          annotations: { "pl7.app/isAnchor": "true" },
        },
      ],
      {},
    ),
  )

  .output(
    "modality",
    (ctx): Modality | undefined => {
      if (ctx.data.datasetRef === undefined) return undefined;
      const spec = ctx.resultPool.getPColumnSpecByRef(ctx.data.datasetRef);
      if (spec === undefined) return undefined;
      return isPeptideAxis(spec.axesSpec[1]) ? "peptide" : "antibody_tcr";
    },
    { retentive: true },
  )

  .output("targetOptions", (ctx) => {
    const ref = ctx.data.datasetRef;
    if (ref === undefined) return undefined;

    const datasetSpec = ctx.resultPool.getPColumnSpecByRef(ref);
    const datasetAxis = datasetSpec?.axesSpec[1];
    const isPeptide = isPeptideAxis(datasetAxis);

    // Whether records carry two chains in one frame, in the `pl7.app/vdj/scClonotypeChain`
    // COLUMN domain. Legacy MiXCR single-cell says so on the axis name; an imported paired set
    // says it only on the columns, so ask for such a column rather than trusting the axis.
    const perChainColumns = isPeptide
      ? undefined
      : ctx.resultPool.getAnchoredPColumns({ main: ref }, [
          {
            name: "pl7.app/vdj/sequence",
            domain: { "pl7.app/vdj/scClonotypeChain/index": "primary" },
          },
        ]);
    const isPaired =
      datasetAxis?.name === "pl7.app/vdj/scClonotypeKey" || (perChainColumns?.length ?? 0) > 0;

    const sequenceMatchers = [];
    if (isPeptide) {
      sequenceMatchers.push({
        axes: [{ anchor: "main", idx: 1 }],
        name: "pl7.app/sequence",
        domain: { "pl7.app/feature": "peptide" },
      });
    } else if (isPaired) {
      // Primary allele only — a secondary would offer the same chain twice.
      sequenceMatchers.push({
        axes: [{ anchor: "main", idx: 1 }],
        name: "pl7.app/vdj/sequence",
        domain: { "pl7.app/vdj/scClonotypeChain/index": "primary" },
      });
    } else {
      sequenceMatchers.push({
        axes: [{ anchor: "main", idx: 1 }],
        name: "pl7.app/vdj/sequence",
        domain: {},
      });
    }

    // scFv upstreams (mixcr-scfv-clonotyping) additionally expose the whole
    // VH-linker-VL construct as one column under a distinct name, alongside the
    // per-chain `pl7.app/vdj/sequence` columns. Offer it so an assay table that
    // carries full construct sequences can be matched directly, instead of
    // forcing the user to pick a single chain.
    //
    // Probed before the selector is added (idiom from clonotype-clustering) so
    // datasets without such columns are unaffected. Alphabet is left
    // unconstrained: the block resolves it from the chosen column via the
    // `targetSequenceType` output, and both nt and aa constructs are emitted.
    if (!isPeptide) {
      const scFvColumns = ctx.resultPool.getAnchoredPColumns({ main: ref }, [
        { name: "pl7.app/vdj/scFv-sequence" },
      ]);
      if (scFvColumns && scFvColumns.length > 0) {
        sequenceMatchers.push({
          axes: [{ anchor: "main", idx: 1 }],
          name: "pl7.app/vdj/scFv-sequence",
          domain: {},
        });
      }
    }

    return ctx.resultPool.getCanonicalOptions({ main: ref }, sequenceMatchers, {
      ignoreMissingDomains: true,
      labelOps: {
        includeNativeLabel: true,
      },
    });
  })

  // Alphabet of the currently-selected target sequence column. Used by the UI
  // to gate the Sequence Match option: substring matching cannot work across
  // alphabets (MMseqs2 handles that via translated search; Sequence Match is
  // same-alphabet only). Returns undefined while unresolved — the UI gate is
  // permissive and the workflow asserts as the hard backstop.
  //
  // `targetRef` is an SUniversalPColumnId — a JSON-serialized anchored selector,
  // not a PlRef — so it is resolved by parsing it and passing it straight to
  // getAnchoredPColumns as the selector (idiom from clonotype-space). It cannot
  // go through getPColumnSpecByRef, which takes a PlRef.
  .output("targetSequenceType", (ctx): "nucleotide" | "aminoacid" | undefined => {
    const datasetRef = ctx.data.datasetRef;
    const targetRef = ctx.data.targetRef;
    if (datasetRef === undefined || targetRef === undefined) return undefined;

    const colId = JSON.parse(targetRef) as never;
    const spec = ctx.resultPool.getAnchoredPColumns({ main: datasetRef }, [colId])?.[0]?.spec;
    const alphabet = spec?.domain?.["pl7.app/alphabet"];
    return alphabet === "nucleotide" || alphabet === "aminoacid" ? alphabet : undefined;
  })

  // `traverse` is the SDK's replacement for the removed `resolveAny` — it does not
  // assert a field type, whereas `resolve` defaults to Input.
  .output("assayFileHandle", (ctx) => ctx.prerun?.traverse({ field: "assayFile" })?.getFileHandle())

  .output(
    "dataImportHandle",
    (ctx) => ctx.outputs?.resolve("dataImportHandle")?.getImportProgress(),
    { isActive: true },
  )

  .outputWithStatus("table", (ctx) => {
    if (ctx.outputs?.resolve("emptyClonesInput")?.getDataAsJson<boolean>() === true) {
      return undefined;
    }
    const cols = ctx.outputs?.resolve("table")?.getPColumns();
    if (cols === undefined) return undefined;
    return createPlDataTableV2(ctx, cols, ctx.data.tableState);
  })

  .output("pf", (ctx) => {
    if (ctx.outputs?.resolve("emptyClonesInput")?.getDataAsJson<boolean>() === true) {
      return undefined;
    }
    const cols = ctx.outputs?.resolve("table")?.getPColumns();
    if (cols === undefined) return undefined;
    return createPFrameForGraphs(ctx, cols);
  })

  .output("assaySequenceSpec", (ctx): PColumnSpec | undefined => {
    if (ctx.outputs?.resolve("emptyClonesInput")?.getDataAsJson<boolean>() === true) {
      return undefined;
    }
    const cols = ctx.outputs?.resolve("table")?.getPColumns();
    if (cols === undefined) return undefined;
    return cols.find(
      (c) =>
        c.spec.name === "pl7.app/sequence" &&
        c.spec.axesSpec[0].name === "pl7.app/assay/sequenceId",
    )?.spec;
  })

  .output("msaPf", (ctx) => {
    if (ctx.outputs?.resolve("emptyClonesInput")?.getDataAsJson<boolean>() === true) {
      return undefined;
    }
    const cols = ctx.outputs?.resolve("table")?.getPColumns();
    if (cols === undefined) return undefined;

    const msaCols = ctx.outputs?.resolve("assayLinkerPframe")?.getPColumns();
    if (!msaCols) return undefined;

    const props = getAnchoredClonotypeProps(ctx);
    if (!props) return undefined;

    return createPFrameForGraphs(ctx, [...msaCols, ...cols, ...props]);
  })

  .output(
    "emptyClonesInput",
    (ctx) => ctx.outputs?.resolve("emptyClonesInput")?.getDataAsJson<boolean>() === true,
  )

  .output("isRunning", (ctx) => ctx.outputs?.getIsReadyOrError() === false)

  .title(() => "Import Assay Data")

  .subtitle((ctx) => ctx.data.customBlockLabel || deriveDefaultLabel(ctx.data))

  .sections((_ctx) => [{ type: "link" as const, href: "/" as const, label: "Main" }])

  .done();

export type Platforma = typeof platforma;
export type BlockOutputs = InferOutputsType<typeof platforma>;

export { getDefaultBlockLabel } from "./label";
export * from "./types";
