import { WebhookClient } from 'discord.js';
import { BotClient, Event } from '../../structures/index';

// error event
export default class Error extends Event {
    constructor(client: BotClient, file: string) {
        super(client, file, {
            name: 'error',
        });
    }

    public async run(error: Error): Promise<void> {
        console.error(error);
        const webhook = new WebhookClient({ url: this.client.config.hooks.errors });

        webhook.send({
            embeds: [
                {
                    title: 'An error occurred',
                    description: `\`\`\`js\n${error}\`\`\``,
                    color: this.client.config.colors.red,
                    timestamp: new Date().toISOString(),
                },
            ],
        });
    }
}
