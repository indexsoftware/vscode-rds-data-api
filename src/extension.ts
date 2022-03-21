import { ExtensionContext, window, StatusBarAlignment } from 'vscode';
import SelectCluster from './commands/selectCluster';
import SelectProfile from './commands/selectProfile';
import ExecuteFile from './commands/executeFile';
import ExecuteSelection from './commands/executeSelection';
import ClearSelectedCluster from './commands/clearSelectedCluster';

export function activate(context: ExtensionContext) {
  const selectedCluster = context.globalState.get('selectedCluster') as string | undefined;
  const statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right, 100);

  statusBarItem.command = 'extension.selectCluster';
  statusBarItem.text = selectedCluster ? `$(database) ${selectedCluster.split(':')?.[6]}` : '$(database) No cluster selected';
  statusBarItem.show();

	new SelectCluster(context, statusBarItem);
	new SelectProfile(context, statusBarItem);
  new ClearSelectedCluster(context, statusBarItem);
  new ExecuteFile(context, statusBarItem);
  new ExecuteSelection(context, statusBarItem);
}
