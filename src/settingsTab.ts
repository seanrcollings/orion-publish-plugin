import ExamplePlugin from "./main";
import { App, PluginSettingTab, Setting } from "obsidian";

export class SettingsTab extends PluginSettingTab {
	plugin: ExamplePlugin;

	constructor(app: App, plugin: ExamplePlugin) {
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
					.setValue(this.plugin.config.settings.url)
					.onChange(async (value) => {
						this.plugin.config.settings.url = value;
						await this.plugin.saveConfig();
					})
			);

		new Setting(containerEl)
			.setName("Feed name")
			.setDesc("The name of the feed to publish to")
			.addText((text) =>
				text
					.setPlaceholder("Feed Name")
					.setValue(this.plugin.config.settings.feedName)
					.onChange(async (value) => {
						this.plugin.config.settings.feedName = value;
						await this.plugin.saveConfig();
					})
			);
	}
}
