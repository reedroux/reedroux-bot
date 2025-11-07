import { WebhookClient } from 'discord.js';
import { BotClient, Event } from '../../structures/index';


export default class rateLimit extends Event {
    constructor(client: BotClient, file: string) {
        super(client, file, {
            name: 'rateLimit',
        });
    }

    public async run(rateLimitInfo: any): Promise<void> {
        this.client.logger.warn(`Rate limit hit: ${JSON.stringify(rateLimitInfo)}`);
        const webhook = new WebhookClient({ url: this.client.config.hooks.errors })

        webhook.send({
            embeds: [
                {
                    title: 'Rate limit hit',
                    description: `Route ${rateLimitInfo.route} | Timeout ${rateLimitInfo.timeout} | Limit ${rateLimitInfo.limit} | Global ${rateLimitInfo.global}`,
                    color: this.client.config.colors.red,
                    timestamp: new Date().toISOString(),
                },
            ],
        });
    }
}
