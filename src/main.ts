import { Notice, Plugin, TFile } from "obsidian";
import { SettingsTab } from "./settingsTab";
import { randomBytes } from "crypto";
import { OrionPublishConfig } from "./types";
import { PublishService } from "./publishService";
import { PublishedFileManager } from "./fileManager";

const DEFAULT_CONFIG: Partial<OrionPublishConfig> = {
	settings: {
		url: "http://localhost:3000",
		feedName: "My Feed",
	},
	feedId: randomBytes(32).toString("hex"),
	publishedFiles: {},
};

export default class OrionPublish extends Plugin {
	config: OrionPublishConfig;
	private publishService: PublishService;

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

		const fileManager = new PublishedFileManager(
			this,
			this.config.publishedFiles
		);
		// TODO: this needs to be updated when the settings change
		this.publishService = new PublishService(fileManager, {
			baseUrl: this.config.settings.url,
			feedId: this.config.feedId,
		});
	}

	private async addCommands() {
		this.addCommand({
			id: "orion-publish.publish",
			name: "Publish Note",
			editorCallback: async (editor, view) => {
				const { file } = view;
				if (!file) return;

				this.publishService
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

				this.publishService
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

				this.publishService
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
		const url = await this.publishService.getPostUrl(file);

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
