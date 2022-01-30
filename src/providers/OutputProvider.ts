import { Uri, workspace, window } from 'vscode';
import { writeFileSync } from 'fs';

export default class OutputProvider {
  public outputFile: string = '/tmp/rds-data-api.json';

  public async renderDocument(data: object | string) {
    const stringifiedData = JSON.stringify(data, null, 2);

    writeFileSync(this.outputFile, stringifiedData);

    const uri = Uri.file(this.outputFile);
    const doc = await workspace.openTextDocument(uri);

    window.showTextDocument(doc);
  }
}
