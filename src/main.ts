import { randomBytes } from "crypto";
import { Notice, Plugin, TFile } from "obsidian";
import { SettingsTab } from "./settingsTab";
import { OrionPublishConfig } from "./types";
import { OrionClient } from "./orionClient";
import { FileCache } from "./cache";
import { ObsidianNoteProcessor } from "./file";

const DEFAULT_CONFIG: Partial<OrionPublishConfig> = {
	settings: {
		url: "http://localhost:3000",
		feedName: "My Feed",
	},
	feedId: randomBytes(32).toString("base64").replace("=", ""),
	publishedFiles: {},
};

export default class OrionPublish extends Plugin {
	config: OrionPublishConfig;
	private publishClient: OrionClient;

	async onload() {
		try {
			await this.init();
			await this.addCommands();
		} catch (e) {
			console.error(e);
			new Notice(`Orion Publish failed to load: ${e}`);
		}
	}

	private async init() {
		await this.loadConfig();
		this.addSettingTab(new SettingsTab(this.app, this));

		// TODO Add a status bar tiem that shows the current note's publish URL
		const cache = new FileCache(this, this.config.publishedFiles);

		const fileManager = new ObsidianNoteProcessor(this.app);
		// TODO: this needs to be updated when the settings change
		this.publishClient = new OrionClient({
			cache,
			fileManager,
			baseUrl: this.config.settings.url,
			feedId: this.config.feedId,
			feedName: this.config.settings.feedName,
		});
	}

	private async addCommands() {
		this.addCommand({
			id: "orion-publish.publish",
			name: "Publish Note",
			editorCallback: async (editor, view) => {
				const { file } = view;
				if (!file) return;

				this.publishClient
					.createPost(file)
					.then(() => this.copyUrlToClipboard(file))
					.catch((e) => new Notice(e.message));
			},
		});

		this.addCommand({
			id: "orion-publish.update",
			name: "Update Published Note",
			editorCallback: async (editor, view) => {
				const { file } = view;
				if (!file) return;

				this.publishClient
					.updatePost(file)
					.then(() => this.copyUrlToClipboard(file))
					.catch((e) => new Notice(e.message));
			},
		});

		this.addCommand({
			id: "orion-publish.delete",
			name: "Delete Published Note",
			editorCallback: async (editor, view) => {
				const { file } = view;
				if (!file) return;

				this.publishClient
					.deletePost(file)
					.catch((e) => new Notice(e.message));
			},
		});

		this.addCommand({
			id: "orion-publish.get-url",
			name: "Get Published Note URL",
			editorCallback: async (editor, view) => {
				const { file } = view;
				if (file) this.copyUrlToClipboard(file);
			},
		});
	}

	private async copyUrlToClipboard(file: TFile) {
		const url = await this.publishClient.getPostUrl(file);

		if (!url) {
			new Notice("Note is not published");
			return;
		}

		navigator.clipboard.writeText(url);
	}

	private async loadConfig() {
		this.config = Object.assign({}, DEFAULT_CONFIG, await this.loadData());
	}

	async saveConfig() {
		await this.saveData(this.config);
	}
}
