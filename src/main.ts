import { MarkdownView, Notice, Plugin, TFile, setIcon } from "obsidian";
import { SettingsTab } from "./ui/settingsTab";
import { OrionClient } from "./orionClient";
import { DataFileDB, OrionDB } from "./db";
import { ObsidianNoteProcessor } from "./file";
import { SelectFeedModal } from "./ui/feedsModal";
import { Feed } from "./types";

export default class OrionPublish extends Plugin {
	client: OrionClient;
	db: OrionDB;
	statusItem: HTMLElement | null = null;

	async onload() {
		try {
			await this.init();
			await this.addCommands();
			await this.addEvents();
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
			id: "publish",
			name: "Publish note",
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
							await this.createOrUpdatePost(file, feed);
						}
					);

					modal.open();
				} else {
					await this.createOrUpdatePost(file);
				}
			},
		});

		this.addCommand({
			id: "update",
			name: "Update published note",
			editorCallback: async (editor, view) => {
				const { file } = view;
				if (!file) return;
				await this.createOrUpdatePost(file);
			},
		});

		this.addCommand({
			id: "delete",
			name: "Unpublish note",
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
			id: "get-url",
			name: "Copy published note URL",
			editorCallback: async (editor, view) => {
				const { file } = view;
				if (file) this.copyUrlToClipboard(file);
			},
		});
	}

	private async addEvents() {
		this.registerEvent(
			this.app.workspace.on("active-leaf-change", (leaf) => {
				this.statusItem?.remove();

				if (!leaf || leaf.view.getViewType() !== "markdown") return;

				const file = (leaf.view as MarkdownView).file;
				if (!file) return;

				const publishedFile = this.db.getPublishedFile(file);

				if (!publishedFile) return;
				this.statusItem = this.addStatusBarItem();
				this.statusItem.classList.add(
					"status-bar-item",
					"plugin-editor-status",
					"mod-clickable"
				);
				this.statusItem.ariaLabel = "Open published note";
				this.statusItem.dataset["tooltipPosition"] = "top";
				const button = this.statusItem.createEl("span", {
					cls: "status-bar-item-icon",
				});

				button.addEventListener("click", () => {
					this.copyUrlToClipboard(file);
					window.open(
						`${this.db.settings.url}/p/${publishedFile.id}`
					);
				});

				setIcon(button, "upload");
			})
		);
	}

	private async createOrUpdatePost(file: TFile, feed: Feed | null = null) {
		const publishedFile = this.db.getPublishedFile(file);

		try {
			if (publishedFile) {
				await this.client.updatePost(file);
				new Notice("Note updated");
			} else {
				await this.client.createPost(file, feed);
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

		const url = `${this.db.settings.url}/p/${publishedFile.id}`;
		navigator.clipboard.writeText(url);
	}
}
