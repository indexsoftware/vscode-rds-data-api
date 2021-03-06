import { ExtensionContext, commands, window, ProgressLocation, StatusBarItem } from 'vscode';
import Base from './base';
import OutputProvider from '../providers/OutputProvider';

export default class ExecuteSelection extends Base {
  constructor(context: ExtensionContext, statusBarItem: StatusBarItem) {
    super(context, statusBarItem);

    const outputProvider = new OutputProvider();

    commands.registerCommand('extension.executeSelection', async () => {
      if (!this.selectedCluster() || !this.selectedSecret() || !this.selectedDatabase()) {
        return window.showErrorMessage('Please select a cluster, secret and database name first. Use the Select cluster command')
      }

      const editor = window.activeTextEditor;
      const selection = editor?.selection;
      const selectionText = editor?.document.getText(selection);
    
      if (selection?.isEmpty) return window.showWarningMessage('Select a valid query to use the Execute selection command');
    
      const defaultValue = '[{ "name": "key", "value": { "stringValue": "value" }}]';
      const savedParameters = context.globalState.get('savedParameters') as string | undefined;
      const parameters = window.createInputBox();
      parameters.value = savedParameters !== undefined ? savedParameters : defaultValue;
      parameters.placeholder = `For example: ${defaultValue}`;
      parameters.prompt = 'Query parameters';
      parameters.ignoreFocusOut = true;
    
      parameters.show();
    
      parameters.onDidAccept(async () => {
        context.globalState.update('savedParameters', parameters.value);
        parameters.hide();
        const response = await window.withProgress(
          { location: ProgressLocation.Notification, title: 'Executing query...', cancellable: true },
          () => this.executeQuery(selectionText, parameters.value),
        );
    
        outputProvider.renderDocument(response instanceof Error ? response.message : response);
      });
    });
  }
}
