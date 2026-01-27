import type { PColumnPredicate, PColumnSpec } from '@platforma-sdk/model';
import { Annotation, Domain, PAxisName, PColumnName, readAnnotationJson, readDomain } from '@platforma-sdk/model';

export const isAssayColumn: PColumnPredicate = ({ spec }) =>
  spec.name === PColumnName.VDJ.Sequence
  && spec.axesSpec[0].name === PAxisName.VDJ.Assay.SequenceId;

export const isSequenceColumn: PColumnPredicate = ({ spec }) => {
  const isBulkSequence = (spec: PColumnSpec) =>
    spec.name !== 'pl7.app/vdj/sequenceLength'
    && spec.name !== 'pl7.app/vdj/sequence/annotation'
    && spec.axesSpec[0].name !== PAxisName.VDJ.Assay.SequenceId
    && readDomain(spec, Domain.Alphabet) === 'aminoacid';

  const isSingleCellSequence = (spec: PColumnSpec) =>
    spec.name !== 'pl7.app/vdj/sequenceLength'
    && spec.name !== 'pl7.app/vdj/sequence/annotation'
    && readDomain(spec, Domain.VDJ.ScClonotypeChain.Index) === 'primary'
    && readDomain(spec, Domain.Alphabet) === 'aminoacid'
    // && column.axesSpec.length >= 1
    && spec.axesSpec[0].name === PAxisName.VDJ.ScClonotypeKey;

  return (isBulkSequence(spec) || isSingleCellSequence(spec))
    && {
      default: readAnnotationJson(spec, Annotation.VDJ.IsAssemblingFeature) ?? false,
    };
};
