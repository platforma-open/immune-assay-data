import type { Modality } from "@platforma-open/milaboratories.immune-assay-data.kind";
import type { PColumnSpec } from "@platforma-sdk/model";

type AxisSpec = PColumnSpec["axesSpec"][number];

/** Entity-axis domain key by which a producer declares which kind of repertoire it made. */
const MODALITY_DOMAIN_KEY = "pl7.app/modality";

/**
 * Which family of sequence columns the dataset's producer emits.
 *
 * Kept apart from {@link Modality} on purpose. synthetic-repertoire-profiler runs one
 * pipeline over antibody/TCR parents and over designed libraries, and both emit their
 * sequences as `pl7.app/sequence` on the variant axis. So a profiler run that declares
 * itself `vdj` is antibody/TCR data whose sequences still live in the universal
 * namespace — one question cannot answer both.
 */
export type SequenceFamily =
  /** `pl7.app/sequence` with `pl7.app/feature: "peptide"` — peptide-extraction. */
  | "peptide"
  /** `pl7.app/sequence` under any feature — synthetic-repertoire-profiler. */
  | "universal"
  /** `pl7.app/vdj/sequence`, plus the scFv construct — MiXCR and import-vdj-data. */
  | "vdj";

export type InputClass = {
  modality: Modality;
  sequences: SequenceFamily;
};

const ANTIBODY_TCR_VDJ: InputClass = { modality: "antibody_tcr", sequences: "vdj" };

/**
 * What the selected dataset is, read off its entity axis.
 *
 * `pl7.app/variantKey` is deliberately modality-neutral and several producers share it, so
 * the axis name alone cannot say what the data holds. The axis domain can.
 *
 * Mirrors `datasetModality` in `workflow/src/modality.lib.tengo`, which answers the
 * modality half of the same question for the alignment path and the output labels.
 */
export function classifyDataset(axis: AxisSpec | undefined): InputClass {
  // A VDJ axis name carries its own modality; anything unrecognized is read the way the
  // block always read it, as antibody/TCR.
  if (axis?.name !== "pl7.app/variantKey") return ANTIBODY_TCR_VDJ;

  const domain = axis.domain ?? {};

  // The producer says what it made. A profiler run keeps the same
  // `pl7.app/repertoire/extractionRunId` in both of its modalities, so this declaration is
  // the only thing that separates them — read it before any heuristic below.
  const declared = domain[MODALITY_DOMAIN_KEY];
  if (declared === "vdj") return { modality: "antibody_tcr", sequences: "universal" };
  if (declared === "amplicon") return { modality: "amplicon", sequences: "universal" };

  // No declaration: peptide-extraction and import-vdj-data never emit one, and neither did
  // the profiler before it landed. The run-id key is then all that tells the producers apart.
  if (domain["pl7.app/peptide/extractionRunId"] !== undefined)
    return { modality: "peptide", sequences: "peptide" };
  if (domain["pl7.app/repertoire/extractionRunId"] !== undefined)
    return { modality: "amplicon", sequences: "universal" };
  if (domain["pl7.app/vdj/clonotypingRunId"] !== undefined) return ANTIBODY_TCR_VDJ;

  // A bare variant axis with no run-id key at all. peptide-extraction is the only producer
  // that ever shipped one, so it keeps being read as peptide.
  return { modality: "peptide", sequences: "peptide" };
}
