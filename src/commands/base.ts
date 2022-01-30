import { ExtensionContext, StatusBarItem } from 'vscode';
import { exec } from 'child_process';
import { ExecuteStatementResponse } from '@aws-sdk/client-rds-data';

export default class Base {
  public context: ExtensionContext;
  public statusBarItem?: StatusBarItem;

  constructor(context: ExtensionContext, statusBarItem: StatusBarItem) {
    this.context = context;
    this.statusBarItem = statusBarItem;
  }

  public selectedCluster() {
    return this.context.globalState.get('selectedCluster') as string | undefined;
  }

  public selectedSecret() {
    return this.context.globalState.get('selectedSecret') as string | undefined;
  }

  public selectedDatabase() {
    return this.context.globalState.get('selectedDatabase') as string | undefined;
  }

  async executeQuery(query?: string, parameters?: string): Promise<ExecuteStatementResponse | object> {
    const command = this.parseQuery(`
      aws rds-data execute-statement
      --resource-arn ${this.selectedCluster()}
      --secret-arn ${this.selectedSecret()}
      --database ${this.selectedDatabase()}
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
      return e as object;
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