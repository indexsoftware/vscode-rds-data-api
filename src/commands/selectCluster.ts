import { ExtensionContext, commands, window, StatusBarItem } from 'vscode';
import { execSync } from 'child_process';
import { DescribeDBClustersCommandOutput } from '@aws-sdk/client-rds';
import { ListSecretsCommandOutput } from '@aws-sdk/client-secrets-manager';
import Base from './base';

export default class SelectCluster extends Base {
  constructor(context: ExtensionContext, statusBarItem: StatusBarItem) {
    super(context, statusBarItem);

    commands.registerCommand('extension.selectCluster', () => {
      const DBClustersResponse: DescribeDBClustersCommandOutput = JSON.parse(execSync('aws rds describe-db-clusters').toString() || '{}');
      const SecretsResponse: ListSecretsCommandOutput = JSON.parse(execSync('aws secretsmanager list-secrets').toString() || '{}');
      
      if (!DBClustersResponse.DBClusters) return false;
      if (!SecretsResponse.SecretList) return false;
    
      const clusterList = window.createQuickPick();
    
      clusterList.items = DBClustersResponse.DBClusters.map((DBCluster) => ({
        detail: DBCluster.DBClusterArn,
        label: DBCluster.DBClusterIdentifier || '',
      }));
    
      const secretList = window.createQuickPick();
      secretList.items = SecretsResponse.SecretList.map((Secret) => ({
        detail: Secret.ARN,
        label: Secret.Description || Secret.Name || '',
      }));
    
      clusterList.onDidChangeSelection(([selection]) => {
        if (selection && selection.detail) {
          context.globalState.update('selectedCluster', selection.detail);
          console.log(this.statusBarItem);
          if (this.statusBarItem) this.statusBarItem.text = `$(database) ${selection.label}`;
    
          clusterList.hide();
          secretList.show();
        }
      });
    
      secretList.onDidChangeSelection(([selection]) => {
        if (selection && selection.detail) {
          context.globalState.update('selectedSecret', selection.detail);
    
          secretList.hide();
        }
      });
    
      clusterList.show();
    });
  }
}
