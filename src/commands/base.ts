import { ExtensionContext, StatusBarItem, window, StatusBarAlignment, OutputChannel } from 'vscode';
import { exec } from 'child_process';
import { ExecuteStatementResponse } from '@aws-sdk/client-rds-data';

export default class Base {
  public context: ExtensionContext;
  public selectedCluster?: string;
  public selectedSecret?: string;
  public statusBarItem?: StatusBarItem;
  public outputChannel: OutputChannel;

  constructor(context: ExtensionContext, statusBarItem: StatusBarItem) {
    this.context = context;
    this.selectedCluster = context.globalState.get('selectedCluster') as string | undefined;
    this.selectedSecret = context.globalState.get('selectedSecret') as string | undefined;
    this.outputChannel = window.createOutputChannel('RDS Data API');
    this.statusBarItem = statusBarItem;
  }

  async executeQuery(query?: string, parameters?: string) {
    const command = this.parseQuery(`
      aws rds-data execute-statement
      --resource-arn ${this.context.globalState.get('selectedCluster')}
      --secret-arn ${this.context.globalState.get('selectedSecret')}
      --database main
      --include-result-metadata
      --parameters ${JSON.stringify(parameters || '[]')}
      --sql "${query}"
    `);
    try {
      const response: string = await new Promise((resolve, reject) => exec(command, (error, stdout) => {
        if (error) return reject(error);
        return resolve(stdout);
      }));
    
      return this.parseQueryResponse(JSON.parse(response));
    } catch (e) {
      return e;
    }
  }

  parseQueryResponse ({ columnMetadata, records }: ExecuteStatementResponse) {
    if (!columnMetadata || !records) return [];
  
    const columns = columnMetadata.map(({ name }) => name) as string[];
    const data = records.map((record) => {
      const locaRecord: { [key: string]: number } = {};
  
      record.map((field, index) => {
        [locaRecord[columns[index]]] = field.isNull ? [null] : Object.values(field);
  
        return field;
      });
  
      return locaRecord;
    });
  
    return data;
  }

  parseQuery(query: string) {
    return query.replace(/\n/g, ' ');
  }
}