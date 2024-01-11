import { TFile } from "obsidian";
import { Feed, OrionPublishConfig, PublishedFileData } from "./types";
import OrionPublish from "./main";

const DEFAULT_CONFIG: Partial<OrionPublishConfig> = {
	settings: {
		url: "https://orion.seancollings.dev",
		feedsEnabled: false,
		feeds: [],
	},
	publishedFiles: {},
};

export interface OrionDB {
	settings: OrionPublishConfig["settings"];
	getPublishedFile(file: TFile): PublishedFileData | null;
	addPublishedFile(file: TFile, id: string, token: string): void;
	deletePublishedFile(file: TFile): Promise<void>;
	addFeed(feed: Feed): Promise<void>;
	getFeed(id: string): Feed | null;
	deleteFeed(id: string): Promise<void>;
	load(): Promise<void>;
	save(): Promise<void>;
}

export class DataFileDB implements OrionDB {
	private plugin: OrionPublish;
	private data: OrionPublishConfig;

	constructor(plugin: OrionPublish) {
		this.plugin = plugin;
	}

	get settings() {
		return this.data.settings;
	}

	async addPublishedFile(file: TFile, id: string, token: string) {
		this.data.publishedFiles[file.path] = { id: id, token };
		await this.save();
	}

	async deletePublishedFile(file: TFile) {
		delete this.data.publishedFiles[file.path];
		await this.save();
	}

	getPublishedFile(file: TFile): PublishedFileData | null {
		return this.data.publishedFiles[file.path] || null;
	}

	async addFeed(feed: Feed): Promise<void> {
		this.data.settings.feeds.push(feed);
		await this.save();
	}

	getFeed(id: string): Feed | null {
		return this.data.settings.feeds.find((feed) => feed.id === id) || null;
	}

	async deleteFeed(id: string): Promise<void> {
		this.data.settings.feeds = this.data.settings.feeds.filter(
			(feed) => feed.id !== id
		);
		await this.save();
	}

	async load() {
		this.data = Object.assign(
			{},
			DEFAULT_CONFIG,
			await this.plugin.loadData()
		);
	}

	async save() {
		await this.plugin.saveData(this.data);
	}
}
