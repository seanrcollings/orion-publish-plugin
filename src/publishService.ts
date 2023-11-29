import { TFile } from "obsidian";
import { HTTP } from "./http";
import { PublishedFileManager } from "./fileManager";

interface PublishServiceConfig {
	baseUrl: string;
	feedId: string;
}

class PublishError extends Error {}

export class PublishService {
	private fileManager: PublishedFileManager;
	private baseUrl: string;
	private feedId: string;

	constructor(
		fileManager: PublishedFileManager,
		config: PublishServiceConfig
	) {
		this.fileManager = fileManager;
		this.baseUrl = config.baseUrl;
		this.feedId = config.feedId;
	}

	async createPost(file: TFile) {
		const { id } = this.fileManager.getPublishedFile(file);

		if (id) {
			throw new PublishError(`File ${file.path} is already published`);
		}

		const contents = await this.fileManager.getFileContents(file);

		const payload = {
			title: file.basename,
			content: contents,
		};

		const { post } = await HTTP.post(
			`${this.baseUrl}/api/feeds/${this.feedId}`,
			payload
		);

		this.fileManager.savePublishedFile(file, post.id, post.token);

		return post;
	}

	async updatePost(file: TFile) {
		const contents = await this.fileManager.getFileContents(file);
		const { id, token } = this.fileManager.getPublishedFile(file);

		if (!id) {
			throw new PublishError(`File ${file.path} is not published`);
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
		const { id, token } = this.fileManager.getPublishedFile(file);

		if (!id) {
			throw new PublishError(`File ${file.path} is not published`);
		}

		await HTTP.delete(`${this.baseUrl}/api/feeds/${this.feedId}/${id}`, {
			token,
		});

		this.fileManager.deletePublishedFile(file);
	}

	async getPostUrl(file: TFile) {
		const { id } = this.fileManager.getPublishedFile(file);

		if (!id) {
			return null;
		}

		return `${this.baseUrl}/${id}`;
	}
}
