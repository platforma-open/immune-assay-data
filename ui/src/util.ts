import type { PColumnPredicate } from '@platforma-sdk/model';
import { Annotation, Domain, PAxisName, readAnnotationJson, readDomain } from '@platforma-sdk/model';

export const isAssayColumn: PColumnPredicate = ({ spec }) =>
  spec.name === 'pl7.app/sequence'
  && spec.axesSpec[0]?.name === 'pl7.app/assay/sequenceId';

export const isSequenceColumn: PColumnPredicate = ({ spec }) => {
  if (
    spec.name === 'pl7.app/vdj/sequenceLength'
    || spec.name === 'pl7.app/sequenceLength'
    || spec.name === 'pl7.app/vdj/sequence/annotation'
  ) return false;
  if (spec.axesSpec[0]?.name === 'pl7.app/assay/sequenceId') return false;
  if (readDomain(spec, Domain.Alphabet) !== 'aminoacid') return false;
  if (
    spec.axesSpec[0]?.name === PAxisName.VDJ.ScClonotypeKey
    && readDomain(spec, Domain.VDJ.ScClonotypeChain.Index) !== 'primary'
  ) {
    return false;
  }
  // `readAnnotationJson` enforces a runtime schema lookup that fails for keys not
  // registered in the SDK's AnnotationJson map; the error is caught upstream and
  // returns undefined. So we read the neutral form by direct annotation access
  // until the SDK ships a typed constant for it.
  // TODO: replace direct access with `readAnnotationJson(spec, Annotation.IsAssemblingFeature)` after SDK rename.
  const isAssemblingFeature
    = readAnnotationJson(spec, Annotation.VDJ.IsAssemblingFeature)
      ?? spec.annotations?.['pl7.app/isAssemblingFeature'] === 'true';
  return { default: isAssemblingFeature };
};
