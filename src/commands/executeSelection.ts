import { ExtensionContext, commands, window, ProgressLocation, StatusBarItem } from 'vscode';
import Base from './base';

export default class ExecuteSelection extends Base {
  constructor(context: ExtensionContext, statusBarItem: StatusBarItem) {
    super(context, statusBarItem);

    commands.registerCommand('extension.executeSelection', async () => {
      if (!this.selectedCluster || !this.selectedSecret) return window.showErrorMessage('Please select a cluster and secret first. Use the Select cluster command');

      const editor = window.activeTextEditor;
      const selection = editor?.selection;
      const selectionText = editor?.document.getText(selection);
    
      if (selection?.isEmpty) return window.showWarningMessage('Select a valid query to use the Execute selection command');
    
      const parameters = window.createInputBox();
      parameters.placeholder = 'Ex. [{ "name": "id", "value": { "longValue": 1 }}]';
      parameters.prompt = 'Query parameters, skip if not needed';
      parameters.ignoreFocusOut = true;
    
      parameters.show();
    
      parameters.onDidAccept(async () => {
        parameters.hide();
        const response = await window.withProgress(
          { location: ProgressLocation.Notification, title: 'Executing query...', cancellable: true },
          () => this.executeQuery(selectionText, parameters.value),
        );
    
        this.outputChannel.appendLine(response instanceof Error ? response.message : JSON.stringify(response, null, 2));
        this.outputChannel.show(true);
      });
    });
  }
}
