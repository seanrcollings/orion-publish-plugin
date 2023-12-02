import OrionPlugin from "../main";
import {
	App,
	ButtonComponent,
	Notice,
	PluginSettingTab,
	Setting,
	TextComponent,
} from "obsidian";

export class SettingsTab extends PluginSettingTab {
	plugin: OrionPlugin;

	constructor(app: App, plugin: OrionPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("URL")
			.setDesc("The URL of the Orion server")
			.addText((text) =>
				text
					.setPlaceholder("URL")
					.setValue(this.plugin.db.settings.url)
					.onChange(async (value) => {
						this.plugin.db.settings.url = value;
						await this.plugin.db.save();
					})
			);

		new Setting(containerEl)
			.setName("Enable Feeds")
			.setDesc("Enable Publishing to Feeds")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.db.settings.feedsEnabled)
					.onChange(async (value) => {
						this.plugin.db.settings.feedsEnabled = value;
						await this.plugin.db.save();

						if (value) {
							await this.addFeedsUi();
						} else {
							this.removeFeedUi();
						}
					})
			);

		if (this.plugin.db.settings.feedsEnabled) {
			this.addFeedsUi();
		}
	}

	private async addFeedsUi() {
		const { containerEl } = this;
		const { feeds } = this.plugin.db.settings;

		const feedsContainer = containerEl.createEl("div", {
			cls: "orion-publish-feeds",
		});

		feedsContainer.createEl("h3", { text: "Feeds" });

		const inputContainer = feedsContainer.createEl("div", {
			cls: "orion-publish-feeds__new",
		});

		const textField = new TextComponent(inputContainer).setPlaceholder(
			"Feed Name"
		);
		new ButtonComponent(inputContainer)
			.setIcon("plus")
			.setTooltip("Add Feed")
			.onClick(async () => {
				const name = textField.getValue();
				if (!name) return;

				textField.setValue("");

				try {
					const { id } = await this.plugin.client.createFeed(name);
					this.addFeedToList(feedsContainer, id, name);
				} catch (e) {
					new Notice(`Failed to create feed: ${e}`);
				}
			});

		feeds.forEach((feed) => {
			console.log(feed);
			this.addFeedToList(feedsContainer, feed.id, feed.title);
		});
	}

	private async removeFeedUi() {
		const elements = this.containerEl.getElementsByClassName(
			"orion-publish-feeds"
		);

		elements.item(0)?.remove();
	}

	private async addFeedToList(parent: HTMLElement, id: string, name: string) {
		let feedsList: HTMLElement | null = parent
			.getElementsByClassName("orion-publish-feeds__list")
			.item(0) as HTMLElement | null;

		if (!feedsList) {
			feedsList = parent.createEl("div", {
				cls: "orion-publish-feeds__list",
			});
		}

		const setting = new Setting(feedsList)
			.setName(name)
			.addButton((button) => {
				button
					.setIcon("trash")
					.setTooltip("Delete Feed")
					.onClick(async () => {
						try {
							await this.plugin.client.deleteFeed(id);
							setting.settingEl.remove();
						} catch (e) {
							new Notice(`Failed to delete feed: ${e}`);
						}
					});
			});
	}
}
