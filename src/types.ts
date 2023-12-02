export type PublishedFileData = { id: string; token: string };

export type PublishedFilesRecord = Record<string, PublishedFileData>;

export interface Feed {
	id: string;
	token: string;
	title: string;
}

export interface OrionPublishSettings {
	url: string;
	feedsEnabled: boolean;
	feeds: Feed[];
}

export interface OrionPublishConfig {
	// Stores data about each file that has been published
	publishedFiles: PublishedFilesRecord;

	// Values that can be set in the settings tab
	settings: OrionPublishSettings;
}
