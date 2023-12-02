import { TFile } from "obsidian";
import { PublishedFileData, PublishedFilesRecord } from "./types";
import OrionPublish from "./main";

export interface PublishCache {
	getPublishedFile(file: TFile): Partial<PublishedFileData>;
	savePublishedFile(file: TFile, id: string, token: string): void;
	deletePublishedFile(file: TFile): void;
}

export class FileCache implements PublishCache {
	private plugin: OrionPublish;
	private publishedFiles: PublishedFilesRecord;

	constructor(plugin: OrionPublish, publishedFiles: PublishedFilesRecord) {
		this.plugin = plugin;
		this.publishedFiles = publishedFiles;
	}

	savePublishedFile(file: TFile, id: string, token: string) {
		this.publishedFiles[file.path] = { id: id, token };
		this.plugin.saveConfig();
	}

	deletePublishedFile(file: TFile) {
		delete this.publishedFiles[file.path];
		this.plugin.saveConfig();
	}

	getPublishedFile(file: TFile): Partial<PublishedFileData> {
		return this.publishedFiles[file.path] || {};
	}
}
