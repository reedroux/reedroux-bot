import BotClient from "./Client";
import { Message, Sweepers, ThreadChannel } from "discord.js";


interface SweeperOptions {
    sweep: Array<"client" | "topgg" | "votes" | "messages" | "threads" | "patreon">;
    timeout: number;
    changeStatus?: string;
}

export class SweeperManager {
    private client: BotClient;
    public options: SweeperOptions;

    constructor(client: BotClient, options: SweeperOptions) {
        this.client = client;
        this.options = options;
        this.setup();
    }

    private setup() {
        this.client.logger.log("Sweeper Manager is ready!");
        if (this.options.timeout === 0) return;

        setInterval(() => {
            this.sweep();
        }, this.options.timeout);
    }

    private sweep() {
        if (this.options.sweep.includes("client")) this.sweepClient();
        if (this.options.sweep.includes("messages")) this.sweepGuildMessages();
        if (this.options.sweep.includes("threads")) this.sweepThreads();
    }

    public sweepClient() {
        return true;
    }

    private async sweepThreads() {
        this.client.sweepers.sweepThreads(
            Sweepers.filterByLifetime({
                getComparisonTimestamp: (thread: ThreadChannel) => thread.archiveTimestamp,
                excludeFromSweep: t => !t.archived,
            })(),
        );
    }
    private async sweepGuildMessages() {
        this.client.sweepers.sweepMessages(
            Sweepers.filterByLifetime({
                lifetime: 43200,
                getComparisonTimestamp: (message: Message) => message.editedTimestamp ?? message.createdTimestamp,
            })(),
        )
    }
}