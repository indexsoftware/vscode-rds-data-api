import { ExtensionContext, commands, window, StatusBarItem } from 'vscode';
import { execSync } from 'child_process';
import { DescribeDBClustersCommandOutput } from '@aws-sdk/client-rds';
import { ListSecretsCommandOutput } from '@aws-sdk/client-secrets-manager';
import Base from './base';

export default class SelectCluster extends Base {
  constructor(context: ExtensionContext, statusBarItem: StatusBarItem) {
    super(context, statusBarItem);

    commands.registerCommand('extension.selectCluster', async () => {
      const DBClustersResponse: DescribeDBClustersCommandOutput = JSON.parse(execSync('aws rds describe-db-clusters').toString() || '{}');
      const SecretsResponse: ListSecretsCommandOutput = JSON.parse(execSync('aws secretsmanager list-secrets').toString() || '{}');
      
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
