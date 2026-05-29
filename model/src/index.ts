import type {
  DataInfo,
  InferOutputsType,
  PColumn,
  PColumnSpec,
  PColumnValues,
  RenderCtxBase,
  TreeNodeAccessor,
} from '@platforma-sdk/model';
import {
  BlockModelV3,
  createPFrameForGraphs,
  createPlDataTableStateV2,
  createPlDataTableV2,
  DataModelBuilder,
  getFileNameFromHandle,
} from '@platforma-sdk/model';
import { getDefaultBlockLabel } from './label';
import type {
  BlockArgs,
  BlockData,
  BlockPrerunArgs,
  LegacyBlockArgs,
  LegacyBlockUiState,
  Modality,
  Settings,
} from './types';

type Column = PColumn<DataInfo<TreeNodeAccessor> | TreeNodeAccessor | PColumnValues>;

const defaultSettings = (): Settings => ({
  coverageThreshold: 0.95,
  identity: 0.9,
  similarityType: 'alignment-score',
});

const blockDataModel = new DataModelBuilder()
  .from<BlockData>('V20260519')
  .upgradeLegacy<LegacyBlockArgs, LegacyBlockUiState>(({ args, uiState }) => ({
    customBlockLabel: args?.customBlockLabel ?? '',
    datasetRef: args?.datasetRef,
    targetRef: args?.targetRef,
    fileHandle: args?.fileHandle,
    fileExtension: args?.fileExtension,
    detectedXsvType: args?.detectedXsvType,
    importColumns: args?.importColumns,
    sequenceColumnHeader: args?.sequenceColumnHeader,
    selectedColumns: args?.selectedColumns ?? [],
    settings: args?.settings ?? defaultSettings(),
    lessSensitive: args?.lessSensitive ?? false,
    mem: args?.mem,
    cpu: args?.cpu,
    fileImportError: uiState?.fileImportError,
    tableState: uiState?.tableState ?? createPlDataTableStateV2(),
    alignmentModel: uiState?.alignmentModel ?? {},
    // Pre-peptide-support projects are always antibody/TCR; seeding this prevents
    // the modality-reset watcher from clobbering user-tuned thresholds on reopen.
    lastAppliedModality: 'antibody_tcr',
  }))
  .init(() => ({
    customBlockLabel: '',
    datasetRef: undefined,
    targetRef: undefined,
    fileHandle: undefined,
    fileExtension: undefined,
    detectedXsvType: undefined,
    importColumns: undefined,
    sequenceColumnHeader: undefined,
    selectedColumns: [],
    settings: defaultSettings(),
    lessSensitive: false,
    mem: undefined,
    cpu: undefined,
    fileImportError: undefined,
    tableState: createPlDataTableStateV2(),
    alignmentModel: {},
    lastAppliedModality: undefined,
  }));

function deriveDefaultLabel(data: BlockData): string {
  return getDefaultBlockLabel({
    fileName: data.fileHandle ? getFileNameFromHandle(data.fileHandle) : undefined,
    similarityType: data.settings.similarityType,
    identity: data.settings.identity,
    coverageThreshold: data.settings.coverageThreshold,
  });
}

function getAnchoredClonotypeProps(
  ctx: Pick<RenderCtxBase<BlockArgs, BlockData>, 'data' | 'resultPool'>,
): Column[] | undefined {
  const anchor = ctx.data.datasetRef;
  if (anchor === undefined) return undefined;
  const anchorSpec = ctx.resultPool.getPColumnSpecByRef(anchor);
  if (anchorSpec === undefined) return undefined;
  return (ctx.resultPool.getAnchoredPColumns(
    { main: anchor },
    [{ axes: [{ anchor: 'main', idx: 1 }] }],
  ) ?? []).filter(
    (p) => p.spec.annotations?.['pl7.app/sequence/isAnnotation'] !== 'true',
  );
}

export const platforma = BlockModelV3.create(blockDataModel)

  .args<BlockArgs>((data) => {
    if (data.datasetRef === undefined) throw new Error('Dataset is required');
    if (data.targetRef === undefined) throw new Error('Sequence column to match is required');
    if (data.fileHandle === undefined) throw new Error('Assay file is required');
    if (data.importColumns === undefined) throw new Error('Assay file has not been parsed yet');
    if (data.sequenceColumnHeader === undefined) throw new Error('Assay sequence column is required');
    if (data.fileImportError !== undefined) throw new Error(data.fileImportError);

    // In exact-match mode the MMseqs2-only parameters carry no meaning. Pin
    // them so editing a hidden threshold (or toggling fast mode) does not
    // stale the block.
    const exact = data.settings.similarityType === 'exact-match';

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
        ? { similarityType: 'exact-match', identity: 1, coverageThreshold: 1 }
        : data.settings,
      lessSensitive: exact ? false : data.lessSensitive,
      mem: data.mem,
      cpu: data.cpu,
    };
  })

  .prerunArgs((data): BlockPrerunArgs => ({
    fileHandle: data.fileHandle,
  }))

  .output('datasetOptions', (ctx) =>
    ctx.resultPool.getOptions([{
      axes: [
        { name: 'pl7.app/sampleId' },
        { name: 'pl7.app/vdj/clonotypeKey' },
      ],
      annotations: { 'pl7.app/isAnchor': 'true' },
    }, {
      axes: [
        { name: 'pl7.app/sampleId' },
        { name: 'pl7.app/vdj/scClonotypeKey' },
      ],
      annotations: { 'pl7.app/isAnchor': 'true' },
    }, {
      axes: [
        { name: 'pl7.app/sampleId' },
        { name: 'pl7.app/variantKey' },
      ],
      annotations: { 'pl7.app/isAnchor': 'true' },
    }], {}),
  )

  .output('modality', (ctx): Modality | undefined => {
    if (ctx.data.datasetRef === undefined) return undefined;
    const spec = ctx.resultPool.getPColumnSpecByRef(ctx.data.datasetRef);
    if (spec === undefined) return undefined;
    return spec.axesSpec[1]?.name === 'pl7.app/variantKey' ? 'peptide' : 'antibody_tcr';
  }, { retentive: true })

  .output('targetOptions', (ctx) => {
    const ref = ctx.data.datasetRef;
    if (ref === undefined) return undefined;

    const datasetAxis = ctx.resultPool.getPColumnSpecByRef(ref)?.axesSpec[1]?.name;
    const sequenceMatchers = [];
    if (datasetAxis === 'pl7.app/variantKey') {
      sequenceMatchers.push({
        axes: [{ anchor: 'main', idx: 1 }],
        name: 'pl7.app/sequence',
        domain: { 'pl7.app/feature': 'peptide' },
      });
    } else if (datasetAxis === 'pl7.app/vdj/scClonotypeKey') {
      sequenceMatchers.push({
        axes: [{ anchor: 'main', idx: 1 }],
        name: 'pl7.app/vdj/sequence',
        domain: { 'pl7.app/vdj/scClonotypeChain/index': 'primary' },
      });
    } else {
      sequenceMatchers.push({
        axes: [{ anchor: 'main', idx: 1 }],
        name: 'pl7.app/vdj/sequence',
        domain: {},
      });
    }

    return ctx.resultPool.getCanonicalOptions(
      { main: ref },
      sequenceMatchers,
      {
        ignoreMissingDomains: true,
        labelOps: {
          includeNativeLabel: true,
        },
      });
  })

  // Alphabet of the currently-selected target sequence column. Used by the UI
  // to gate the "Identical sequences" (exact) option: exact equality cannot
  // match across alphabets (MMseqs2 handles that via translated search; exact
  // mode is same-alphabet only). Returns undefined while unresolved — the UI
  // gate is permissive and the workflow asserts as the hard backstop.
  .output('targetSequenceType', (ctx): 'nucleotide' | 'aminoacid' | undefined => {
    const ref = ctx.data.datasetRef;
    const targetRef = ctx.data.targetRef;
    if (ref === undefined || targetRef === undefined) return undefined;

    const datasetAxis = ctx.resultPool.getPColumnSpecByRef(ref)?.axesSpec[1]?.name;
    const sequenceMatchers = [];
    if (datasetAxis === 'pl7.app/variantKey') {
      sequenceMatchers.push({
        axes: [{ anchor: 'main', idx: 1 }],
        name: 'pl7.app/sequence',
        domain: { 'pl7.app/feature': 'peptide' },
      });
    } else if (datasetAxis === 'pl7.app/vdj/scClonotypeKey') {
      sequenceMatchers.push({
        axes: [{ anchor: 'main', idx: 1 }],
        name: 'pl7.app/vdj/sequence',
        domain: { 'pl7.app/vdj/scClonotypeChain/index': 'primary' },
      });
    } else {
      sequenceMatchers.push({
        axes: [{ anchor: 'main', idx: 1 }],
        name: 'pl7.app/vdj/sequence',
        domain: {},
      });
    }

    const cols = ctx.resultPool.getAnchoredPColumns({ main: ref }, sequenceMatchers);
    const alphabet = cols?.find((c) => (c.id as string) === (targetRef as string))
      ?.spec.domain?.['pl7.app/alphabet'];
    return alphabet === 'nucleotide' || alphabet === 'aminoacid' ? alphabet : undefined;
  })

  .output(
    'assayFileHandle',
    (ctx) => ctx.prerun
      ?.resolveAny({ field: 'assayFile' })
      ?.getFileHandle(),
  )

  .output(
    'dataImportHandle',
    (ctx) => ctx.outputs?.resolve('dataImportHandle')?.getImportProgress(),
    { isActive: true },
  )

  .outputWithStatus('table', (ctx) => {
    if (ctx.outputs?.resolve('emptyClonesInput')?.getDataAsJson<boolean>() === true) {
      return undefined;
    }
    const cols = ctx.outputs?.resolve('table')?.getPColumns();
    if (cols === undefined) return undefined;
    return createPlDataTableV2(ctx, cols, ctx.data.tableState);
  })

  .output('pf', (ctx) => {
    if (ctx.outputs?.resolve('emptyClonesInput')?.getDataAsJson<boolean>() === true) {
      return undefined;
    }
    const cols = ctx.outputs?.resolve('table')?.getPColumns();
    if (cols === undefined) return undefined;
    return createPFrameForGraphs(ctx, cols);
  })

  .output('assaySequenceSpec', (ctx): PColumnSpec | undefined => {
    if (ctx.outputs?.resolve('emptyClonesInput')?.getDataAsJson<boolean>() === true) {
      return undefined;
    }
    const cols = ctx.outputs?.resolve('table')?.getPColumns();
    if (cols === undefined) return undefined;
    return cols.find((c) => c.spec.name === 'pl7.app/sequence'
      && c.spec.axesSpec[0].name === 'pl7.app/assay/sequenceId')?.spec;
  })

  .output('msaPf', (ctx) => {
    if (ctx.outputs?.resolve('emptyClonesInput')?.getDataAsJson<boolean>() === true) {
      return undefined;
    }
    const cols = ctx.outputs?.resolve('table')?.getPColumns();
    if (cols === undefined) return undefined;

    const msaCols = ctx.outputs?.resolve('assayLinkerPframe')?.getPColumns();
    if (!msaCols) return undefined;

    const props = getAnchoredClonotypeProps(ctx);
    if (!props) return undefined;

    return createPFrameForGraphs(ctx, [...msaCols, ...cols, ...props]);
  })

  .output('emptyClonesInput', (ctx) =>
    ctx.outputs?.resolve('emptyClonesInput')?.getDataAsJson<boolean>() === true,
  )

  .output('isRunning', (ctx) => ctx.outputs?.getIsReadyOrError() === false)

  .title(() => 'Import Assay Data')

  .subtitle((ctx) => ctx.data.customBlockLabel || deriveDefaultLabel(ctx.data))

  .sections((_ctx) => ([
    { type: 'link' as const, href: '/' as const, label: 'Main' },
  ]))

  .done();

export type Platforma = typeof platforma;
export type BlockOutputs = InferOutputsType<typeof platforma>;

export { getDefaultBlockLabel } from './label';
export * from './types';
