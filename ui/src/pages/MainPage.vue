<script setup lang="ts">
import type {
  ImportFileHandle,
  LocalImportFileHandle,
  PlRef,
} from '@platforma-sdk/model';
import {
  getRawPlatformaInstance,
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
  PlBtnGroup,
  PlDropdown,
  PlDropdownRef,
  PlFileInput,
  PlMaskIcon24,
  PlNumberField,
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

import * as XLSX from 'xlsx';

// Define a more specific type for raw Excel data
type ExcelRow = (string | number | boolean | Date | null)[];
type ExcelData = ExcelRow[];

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

const tableSettings = computed<PlAgDataTableSettings>(() => (
  app.model.outputs.table
    ? {
        sourceType: 'ptable',
        model: app.model.outputs.table,
      }
    : undefined
));

const setFile = async (file: ImportFileHandle | undefined) => {
  if (!file) {
    return;
  }

  app.model.args.fileHandle = file;

  const localFile = file as LocalImportFileHandle;
  const data = await getRawPlatformaInstance().lsDriver.getLocalFileContent(localFile);
  const wb = XLSX.read(data);
  const worksheet = wb.Sheets[wb.SheetNames[0]];
  const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as ExcelData;

  const header = rawData[0];
  if (header) {
    app.model.ui.headers = header as string[];
    // @TODO check there are not duplicate headers
  }
};

const sequenceColumnOptions = computed(() => {
  return app.model.ui.headers?.map((header) => ({
    label: header,
    value: header,
  }));
});

const alphabetOptions = computed(() => [
  {
    label: 'Amino acid',
    value: 'aminoacid',
  },
  {
    label: 'Nucleotide',
    value: 'nucleotide',
  },
]);

const searchLayoutOptions = computed(() => [
  {
    label: 'Global',
    value: 'global',
  },
  {
    label: 'Local',
    value: 'local',
  },
  {
    label: 'Semi-local (target)',
    value: 'semilocal-target',
  },
  {
    label: 'Semi-local (query)',
    value: 'semilocal-query',
  },
]);

const matchingCriteriaOptions = computed(() => [
  {
    label: 'Max penalty',
    value: 'max-penalty',
  },
  {
    label: 'Minimal identity',
    value: 'minimal-identity',
  },
]);
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
    <PlAgDataTableV2
      v-model="app.model.ui.tableState"
      :settings="tableSettings"
      show-columns-panel
      show-export-button
    />
    <PlSlideModal v-model="settingsOpen" :close-on-outside-click="false">
      <template #title>Settings</template>
      <PlDropdownRef
        :model-value="app.model.args.datasetRef"
        :options="app.model.outputs.datasetOptions"
        label="Select dataset"
        clearable
        required
        @update:model-value="setDataset"
      />
      <PlDropdown
        v-model="app.model.args.targetRef"
        :options="app.model.outputs.targetOptions"
        label="Select target sequence to match"
        clearable
        required
      />
      <PlFileInput
        v-model="app.model.args.fileHandle"
        label="Select assay data to import"
        placeholder="Assay data table"
        :extensions="['.csv', '.xlsx', '.tsv']"
        @update:model-value="setFile"
      />
      <PlDropdown
        v-model="app.model.args.sequenceColumnHeader"
        :options="sequenceColumnOptions"
        label="Select sequence column"
        placeholder="Sequence column"
        clearable
        required
      />
      <PlSectionSeparator>Matching parameters</PlSectionSeparator>
      <PlBtnGroup
        v-model="app.model.args.settings.alphabet"
        :options="alphabetOptions"
        label="Assay data alphabet"
        required
      />
      <PlDropdown
        v-model="app.model.args.settings.searchLayout"
        :options="searchLayoutOptions"
        label="Search layout"
        required
      />
      <PlDropdown
        v-model="app.model.args.settings.matchingCriteria.type"
        :options="matchingCriteriaOptions"
        label="Matching criteria"
        required
      />
      <PlNumberField
        v-if="app.model.args.settings.matchingCriteria.type === 'minimal-identity'"
        v-model="app.model.args.settings.matchingCriteria.minIdentity"
        label="Minimal identity"
        required
      />
      <PlNumberField
        v-if="app.model.args.settings.matchingCriteria.type === 'minimal-similarity'"
        v-model="app.model.args.settings.matchingCriteria.minSimilarity"
        label="Minimal similarity"
        required
      />
    </PlSlideModal>
  </PlBlockPage>
</template>
