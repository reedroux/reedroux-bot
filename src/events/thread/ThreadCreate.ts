import { ThreadChannel } from 'discord.js';
import { BotClient, Event } from '../../structures/index';

export default class ThreadCreate extends Event {
    constructor(client: BotClient, file: string) {
        super(client, file, {
            name: 'threadCreate',
        });
    }

    public async run(thread: ThreadChannel): Promise<void> {
        try {
            await thread.join();
        } catch (err) {
            this.client.logger.error(err);
        }
    }
}
