import { App, TFile } from "obsidian";

export interface OrionFileManager {
	getFileContents(file: TFile): Promise<string>;
	processFile(file: TFile): Promise<void>;
}

export class ObsidianNoteProcessor implements OrionFileManager {
	private app: App;

	constructor(app: App) {
		this.app = app;
	}

	async getFileContents(file: TFile) {
		return this.app.vault.cachedRead(file);
	}

	async processFile(file: TFile) {}
}
