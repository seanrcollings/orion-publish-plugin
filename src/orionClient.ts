import { TFile } from "obsidian";
import { HTTP } from "./http";
import { PublishCache } from "./cache";
import { OrionFileManager } from "./file";

interface OrioinClientConfig {
	baseUrl: string;
	feedId: string;
	feedName: string;
	cache: PublishCache;
	fileManager: OrionFileManager;
}

class OrionClientError extends Error {}

export class OrionClient {
	private cache: PublishCache;
	private fileManager: OrionFileManager;
	private baseUrl: string;
	private feedId: string;
	private feedName: string;

	constructor(config: OrioinClientConfig) {
		this.cache = config.cache;
		this.fileManager = config.fileManager;
		this.baseUrl = config.baseUrl;
		this.feedId = config.feedId;
		this.feedName = config.feedName;
	}

	async createPost(file: TFile) {
		const { id } = this.cache.getPublishedFile(file);

		if (id) {
			throw new OrionClientError(
				`File ${file.path} is already published`
			);
		}

		const contents = await this.fileManager.getFileContents(file);

		const payload = {
			title: file.basename,
			content: contents,
			feedTitle: this.feedName,
		};

		const { post } = await HTTP.post(
			`${this.baseUrl}/api/feeds/${this.feedId}`,
			payload
		);

		this.cache.savePublishedFile(file, post.id, post.token);

		return post;
	}

	async updatePost(file: TFile) {
		const contents = await this.fileManager.getFileContents(file);
		const { id, token } = this.cache.getPublishedFile(file);

		if (!id) {
			throw new OrionClientError(`File ${file.path} is not published`);
		}

		const payload = {
			title: file.basename,
			content: contents,
			token,
		};

		return HTTP.put(
			`${this.baseUrl}/api/feeds/${this.feedId}/${id}`,
			payload
		);
	}

	async deletePost(file: TFile) {
		const { id, token } = this.cache.getPublishedFile(file);

		if (!id) {
			throw new OrionClientError(`File ${file.path} is not published`);
		}

		await HTTP.delete(`${this.baseUrl}/api/feeds/${this.feedId}/${id}`, {
			token,
		});

		this.cache.deletePublishedFile(file);
	}

	async getPostUrl(file: TFile) {
		const { id } = this.cache.getPublishedFile(file);

		if (!id) {
			return null;
		}

		return `${this.baseUrl}/${id}`;
	}
}
