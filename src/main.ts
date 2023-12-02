import { Notice, Plugin, TFile } from "obsidian";
import { SettingsTab } from "./ui/settingsTab";
import { OrionClient } from "./orionClient";
import { DataFileDB, OrionDB } from "./db";
import { ObsidianNoteProcessor } from "./file";

export default class OrionPublish extends Plugin {
	client: OrionClient;
	db: OrionDB;

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
		this.db = new DataFileDB(this);
		await this.db.load();

		this.addSettingTab(new SettingsTab(this.app, this));

		// TODO Add a status bar item that shows the current note's publish URL
		// TODO: this needs to be updated when the settings change

		this.client = new OrionClient({
			fileManager: new ObsidianNoteProcessor(this.app),
			db: this.db,
		});
	}

	private async addCommands() {
		this.addCommand({
			id: "orion-publish.publish",
			name: "Publish Note",
			editorCallback: async (editor, view) => {
				const { file } = view;
				if (!file) return;

				this.client
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

				this.client
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

				this.client
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
		const publishedFile = this.db.getPublishedFile(file);

		if (!publishedFile) {
			new Notice("Note is not published");
			return;
		}

		const url = `${this.db.settings.url}/${publishedFile.id}`;
		navigator.clipboard.writeText(url);
	}
}
