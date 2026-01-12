import type {
  ImportFileHandle,
  PlDataTableStateV2,
  PlRef,
  SUniversalPColumnId,
} from '@platforma-sdk/model';
import {
  BlockModel,
  createPlDataTableStateV2,
  createPlDataTableV2,
} from '@platforma-sdk/model';

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
};

export const model = BlockModel.create()

  .withArgs<BlockArgs>({
    defaultBlockLabel: '',
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

  .output('isRunning', (ctx) => ctx.outputs?.getIsReadyOrError() === false)

  .title(() => 'Immune Assay Data')

  .subtitle((ctx) => ctx.args.customBlockLabel || ctx.args.defaultBlockLabel)

  .sections((_ctx) => ([
    { type: 'link', href: '/', label: 'Main' },
  ]))

  .done(2);
