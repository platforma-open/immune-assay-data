<script setup lang="ts">
import { PlMultiSequenceAlignment } from '@milaboratories/multi-sequence-alignment';
import type {
  AxisId,
  ImportFileHandle,
  LocalImportFileHandle,
  PlRef,
  PlSelectionModel,
  PTableKey,
} from '@platforma-sdk/model';
import {
  getRawPlatformaInstance,
} from '@platforma-sdk/model';
import {
  PlAgDataTableV2,
  PlBlockPage,
  PlBtnGhost,
  PlDropdown,
  PlDropdownMulti,
  PlDropdownRef,
  PlFileInput,
  PlMaskIcon24,
  PlNumberField,
  PlSectionSeparator,
  PlSlideModal,
  usePlDataTableSettingsV2,
} from '@platforma-sdk/ui-vue';
import strings from '@milaboratories/strings';
import {
  computed,
  reactive,
  ref,
  watch,
} from 'vue';
import * as XLSX from 'xlsx';
import {
  useApp,
} from '../app';

import { importFile } from '../importFile';
import {
  isAssayColumn,
  isSequenceColumn,
} from '../util';

const app = useApp();

function setDataset(ref: PlRef | undefined) {
  app.model.args.datasetRef = ref;
}
const settingsOpen = ref(app.model.args.datasetRef === undefined);
const multipleSequenceAlignmentAssayOpen = ref(false);
const multipleSequenceAlignmentClonotypesOpen = ref(false);

// Auto-close settings panel when block starts running
watch(
  () => app.model.outputs.isRunning,
  (isRunning, wasRunning) => {
    // Close settings when block starts running (false -> true transition)
    if (isRunning && !wasRunning) {
      settingsOpen.value = false;
    }
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
      type: 'String',
      name: 'pl7.app/vdj/assay/sequenceId',
      domain: {},
    };
  } else {
    return {
      type: 'String',
      name: 'pl7.app/vdj/assay/sequenceId',
      domain: app.model.outputs.assaySequenceSpec.axesSpec[0].domain,
    };
  }
});

// Open MSA when we click in a row
const onRowDoubleClicked = reactive((key?: PTableKey) => {
  // Using keys (that will contain assay ID) we get included clonotypes
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

const setFile = async (file: ImportFileHandle | undefined) => {
  if (!file) {
    return;
  }
  importFile(file as LocalImportFileHandle);
};

// Watch for when the file is removed to reset dependent fields
watch(
  () => app.model.args.fileHandle,
  (newFileHandle) => {
    if (!newFileHandle) {
      app.model.args.sequenceColumnHeader = undefined;
      app.model.args.selectedColumns = [];
    }
  },
);

// Watch for when the user selects a sequence column to validate it
watch(
  () => app.model.args.sequenceColumnHeader,
  async (newHeader) => {
    if (!newHeader || !app.model.args.fileHandle) {
      app.model.ui.fileImportError = undefined;
      return;
    }

    try {
      const data = await getRawPlatformaInstance().lsDriver.getLocalFileContent(
        app.model.args.fileHandle as LocalImportFileHandle,
      );
      const wb = XLSX.read(data);
      const worksheet = wb.Sheets[wb.SheetNames[0]];
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true, blankrows: false }) as string[][];

      const headerRow = rawData[0];
      const colIndex = headerRow.indexOf(newHeader);
      if (colIndex === -1) return;

      const sequences = rawData.slice(1).map((row) => row[colIndex]).filter(Boolean);
      const uniqueSequences = new Set(sequences);

      if (sequences.length !== uniqueSequences.size) {
        app.model.ui.fileImportError = `The selected sequence column '${newHeader}' contains duplicate values.`;
      } else {
        app.model.ui.fileImportError = undefined;
      }
    } catch (e) {
      console.error('Failed to validate sequence uniqueness:', e);
      app.model.ui.fileImportError = 'Could not read file to validate sequence uniqueness.';
    }
  },
);

const sequenceColumnOptions = computed(() => {
  return app.model.args.importColumns
    ?.filter((c) => c.sequenceType !== undefined)
    ?.map((c) => ({
      label: c.header,
      value: c.header,
    }));
});

const otherColumnOptions = computed(() => {
  return app.model.args.importColumns
    ?.filter((c) => c.header !== app.model.args.sequenceColumnHeader)
    ?.map((c) => ({
      label: c.header,
      value: c.header,
    }));
});

const similarityTypeOptions = [
  { label: 'BLOSUM', value: 'alignment-score' },
  { label: 'Exact Match', value: 'sequence-identity' },
];

// const coverageModeOptions = [
//   { label: 'Coverage of clone and assay sequences', value: 0 },
//   { label: 'Coverage of assay sequence', value: 1 },
//   { label: 'Coverage of clone sequence', value: 2 },
//   { label: 'Target length ≥ x% of clone length', value: 3 },
//   { label: 'Query length ≥ x% of assay sequence length', value: 4 },
//   { label: 'Shorter sequence ≥ x% of longer', value: 5 },
// ];
</script>

<template>
  <PlBlockPage
    v-model:subtitle="app.model.args.customBlockLabel"
    :subtitle-placeholder="app.model.args.defaultBlockLabel"
    title="Immune Assay Data"
  >
    <template #append>
      <PlBtnGhost
        icon="dna"
        @click.stop="() => (multipleSequenceAlignmentAssayOpen = true)"
      >
        Multiple Sequence Alignment
      </PlBtnGhost>
      <PlBtnGhost @click.stop="() => (settingsOpen = true)">
        Settings
        <template #append>
          <PlMaskIcon24 name="settings" />
        </template>
      </PlBtnGhost>
    </template>
    <PlAgDataTableV2
      v-model="app.model.ui.tableState"
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
        :model-value="app.model.args.datasetRef" :options="app.model.outputs.datasetOptions"
        label="Dataset" clearable required @update:model-value="setDataset"
      />
      <PlDropdown
        v-model="app.model.args.targetRef" :options="app.model.outputs.targetOptions"
        label="Clonotype sequence to match" clearable required
      >
        <template #tooltip>
          Select the sequence column used to match the assay data sequence with. If you select amino acid sequence and
          the assay data sequence is nucleotide, the assay data sequence will be converted to amino acid sequence
          automatically.
        </template>
      </PlDropdown>
      <PlFileInput
        v-model="app.model.args.fileHandle" label="Assay data to import" placeholder="Assay data table"
        :extensions="['csv', 'tsv', 'fasta', 'fa']" :error="app.model.ui.fileImportError" required @update:model-value="setFile"
      >
        <template #tooltip>
          Upload a comma-separated (.csv), tab-separated (.tsv), or FASTA (.fasta/.fa) file containing assay data. FASTA files will be converted to a table with Header and Sequence columns.
        </template>
      </PlFileInput>
      <!-- @TODO: delete this after bug with not working error message in PlFileInput is fixed -->
      <span v-if="app.model.ui.fileImportError" style="color: red;">
        {{ app.model.ui.fileImportError }}
      </span>

      <PlDropdown
        v-model="app.model.args.sequenceColumnHeader"
        :options="sequenceColumnOptions"
        label="Assay sequence column"
        placeholder="Sequence column"
        clearable
        required
      />

      <PlDropdownMulti
        v-model="app.model.args.selectedColumns"
        :options="otherColumnOptions"
        label="Assay data columns to import"
        placeholder="All columns"
        multiple
        clearable
      />

      <PlSectionSeparator>Matching parameters</PlSectionSeparator>
      <PlDropdown
        v-model="app.model.args.settings.similarityType" :options="similarityTypeOptions"
        label="Alignment Score"
      >
        <template #tooltip>
          Select the similarity metric used for matching thresholds. BLOSUM considers biochemical similarity while Exact
          Match counts only identical residues.
        </template>
      </PlDropdown>

      <PlNumberField
        v-model="app.model.args.settings.identity"
        label="Score threshold" :min-value="0.1" :step="0.1" :max-value="1.0"
      >
        <template #tooltip>
          Sets the lowest percentage of identical residues required for a match.
        </template>
      </PlNumberField>

      <PlNumberField
        v-model="app.model.args.settings.coverageThreshold"
        label="Coverage threshold"
        :min-value="0.1"
        :step="0.1"
        :max-value="1.0"
      >
        <template #tooltip>
          Select min fraction of aligned (covered) residues of clonotypes in the cluster.
        </template>
      </PlNumberField>
    </PlSlideModal>
    <PlSlideModal
      v-model="multipleSequenceAlignmentAssayOpen"
      width="100%"
      :close-on-outside-click="false"
    >
      <template #title>Multiple Sequence Alignment</template>
      <PlMultiSequenceAlignment
        v-model="app.model.ui.alignmentModel"
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
        v-model="app.model.ui.alignmentModel"
        :sequence-column-predicate="isSequenceColumn"
        :p-frame="app.model.outputs.msaPf"
        :selection="selection"
      />
    </PlSlideModal>
  </PlBlockPage>
</template>
