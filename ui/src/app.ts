import { getDefaultBlockLabel, model } from '@platforma-open/milaboratories.immune-assay-data.model';
import { getFileNameFromHandle } from '@platforma-sdk/model';
import { defineApp } from '@platforma-sdk/ui-vue';
import { watchEffect } from 'vue';
import MainPage from './pages/MainPage.vue';

export const sdkPlugin = defineApp(model, (app) => {
  app.model.args.customBlockLabel ??= '';

  syncDefaultBlockLabel(app.model);

  return {
    routes: {
      '/': () => MainPage,
    },
  };
});

export const useApp = sdkPlugin.useApp;

type AppModel = ReturnType<typeof useApp>['model'];

function syncDefaultBlockLabel(model: AppModel) {
  watchEffect(() => {
    const fileName = model.args.fileHandle
      ? getFileNameFromHandle(model.args.fileHandle)
      : undefined;

    model.args.defaultBlockLabel = getDefaultBlockLabel({
      fileName,
      similarityType: model.args.settings.similarityType,
      identity: model.args.settings.identity,
      coverageThreshold: model.args.settings.coverageThreshold,
    });
  });
}
