import { ExtensionContext, commands, window, StatusBarItem } from 'vscode';
import Base from './base';

export default class ClearSelectedCluster extends Base {
  constructor(context: ExtensionContext, statusBarItem: StatusBarItem) {
    super(context, statusBarItem);

    commands.registerCommand('extension.clearSelectedCluster', () => {
      const optionList = window.createQuickPick();
      optionList.title = 'Are you sure you want to clear you selected cluster an secret?';
      optionList.items = [{ label: 'Yes' }, { label: 'No' }];
    
      optionList.onDidChangeSelection(([selection]) => {
        if (selection.label === 'Yes') {
          context.globalState.update('selectedCluster', undefined);
          context.globalState.update('selectedSecret', undefined);
          context.globalState.update('selectedDatabase', undefined);

          window.showInformationMessage('Selected cluster, secret and database cleared');

          if (this.statusBarItem) this.statusBarItem.text = '$(database) No cluster selected';
        } else {
          window.showWarningMessage('Clear command aborted');
        }

        optionList.hide();
      });
    
      optionList.show();
    });
  }
}
