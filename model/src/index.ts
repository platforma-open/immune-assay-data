import type {
  ImportFileHandle,
  InferOutputsType,
  PlDataTableState,
  PlRef,
  SUniversalPColumnId,
} from '@platforma-sdk/model';
import {
  BlockModel,
  createPlDataTableV2,
} from '@platforma-sdk/model';

type MatchCriteriaMaxPenalty = {
  type: 'minimal-similarity';
  minSimilarity: number;
};

type MatchCriteriaMinimalIdentity = {
  type: 'minimal-identity';
  minIdentity: number;
};

type MatchCriteria = MatchCriteriaMaxPenalty | MatchCriteriaMinimalIdentity;

type Settings = {
  alphabet: 'nucleotide' | 'aminoacid';
  searchLayout: 'global' | 'semilocal-target' | 'semilocal-query' | 'local';
  matchingCriteria: MatchCriteria;
};

export type BlockArgs = {
  datasetRef?: PlRef;
  targetRef?: SUniversalPColumnId;
  fileHandle?: ImportFileHandle;
  sequenceColumnHeader?: string;
  settings: Settings;
};

export type UiState = {
  title: string;
  tableState: PlDataTableState;
  headers?: string[];
};

export const model = BlockModel.create()

  .withArgs<BlockArgs>({
    settings: {
      alphabet: 'aminoacid',
      searchLayout: 'local',
      matchingCriteria: {
        type: 'minimal-identity',
        minIdentity: 0.9,
      },
    },
  })

  .withUiState<UiState>({
    title: 'Immune Assay Data',
    tableState: {
      gridState: {},
    },
  })

  .argsValid((ctx) =>
    ctx.args.datasetRef !== undefined
    && ctx.args.fileHandle !== undefined
    && ctx.args.sequenceColumnHeader !== undefined
    && ctx.args.targetRef !== undefined,
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
    const allowedFeatures = ['CDR1', 'CDR2', 'CDR3', 'FR1', 'FR2',
      'FR3', 'FR4', 'VDJRegion'];
    for (const feature of allowedFeatures) {
      if (isSingleCell) {
        sequenceMatchers.push({
          axes: [{ anchor: 'main', idx: 1 }],
          name: 'pl7.app/vdj/sequence',
          domain: {
            'pl7.app/vdj/feature': feature,
            'pl7.app/vdj/scClonotypeChain/index': 'primary',
          },
        });
      } else {
        sequenceMatchers.push({
          axes: [{ anchor: 'main', idx: 1 }],
          name: 'pl7.app/vdj/sequence',
          domain: {
            'pl7.app/vdj/feature': feature,
          },
        });
      }
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

  .output('table', (ctx) => {
    const cols = ctx.outputs?.resolve('table')?.getPColumns();
    if (cols === undefined)
      return undefined;

    return createPlDataTableV2(
      ctx,
      cols,
      (_) => true,
      ctx.uiState.tableState,
    );
  })

  .output('isRunning', (ctx) => ctx.outputs?.getIsReadyOrError() === false)

  .title((ctx) => ctx.uiState.title ?? 'Antibody/TCR Leads')

  .sections((_ctx) => ([
    { type: 'link', href: '/', label: 'Main' },
  ]))

  .done();

export type BlockOutputs = InferOutputsType<typeof model>;
