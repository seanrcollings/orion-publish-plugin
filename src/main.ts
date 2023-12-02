import { Notice, Plugin, TFile } from "obsidian";
import { SettingsTab } from "./ui/settingsTab";
import { OrionClient } from "./orionClient";
import { DataFileDB, OrionDB } from "./db";
import { ObsidianNoteProcessor } from "./file";
import { SelectFeedModal } from "./ui/feedsModal";

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

				const publishedFile = this.db.getPublishedFile(file);

				if (publishedFile) {
					new Notice("Note is already published");
					return;
				}

				if (
					this.db.settings.feedsEnabled &&
					this.db.settings.feeds.length > 0
				) {
					const modal = new SelectFeedModal(
						this.app,
						this.db.settings.feeds,
						async (feed) => {
							await this.createOrUpdatePost(file, feed?.id);
						}
					);

					modal.open();
				} else {
					await this.createOrUpdatePost(file);
				}
			},
		});

		this.addCommand({
			id: "orion-publish.update",
			name: "Update Published Note",
			editorCallback: async (editor, view) => {
				const { file } = view;
				if (!file) return;
				await this.createOrUpdatePost(file);
			},
		});

		this.addCommand({
			id: "orion-publish.delete",
			name: "Un-publish Note",
			editorCallback: async (editor, view) => {
				const { file } = view;
				if (!file) return;

				try {
					await this.client.deletePost(file);
					new Notice("Note unpublished");
				} catch (e) {
					new Notice(e.message);
				}
			},
		});

		this.addCommand({
			id: "orion-publish.get-url",
			name: "Copy Published Note URL",
			editorCallback: async (editor, view) => {
				const { file } = view;
				if (file) this.copyUrlToClipboard(file);
			},
		});
	}

	private async createOrUpdatePost(
		file: TFile,
		feedId: string | null = null
	) {
		const publishedFile = this.db.getPublishedFile(file);

		try {
			if (publishedFile) {
				await this.client.updatePost(file);
				new Notice("Note updated");
			} else {
				await this.client.createPost(file, feedId);
				new Notice("Note published");
			}

			this.copyUrlToClipboard(file);
		} catch (e) {
			new Notice(e.message);
		}
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
