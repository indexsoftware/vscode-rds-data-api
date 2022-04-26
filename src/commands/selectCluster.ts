import { ExtensionContext, commands, window, StatusBarItem, ProgressLocation } from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';
import { DescribeDBClustersCommandOutput } from '@aws-sdk/client-rds';
import { ListSecretsCommandOutput } from '@aws-sdk/client-secrets-manager';
import Base from './base';

const execAsync = promisify(exec);

export default class SelectCluster extends Base {
  constructor(context: ExtensionContext, statusBarItem: StatusBarItem) {
    super(context, statusBarItem);

    commands.registerCommand('extension.selectCluster', async () => {
      const responses = await window.withProgress({ location: ProgressLocation.Notification, title: 'Fetching RDS clusters...' }, async (progress) => {
        const DBClustersResponse = await execAsync('aws rds describe-db-clusters');
        progress.report({ message: 'Fetching Secretsmanager secrets...' });

        const SecretsResponse = await execAsync('aws secretsmanager list-secrets');
        progress.report({ message: 'Everything fetched!' });

        return new Promise<{ DBClustersResponse: any, SecretsResponse: any }>((resolve) => resolve({
          DBClustersResponse: JSON.parse(DBClustersResponse.stdout || '{}'),
          SecretsResponse: JSON.parse(SecretsResponse.stdout || '{}'),
        }));
      });
      const DBClustersResponse: DescribeDBClustersCommandOutput = responses.DBClustersResponse;
      const SecretsResponse: ListSecretsCommandOutput = responses.SecretsResponse;
      
      if (!DBClustersResponse.DBClusters) return false;
    
      window.showQuickPick(
        DBClustersResponse.DBClusters.map((DBCluster) => ({
          detail: DBCluster.DBClusterArn,
          label: DBCluster.DBClusterIdentifier || '',
        })),
      ).then((selectedCluster) => {
        if (selectedCluster && selectedCluster.detail !== undefined) {
          context.globalState.update('selectedCluster', selectedCluster.detail);
          if (this.statusBarItem) this.statusBarItem.text = `$(database) ${selectedCluster.label}`;
        }

        if (!SecretsResponse.SecretList) return false;

        window.showQuickPick(
          SecretsResponse.SecretList.map((Secret) => ({
            detail: Secret.ARN,
            label: Secret.Description || Secret.Name || '',
          }),
        )).then((selectedSecret) => {
          if (selectedSecret && selectedSecret.detail !== undefined) {
            context.globalState.update('selectedSecret', selectedSecret.detail)
          }

          window.showInputBox({ placeHolder: 'Enter the database name to finish' })
            .then((selectedDatabase) => {
              if (selectedDatabase !== undefined) {
                context.globalState.update('selectedDatabase', selectedDatabase);
              }
            });
        });
      });
    });
  }
}
