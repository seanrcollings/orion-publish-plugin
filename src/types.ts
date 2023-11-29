export interface OrionPublishSettings {
	url: string;
	feedName: string;
}

export interface OrionPublishConfig {
	// Stores the UUID of the feed that the user is publishing to
	feedId: string;

	// Stores data about each file that has been published
	publishedFiles: PublishedFilesRecord;

	// Values that can be set in the settings tab
	settings: OrionPublishSettings;
}

export type PublishedFileData = { id: string; token: string };

export type PublishedFilesRecord = Record<string, PublishedFileData>;
