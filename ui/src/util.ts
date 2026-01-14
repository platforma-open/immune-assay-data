import type { PColumnIdAndSpec } from '@platforma-sdk/model';

export const isSequenceColumn = (column: PColumnIdAndSpec) => {
  return column.spec.name === 'pl7.app/vdj/sequence'
    && column.spec.axesSpec[0].name === 'pl7.app/vdj/assay/sequenceId';
};
