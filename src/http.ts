import { requestUrl } from "obsidian";

export class HTTP {
	static async request(method: string, url: string, body?: any) {
		console.log(body);
		const response = await requestUrl({
			url,
			method,
			body: JSON.stringify(body),
			throw: false,
			contentType: "application/json",
		});

		if (response.status >= 400) {
			const msg = `Failed to ${method} ${url}: ${response.status}`;
			console.error(`${msg} - ${response.text}`);
			throw new Error(msg);
		}

		return response.json;
	}

	static async get(url: string) {
		return await HTTP.request("GET", url);
	}

	static async post(url: string, body: any) {
		return await HTTP.request("POST", url, body);
	}

	static async put(url: string, body: any) {
		return await HTTP.request("PUT", url, body);
	}

	static async delete(url: string, body?: any) {
		return await HTTP.request("DELETE", url, body);
	}
}
