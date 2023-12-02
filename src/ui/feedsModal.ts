import { App, FuzzySuggestModal } from "obsidian";
import { Feed } from "src/types";

export class SelectFeedModal extends FuzzySuggestModal<string> {
	feeds: Record<string, Feed>;
	onChoose: (feed: Feed | null) => void;

	constructor(
		app: App,
		feeds: Feed[],
		onChoose: (feed: Feed | null) => void
	) {
		super(app);
		this.feeds = Object.fromEntries(feeds.map((feed) => [feed.id, feed]));
		this.feeds["none"] = {
			id: "none",
			title: "Publish without a feed",
			token: "",
		};
		this.setPlaceholder("Select a feed to publish to");
		this.onChoose = onChoose;
	}

	getItems(): string[] {
		return Object.keys(this.feeds);
	}

	getItemText(feedId: string): string {
		return this.feeds[feedId].title;
	}

	onChooseItem(feedId: string) {
		if (feedId === "none") {
			this.onChoose(null);
		} else {
			this.onChoose(this.feeds[feedId]);
		}
	}
}
