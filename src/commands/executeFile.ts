import { ExtensionContext, window, ProgressLocation, commands, StatusBarItem } from 'vscode';
import Base from './base';

export default class ExecuteFile extends Base {
  constructor(context: ExtensionContext, statusBarItem: StatusBarItem) {
    super(context, statusBarItem);

    commands.registerCommand('extension.executeFile', async () => {
      if (!this.selectedCluster || !this.selectedSecret) return window.showErrorMessage('Please select a cluster and secret first. Use the Select cluster command');

      const editor = window.activeTextEditor;
      const activeDocumentText = editor?.document.getText();

      if (editor?.document.languageId !== 'sql') return window.showWarningMessage('Can only execute from .sql files, use Execute selection to execute part of a file');

      const parameters = window.createInputBox();
      parameters.placeholder = 'Ex. [{ "name": "id", "value": { "longValue": 1 }}]';
      parameters.prompt = 'Query parameters, skip if not needed';
      parameters.ignoreFocusOut = true;

      parameters.show();

      parameters.onDidAccept(async () => {
        parameters.hide();
        const response: any = await window.withProgress(
          { location: ProgressLocation.Notification, title: 'Executing query...', cancellable: true },
          () => this.executeQuery(activeDocumentText, parameters.value),
        );

        this.outputChannel.appendLine(response instanceof Error ? response.message : JSON.stringify(response, null, 2));
        this.outputChannel.show(true);
      });
    });
  }
}
