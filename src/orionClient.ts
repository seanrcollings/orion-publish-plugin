import { TFile } from "obsidian";
import { HTTP } from "./http";
import { OrionDB } from "./db";
import { OrionFileManager } from "./file";
import { Feed } from "./types";

interface OrioinClientConfig {
	db: OrionDB;
	fileManager: OrionFileManager;
}

class OrionClientError extends Error {}

/** Connects to external API to plubish notes */
export class OrionClient {
	private db: OrionDB;
	private fileManager: OrionFileManager;

	constructor(config: OrioinClientConfig) {
		this.db = config.db;
		this.fileManager = config.fileManager;
	}

	private get baseUrl() {
		return this.db.settings.url;
	}

	async createPost(file: TFile, feedId: string | null = null) {
		const publishedFile = this.db.getPublishedFile(file);

		if (publishedFile) {
			throw new OrionClientError(
				`File ${file.path} is already published`
			);
		}

		const contents = await this.fileManager.getFileContents(file);

		const payload = {
			title: file.basename,
			content: contents,
			feedId: feedId,
		};

		const { post } = await HTTP.post(`${this.baseUrl}/api/posts`, payload);

		this.db.addPublishedFile(file, post.id, post.token);

		return post;
	}

	async updatePost(file: TFile) {
		const publishedFile = this.db.getPublishedFile(file);

		if (!publishedFile) {
			throw new OrionClientError(`File ${file.path} is not published`);
		}

		const { id, token } = publishedFile;
		const contents = await this.fileManager.getFileContents(file);

		const payload = {
			title: file.basename,
			content: contents,
			token,
		};

		return HTTP.put(`${this.baseUrl}/api/posts/${id}`, payload);
	}

	async deletePost(file: TFile) {
		const publishedFile = this.db.getPublishedFile(file);

		if (!publishedFile) {
			throw new OrionClientError(`File ${file.path} is not published`);
		}

		const { id, token } = publishedFile;

		await HTTP.delete(`${this.baseUrl}/api/posts/${id}`, {
			token,
		});

		await this.db.deletePublishedFile(file);
	}

	async createFeed(title: string): Promise<Feed> {
		const payload = {
			title: title,
		};

		const { feed } = await HTTP.post(`${this.baseUrl}/api/feeds`, payload);

		await this.db.addFeed(feed);

		return feed;
	}

	async deleteFeed(id: string) {
		const feed = this.db.getFeed(id);
		if (!feed) {
			throw new OrionClientError(`Feed ${id} does not exist`);
		}

		await HTTP.delete(`${this.baseUrl}/api/feeds/${id}`, {
			token: feed.token,
		});
		await this.db.deleteFeed(id);
	}
}
