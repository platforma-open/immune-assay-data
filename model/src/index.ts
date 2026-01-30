import type {
  DataInfo,
  ImportFileHandle,
  PColumn,
  PColumnSpec,
  PColumnValues,
  PlDataTableStateV2,
  PlMultiSequenceAlignmentModel,
  PlRef,
  RenderCtxLegacy,
  SUniversalPColumnId,
  TreeNodeAccessor,
} from '@platforma-sdk/model';
import {
  BlockModel,
  createPFrameForGraphs,
  createPlDataTableStateV2,
  createPlDataTableV2,
} from '@platforma-sdk/model';
import { getDefaultBlockLabel } from './label';

type Settings = {
  coverageThreshold: number; // fraction of aligned residues required
  identity: number;
  similarityType: 'sequence-identity' | 'alignment-score';
};

export type ImportColumnInfo = {
  header: string;
  type: 'Int' | 'Double' | 'String';
  /** If this column is a sequence column, the type of the sequence */
  sequenceType?: 'nucleotide' | 'aminoacid';
};

export type BlockArgs = {
  defaultBlockLabel: string;
  customBlockLabel: string;
  datasetRef?: PlRef;
  targetRef?: SUniversalPColumnId;
  fileHandle?: ImportFileHandle;
  fileExtension?: string;
  importColumns?: ImportColumnInfo[];
  sequenceColumnHeader?: string;
  selectedColumns: string[];
  settings: Settings;
};

export type UiState = {
  fileImportError?: string;
  tableState: PlDataTableStateV2;
  alignmentModel: PlMultiSequenceAlignmentModel;
};

type Column = PColumn<DataInfo<TreeNodeAccessor> | TreeNodeAccessor | PColumnValues>;

type Columns = {
  props: Column[];
};

function getColumns(ctx: RenderCtxLegacy<BlockArgs, UiState>): Columns | undefined {
  const anchor = ctx.args.datasetRef;
  if (anchor === undefined)
    return undefined;

  const anchorSpec = ctx.resultPool.getPColumnSpecByRef(anchor);
  if (anchorSpec === undefined)
    return undefined;

  // all clone properties
  const props = (ctx.resultPool.getAnchoredPColumns(
    { main: anchor },
    [
      {
        axes: [{ anchor: 'main', idx: 1 }],
      },
    ]) ?? [])
    .filter((p) => p.spec.annotations?.['pl7.app/sequence/isAnnotation'] !== 'true');

  return {
    props: props,
  };
}

export const model = BlockModel.create()

  .withArgs<BlockArgs>({
    defaultBlockLabel: getDefaultBlockLabel({
      similarityType: 'alignment-score',
      identity: 0.9,
      coverageThreshold: 0.95,
    }),
    customBlockLabel: '',
    settings: {
      coverageThreshold: 0.95, // default value matching MMseqs2 default
      identity: 0.9,
      similarityType: 'alignment-score',
    },
    selectedColumns: [],
  })

  .withUiState<UiState>({
    tableState: createPlDataTableStateV2(),
    alignmentModel: {},
  })

  .argsValid((ctx) =>
    ctx.args.datasetRef !== undefined
    && ctx.args.fileHandle !== undefined
    && ctx.args.importColumns !== undefined
    && ctx.args.sequenceColumnHeader !== undefined
    && ctx.args.targetRef !== undefined
    && ctx.uiState.fileImportError === undefined,
  )

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
    }], { refsWithEnrichments: true }),
  )

  .output('targetOptions', (ctx) => {
    const ref = ctx.args.datasetRef;
    if (ref === undefined) return undefined;

    const isSingleCell = ctx.resultPool.getPColumnSpecByRef(ref)?.axesSpec[1].name === 'pl7.app/vdj/scClonotypeKey';
    const sequenceMatchers = [];
    // const allowedFeatures = ['CDR1', 'CDR2', 'CDR3', 'FR1', 'FR2',
    //   'FR3', 'FR4', 'VDJRegion'];
    // for (const feature of allowedFeatures) {
    if (isSingleCell) {
      sequenceMatchers.push({
        axes: [{ anchor: 'main', idx: 1 }],
        name: 'pl7.app/vdj/sequence',
        domain: {
          // 'pl7.app/vdj/feature': feature,
          'pl7.app/vdj/scClonotypeChain/index': 'primary',
        },
      });
    } else {
      sequenceMatchers.push({
        axes: [{ anchor: 'main', idx: 1 }],
        name: 'pl7.app/vdj/sequence',
        domain: {
          // 'pl7.app/vdj/feature': feature,
        },
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

  .output(
    'dataImportHandle',
    (ctx) => ctx.outputs?.resolve('dataImportHandle')?.getImportProgress(),
    { isActive: true },
  )

  .outputWithStatus('table', (ctx) => {
    if (ctx.outputs?.resolve('emptyResults')?.getDataAsJson<boolean>()) {
      return undefined;
    }
    const cols = ctx.outputs?.resolve('table')?.getPColumns();
    if (cols === undefined)
      return undefined;

    return createPlDataTableV2(
      ctx,
      cols,
      ctx.uiState.tableState,
    );
  })

  .output('pf', (ctx) => {
    if (ctx.outputs?.resolve('emptyResults')?.getDataAsJson<boolean>()) {
      return undefined;
    }
    const cols = ctx.outputs?.resolve('table')?.getPColumns();
    if (cols === undefined)
      return undefined;

    return createPFrameForGraphs(ctx, cols);
  })

  .output('assaySequenceSpec', (ctx): PColumnSpec | undefined => {
    if (ctx.outputs?.resolve('emptyResults')?.getDataAsJson<boolean>()) {
      return undefined;
    }
    const cols = ctx.outputs?.resolve('table')?.getPColumns();
    if (cols === undefined)
      return undefined;
    // Return only sequence column
    return cols.find((c) => c.spec.name === 'pl7.app/vdj/sequence'
      && c.spec.axesSpec[0].name === 'pl7.app/vdj/assay/sequenceId')?.spec;
  })

  .output('msaPf', (ctx) => {
    if (ctx.outputs?.resolve('emptyResults')?.getDataAsJson<boolean>()) {
      return undefined;
    }
    const cols = ctx.outputs?.resolve('table')?.getPColumns();
    if (cols === undefined)
      return undefined;

    const msaCols = ctx.outputs?.resolve('assayLinkerPframe')?.getPColumns();
    if (!msaCols) return undefined;

    const columns = getColumns(ctx);
    if (columns === undefined) {
      return undefined;
    }

    return createPFrameForGraphs(ctx, [...msaCols, ...cols, ...columns.props]);
  })

  .output('isRunning', (ctx) => ctx.outputs?.getIsReadyOrError() === false)

  .title(() => 'Immune Assay Data')

  .subtitle((ctx) => ctx.args.customBlockLabel || ctx.args.defaultBlockLabel)

  .sections((_ctx) => ([
    { type: 'link', href: '/', label: 'Main' },
  ]))

  .done(2);

export { getDefaultBlockLabel } from './label';
