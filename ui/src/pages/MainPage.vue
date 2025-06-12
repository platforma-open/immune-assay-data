<script setup lang="ts">
import type {
  ImportFileHandle,
  LocalImportFileHandle,
  PlRef,
} from '@platforma-sdk/model';
import {
  plRefsEqual,
} from '@platforma-sdk/model';
import type {
  PlAgDataTableSettings,
} from '@platforma-sdk/ui-vue';
import {
  PlAgDataTableToolsPanel,
  PlAgDataTableV2,
  PlBlockPage,
  PlBtnGhost,
  PlDropdown,
  PlDropdownMulti,
  PlDropdownRef,
  PlFileInput,
  PlMaskIcon24,
  PlNumberField,
  PlRow,
  PlSectionSeparator,
  PlSlideModal,
} from '@platforma-sdk/ui-vue';
import {
  computed,
  ref,
} from 'vue';
import {
  useApp,
} from '../app';

import { importFile } from '../importFile';

const app = useApp();

function setDataset(ref: PlRef | undefined) {
  app.model.args.datasetRef = ref;
  app.model.ui.title = 'Immune Assay Data - ' + (ref
    ? app.model.outputs.datasetOptions?.find((o) =>
      plRefsEqual(o.ref, ref),
    )?.label
    : '');
}
const settingsOpen = ref(app.model.args.datasetRef === undefined);

const tableSettings = computed<PlAgDataTableSettings>(() => {
  const pTable = app.model.outputs.table;

  if (pTable === undefined && !app.model.outputs.isRunning) {
    // special case: when block is not yet started at all (no table calculated)
    return undefined;
  }

  return {
    sourceType: 'ptable',
    model: pTable,
  };
});

const setFile = async (file: ImportFileHandle | undefined) => {
  if (!file) {
    return;
  }
  importFile(file as LocalImportFileHandle);
};

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
  <PlBlockPage>
    <template #title>
      {{ app.model.ui.title }}
    </template>
    <template #append>
      <PlAgDataTableToolsPanel>
        <!-- <PlMultiSequenceAlignment
          v-model="app.model.ui.alignmentModel"
          :label-column-option-predicate="isLabelColumnOption"
          :sequence-column-predicate="isSequenceColumn"
          :linker-column-predicate="isLinkerColumn"
          :p-frame="app.model.outputs.pf"
          :selection="selection"
        /> -->
      </PlAgDataTableToolsPanel>
      <PlBtnGhost @click.stop="() => (settingsOpen = true)">
        Settings
        <template #append>
          <PlMaskIcon24 name="settings" />
        </template>
      </PlBtnGhost>
    </template>
    <PlAgDataTableV2 v-model="app.model.ui.tableState" :settings="tableSettings" show-columns-panel
      show-export-button />
    <PlSlideModal v-model="settingsOpen" :close-on-outside-click="false">
      <template #title>Settings</template>
      <PlDropdownRef :model-value="app.model.args.datasetRef" :options="app.model.outputs.datasetOptions"
        label="Dataset" clearable required @update:model-value="setDataset" />
      <PlDropdown v-model="app.model.args.targetRef" :options="app.model.outputs.targetOptions"
        label="Clonotype sequence to match" clearable required>
        <template #tooltip>
          Select the sequence column used to match the assay data sequence with. If you select amino acid sequence and
          the assay data sequence is nucleotide, the assay data sequence will be converted to amino acid sequence
          automatically.
        </template>
      </PlDropdown>
      <PlFileInput v-model="app.model.args.fileHandle" label="Assay data to import" placeholder="Assay data table"
        :extensions="['.csv', '.tsv']" :error="app.model.ui.fileImportError" required @update:model-value="setFile">
        <template #tooltip>
          Upload a comma-separated (.csv) or tab-separated (.tsv) file containing assay data.
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
      <PlDropdown v-model="app.model.args.settings.similarityType" :options="similarityTypeOptions"
        label="Alignment Score">
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
  </PlBlockPage>
</template>
