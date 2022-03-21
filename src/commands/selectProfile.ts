import { ExtensionContext, commands, window, StatusBarItem } from 'vscode';
import { execSync } from 'child_process';
import Base from './base';

export default class SelectProfile extends Base {
  constructor(context: ExtensionContext, statusBarItem: StatusBarItem) {
    super(context, statusBarItem);

    commands.registerCommand('extension.selectProfile', async () => {
      const ListProfilesResponse = execSync('aws configure list-profiles').toString();
      const profiles = ListProfilesResponse.split('\n').filter((profile) => profile);
    
      window.showQuickPick(profiles.map((profile) => ({ detail: profile, label: profile }))).then((selectedProfile) => {
        if (selectedProfile && selectedProfile.detail !== undefined) {
          context.globalState.update('selectedProfile', selectedProfile.detail);
        }
      });
    });
  }
}
