<script setup lang="ts">
import { PlMultiSequenceAlignment } from "@milaboratories/multi-sequence-alignment";
import strings from "@milaboratories/strings";
import {
  getDefaultBlockLabel,
  type Settings,
} from "@platforma-open/milaboratories.immune-assay-data.model";
import type {
  AxisId,
  ImportFileHandle,
  LocalImportFileHandle,
  PlSelectionModel,
  PTableKey,
} from "@platforma-sdk/model";
import {
  getFileNameFromHandle,
  getRawPlatformaInstance,
  isImportFileHandleUpload,
} from "@platforma-sdk/model";
import {
  PlAccordionSection,
  PlAgDataTableV2,
  PlAlert,
  PlBlockPage,
  PlBtnGhost,
  PlBtnGroup,
  PlCheckbox,
  PlDropdown,
  PlDropdownMulti,
  PlDropdownRef,
  PlFileInput,
  PlMaskIcon24,
  PlNumberField,
  PlSectionSeparator,
  PlSlideModal,
  PlTooltip,
  ReactiveFileContent,
  usePlDataTableSettingsV2,
} from "@platforma-sdk/ui-vue";
import { computed, reactive, ref, watch } from "vue";
import * as XLSX from "xlsx";
import { useApp } from "../app";

import { processFileBytes } from "../importFile";
import { isAssayColumn, isSequenceColumn } from "../util";

const app = useApp();
const reactiveFileContent = ReactiveFileContent.useGlobal();

// Modality-aware threshold defaults. Applied by the watcher below when the
// resolved modality changes; switching between two datasets of the same
// modality preserves user-tuned thresholds.
const ANTIBODY_DEFAULTS: Settings = {
  similarityType: "alignment-score",
  identity: 0.9,
  coverageThreshold: 0.95,
};
const PEPTIDE_DEFAULTS: Settings = {
  similarityType: "sequence-identity",
  identity: 1.0,
  coverageThreshold: 1.0,
};

const defaultLabel = computed(() =>
  getDefaultBlockLabel({
    fileName: app.model.data.fileHandle
      ? getFileNameFromHandle(app.model.data.fileHandle)
      : undefined,
    similarityType: app.model.data.settings.similarityType,
    identity: app.model.data.settings.identity,
    coverageThreshold: app.model.data.settings.coverageThreshold,
  }),
);

const settingsOpen = ref(app.model.data.datasetRef === undefined);
const multipleSequenceAlignmentAssayOpen = ref(false);
const multipleSequenceAlignmentClonotypesOpen = ref(false);

// Auto-close settings panel when block starts running
watch(
  () => app.model.outputs.isRunning,
  (isRunning, wasRunning) => {
    if (isRunning && !wasRunning) {
      settingsOpen.value = false;
    }
  },
);

// Apply modality-aware threshold defaults when the resolved modality flips.
watch(
  () => app.model.outputs.modality,
  (modality) => {
    if (!modality) return;
    if (app.model.data.lastAppliedModality === modality) return;
    app.model.data.settings = modality === "peptide" ? PEPTIDE_DEFAULTS : ANTIBODY_DEFAULTS;
    app.model.data.lastAppliedModality = modality;
  },
);

const tableSettings = usePlDataTableSettingsV2({
  model: () => app.model.outputs.table,
});

const selection = ref<PlSelectionModel>({
  axesSpec: [],
  selectedKeys: [],
});

const selectionAssay = ref<PlSelectionModel>({
  axesSpec: [],
  selectedKeys: [],
});

// Define the assay sequence axis for the cell button
const assayAxis = computed<AxisId>(() => {
  if (app.model.outputs.assaySequenceSpec?.axesSpec[0] === undefined) {
    return {
      type: "String",
      name: "pl7.app/assay/sequenceId",
      domain: {},
    };
  } else {
    return {
      type: "String",
      name: "pl7.app/assay/sequenceId",
      domain: app.model.outputs.assaySequenceSpec.axesSpec[0].domain,
    };
  }
});

// Open MSA when we click in a row
const onRowDoubleClicked = reactive((key?: PTableKey) => {
  if (key) {
    const assaySpecs = app.model.outputs.assaySequenceSpec;
    if (assaySpecs === undefined) return;
    selection.value = {
      axesSpec: [assaySpecs.axesSpec[0]],
      selectedKeys: [key],
    };
  }
  multipleSequenceAlignmentClonotypesOpen.value = true;
});

// Reactive file bytes — available once the prerun imports the file (works for local + remote)
const assayFileBytes = computed(() => {
  const handle = app.model.outputs.assayFileHandle;
  if (!handle) return undefined;
  return reactiveFileContent.getContentBytes(handle.handle).value;
});

// For remote files: detect columns once the prerun has imported the file and
// bytes arrive. Guarded so it doesn't re-run if a local file already processed
// bytes synchronously. The harness flags any `outputs → data` watcher as a
// hairpin; here the multi-client write race is muted because both clients
// compute identical `importColumns`/`detectedXsvType` from identical bytes,
// making racing writes idempotent.
watch(assayFileBytes, (bytes) => {
  if (!bytes || !app.model.data.fileHandle) return;
  if (app.model.data.importColumns !== undefined) return;
  processFileBytes(bytes, app.model.data.fileExtension);
});

const setFile = async (file: ImportFileHandle | undefined) => {
  // Clear all dependent state so the new file's columns are detected fresh.
  app.model.data.importColumns = undefined;
  app.model.data.sequenceColumnHeader = undefined;
  app.model.data.selectedColumns = [];
  app.model.data.detectedXsvType = undefined;
  app.model.data.fileImportError = undefined;

  if (!file) {
    app.model.data.fileHandle = undefined;
    app.model.data.fileExtension = undefined;
    return;
  }

  const fileName = getFileNameFromHandle(file);
  const extension = fileName.split(".").pop()?.toLowerCase();
  app.model.data.fileExtension = extension;
  // Setting fileHandle triggers the prerun (needed for remote files and the workflow).
  app.model.data.fileHandle = file;

  // For local (upload://) files: process bytes immediately from disk — no prerun round-trip needed.
  // Remote (index://) files fall through to the assayFileBytes watch above.
  if (isImportFileHandleUpload(file)) {
    try {
      const data = await getRawPlatformaInstance().lsDriver.getLocalFileContent(
        file as LocalImportFileHandle,
      );
      processFileBytes(data, extension);
    } catch (e) {
      console.error("Failed to read local file content:", e);
    }
  }
};

// Validate selected sequence column for uniqueness when the user picks one.
watch(
  () => app.model.data.sequenceColumnHeader,
  (newHeader) => {
    if (!newHeader || !app.model.data.fileHandle) {
      app.model.data.fileImportError = undefined;
      return;
    }

    // Skip uniqueness check for FASTA — bytes are FASTA-encoded, not XLSX-parseable
    const ext = app.model.data.fileExtension;
    if (ext === "fasta" || ext === "fa") return;

    const bytes = assayFileBytes.value;
    if (!bytes) return;

    try {
      const wb = XLSX.read(bytes);
      const worksheet = wb.Sheets[wb.SheetNames[0]];
      const rawData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        raw: true,
        blankrows: false,
      }) as string[][];

      const headerRow = rawData[0];
      const colIndex = headerRow.indexOf(newHeader);
      if (colIndex === -1) return;

      const sequences = rawData
        .slice(1)
        .map((row) => row[colIndex])
        .filter(Boolean);
      const uniqueSequences = new Set(sequences);

      if (sequences.length !== uniqueSequences.size) {
        app.model.data.fileImportError = `The selected sequence column '${newHeader}' contains duplicate values.`;
      } else {
        app.model.data.fileImportError = undefined;
      }
    } catch (e) {
      console.error("Failed to validate sequence uniqueness:", e);
      app.model.data.fileImportError = "Could not validate sequence uniqueness.";
    }
  },
);

const sequenceColumnOptions = computed(() => {
  if (!app.model.data.fileHandle) return [];
  return app.model.data.importColumns
    ?.filter((c) => c.sequenceType !== undefined)
    ?.map((c) => ({
      label: c.header,
      value: c.header,
    }));
});

const otherColumnOptions = computed(() => {
  if (!app.model.data.fileHandle) return [];
  return app.model.data.importColumns
    ?.filter((c) => c.header !== app.model.data.sequenceColumnHeader)
    ?.map((c) => ({
      label: c.header,
      value: c.header,
    }));
});

// Top-level matching approach: Alignment (MMseqs2) vs Sequence Match (exact,
// byte-identical, recall-guaranteed). Derived from settings.similarityType —
// 'exact-match' is Sequence Match; the other two are Alignment sub-modes.
const matchingApproach = computed(() =>
  app.model.data.settings.similarityType === "exact-match" ? "sequence-match" : "alignment",
);

// Remember the last Alignment sub-mode so toggling back from Sequence Match
// restores the user's choice instead of always resetting to BLOSUM.
const lastAlignmentType = ref<"alignment-score" | "sequence-identity">(
  app.model.data.settings.similarityType === "sequence-identity"
    ? "sequence-identity"
    : "alignment-score",
);
watch(
  () => app.model.data.settings.similarityType,
  (t) => {
    if (t === "alignment-score" || t === "sequence-identity") lastAlignmentType.value = t;
  },
);

function setMatchingApproach(value: string) {
  app.model.data.settings.similarityType =
    value === "sequence-match" ? "exact-match" : lastAlignmentType.value;
}

// Sequence Match is gated: exact equality can't match across alphabets (MMseqs2
// handles that via translated search). Hide the option only when we know the
// assay and target alphabets differ; the workflow asserts as the hard backstop.
const matchingApproachOptions = computed(() => {
  const opts = [{ label: "Alignment", value: "alignment" }];
  const assayAlphabet = app.model.data.importColumns?.find(
    (c) => c.header === app.model.data.sequenceColumnHeader,
  )?.sequenceType;
  const targetAlphabet = app.model.outputs.targetSequenceType;
  const knownAndDiffer = !!assayAlphabet && !!targetAlphabet && assayAlphabet !== targetAlphabet;
  if (!knownAndDiffer) opts.push({ label: "Sequence Match", value: "sequence-match" });
  return opts;
});

// Alignment sub-modes (MMseqs2 scoring).
const similarityTypeOptions = [
  { label: "BLOSUM", value: "alignment-score" },
  { label: "Exact Match", value: "sequence-identity" },
];
</script>

<template>
  <PlBlockPage
    v-model:subtitle="app.model.data.customBlockLabel"
    :subtitle-placeholder="defaultLabel"
    title="Import Assay Data"
  >
    <template #append>
      <PlBtnGhost icon="dna" @click.stop="() => (multipleSequenceAlignmentAssayOpen = true)">
        Multiple Sequence Alignment
      </PlBtnGhost>
      <PlBtnGhost @click.stop="() => (settingsOpen = true)">
        Settings
        <template #append>
          <PlMaskIcon24 name="settings" />
        </template>
      </PlBtnGhost>
    </template>
    <PlAlert v-if="app.model.outputs.emptyClonesInput === true" type="warn" icon>
      <template #title>Empty dataset selection</template>
      The input dataset you have selected is empty or has no sequences. Please choose a different
      dataset or check your input data.
    </PlAlert>
    <PlAgDataTableV2
      v-model="app.model.data.tableState"
      v-model:selection="selectionAssay"
      :settings="tableSettings"
      show-columns-panel
      :not-ready-text="strings.callToActions.configureSettingsAndRun"
      :no-rows-text="strings.states.noDataAvailable"
      show-export-button
      :show-cell-button-for-axis-id="assayAxis"
      @cell-button-clicked="onRowDoubleClicked"
    />
    <PlSlideModal v-model="settingsOpen" :close-on-outside-click="false">
      <template #title>{{ strings.titles.settings }}</template>
      <PlDropdownRef
        v-model="app.model.data.datasetRef"
        :options="app.model.outputs.datasetOptions"
        label="Dataset"
        clearable
        required
      />
      <PlDropdown
        v-model="app.model.data.targetRef"
        :options="app.model.outputs.targetOptions"
        label="Sequence column to match"
        clearable
        required
      >
        <template #tooltip>
          Select the sequence column to align against the assay sequences. If the alphabets differ
          (e.g., amino acid input vs nucleotide assay), MMseqs2 translates automatically using the
          appropriate search mode.
        </template>
      </PlDropdown>
      <PlFileInput
        v-model="app.model.data.fileHandle"
        label="Assay data to import"
        placeholder="Assay data table"
        :extensions="['csv', 'tsv', 'fasta', 'fa', 'xlsx']"
        :error="app.model.data.fileImportError"
        required
        @update:model-value="setFile"
      >
        <template #tooltip>
          Upload a comma-separated (.csv), tab-separated (.tsv), or FASTA (.fasta/.fa) file
          containing assay data. FASTA files will be converted to a table with Header and Sequence
          columns.
        </template>
      </PlFileInput>
      <!-- @TODO: delete this after bug with not working error message in PlFileInput is fixed -->
      <span v-if="app.model.data.fileImportError" style="color: red">
        {{ app.model.data.fileImportError }}
      </span>

      <PlDropdown
        v-model="app.model.data.sequenceColumnHeader"
        :options="sequenceColumnOptions"
        label="Assay sequence column"
        placeholder="Sequence column"
        clearable
        required
      />

      <PlDropdownMulti
        v-model="app.model.data.selectedColumns"
        :options="otherColumnOptions"
        label="Assay data columns to import"
        placeholder="All columns"
        multiple
        clearable
      />

      <PlSectionSeparator>Matching parameters</PlSectionSeparator>
      <PlBtnGroup
        :model-value="matchingApproach"
        :options="matchingApproachOptions"
        label="Matching mode"
        @update:model-value="setMatchingApproach"
      >
        <template #tooltip>
          Alignment runs MMseqs2 (BLOSUM or identity scoring, with identity and coverage
          thresholds). Sequence Match reports targets that contain an assay sequence exactly
          (substring match) — no alignment, guaranteed recall, available only when the assay and
          target use the same alphabet.
        </template>
      </PlBtnGroup>

      <template v-if="matchingApproach === 'alignment'">
        <PlDropdown
          v-model="app.model.data.settings.similarityType"
          :options="similarityTypeOptions"
          label="Alignment Score"
        >
          <template #tooltip>
            BLOSUM considers biochemical similarity; Exact Match counts only identical residues.
          </template>
        </PlDropdown>

        <PlNumberField
          v-model="app.model.data.settings.identity"
          label="Score threshold"
          :min-value="0.1"
          :step="0.1"
          :max-value="1.0"
        >
          <template #tooltip>
            Sets the lowest percentage of identical residues required for a match.
          </template>
        </PlNumberField>

        <PlNumberField
          v-model="app.model.data.settings.coverageThreshold"
          label="Coverage threshold"
          :min-value="0.1"
          :step="0.1"
          :max-value="1.0"
        >
          <template #tooltip>
            Minimum fraction of residues that must align between the input sequence and the assay
            sequence to count as a match.
          </template>
        </PlNumberField>
      </template>

      <PlAccordionSection :label="strings.titles.advancedSettings">
        <PlCheckbox v-if="matchingApproach === 'alignment'" v-model="app.model.data.lessSensitive">
          Fast mode
          <PlTooltip class="info" position="top">
            <template #tooltip
              >Prioritizes speed over sensitivity. Reduces prefiltering precision, which may miss
              some weaker matches but significantly speeds up alignment for large
              datasets.</template
            >
          </PlTooltip>
        </PlCheckbox>

        <PlSectionSeparator>Resource allocation</PlSectionSeparator>
        <PlNumberField
          v-model="app.model.data.mem"
          label="Memory (GiB)"
          :min-value="1"
          :step="1"
          :max-value="1012"
        >
          <template #tooltip> Sets the amount of memory to use for the alignment. </template>
        </PlNumberField>

        <PlNumberField
          v-model="app.model.data.cpu"
          label="CPU (cores)"
          :min-value="1"
          :step="1"
          :max-value="128"
        >
          <template #tooltip> Sets the number of CPU cores to use for the alignment. </template>
        </PlNumberField>
      </PlAccordionSection>
    </PlSlideModal>
    <PlSlideModal
      v-model="multipleSequenceAlignmentAssayOpen"
      width="100%"
      :close-on-outside-click="false"
    >
      <template #title>Multiple Sequence Alignment</template>
      <PlMultiSequenceAlignment
        v-model="app.model.data.alignmentModel"
        :sequence-column-predicate="isAssayColumn"
        :p-frame="app.model.outputs.pf"
        :selection="selectionAssay"
      />
    </PlSlideModal>
    <PlSlideModal
      v-model="multipleSequenceAlignmentClonotypesOpen"
      width="100%"
      :close-on-outside-click="false"
    >
      <template #title>Multiple Sequence Alignment</template>
      <PlMultiSequenceAlignment
        v-model="app.model.data.alignmentModel"
        :sequence-column-predicate="isSequenceColumn"
        :p-frame="app.model.outputs.msaPf"
        :selection="selection"
      />
    </PlSlideModal>
  </PlBlockPage>
</template>
