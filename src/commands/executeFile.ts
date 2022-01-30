import { ExtensionContext, window, ProgressLocation, commands, StatusBarItem } from 'vscode';
import Base from './base';
import OutputProvider from '../providers/OutputProvider';

export default class ExecuteFile extends Base {
  constructor(context: ExtensionContext, statusBarItem: StatusBarItem) {
    super(context, statusBarItem);

    const outputProvider = new OutputProvider();

    commands.registerCommand('extension.executeFile', async () => {
      if (!this.selectedCluster() || !this.selectedSecret() || !this.selectedDatabase()) {
        return window.showErrorMessage('Please select a cluster, secret and database name first. Use the Select cluster command')
      }

      const editor = window.activeTextEditor;
      const activeDocumentText = editor?.document.getText();

      if (editor?.document.languageId !== 'sql') return window.showWarningMessage('Can only execute from .sql files, use Execute selection to execute part of a file');

      const parameters = window.createInputBox();
      parameters.placeholder = 'For example: [{ "name": "id", "value": { "longValue": 1 }}]';
      parameters.prompt = 'Query parameters, hit enter if not needed';
      parameters.ignoreFocusOut = true;

      parameters.show();

      parameters.onDidAccept(async () => {
        parameters.hide();
        const response = await window.withProgress(
          { location: ProgressLocation.Notification, title: 'Executing query...', cancellable: true },
          () => this.executeQuery(activeDocumentText, parameters.value),
        );

        outputProvider.renderDocument(response instanceof Error ? response.message : response);
      });
    });
  }
}
