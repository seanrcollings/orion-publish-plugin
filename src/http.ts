export class HTTP {
	static async request(method: string, url: string, body?: any) {
		const response = await fetch(url, {
			method,
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		return await response.json();
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

	static async delete(url: string, body: any) {
		return await HTTP.request("DELETE", url, body);
	}
}
