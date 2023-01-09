import { Uri, workspace, window } from 'vscode';
import { writeFileSync } from 'fs';
import { tmpdir } from 'os';

export default class OutputProvider {
  public outputFile: string = `${tmpdir()}${process.platform === 'win32' ? '\\' : '/'}rds-data-api.json`;

  public async renderDocument(data: object | string) {
    const stringifiedData = JSON.stringify(data, null, 2);

    writeFileSync(this.outputFile, stringifiedData);

    const uri = Uri.file(this.outputFile);
    const doc = await workspace.openTextDocument(uri);

    window.showTextDocument(doc);
  }
}
