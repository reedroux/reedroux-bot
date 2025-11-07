import { ActivityType } from 'discord.js';

import { BotClient, Event } from '../../structures/index';


export default class Ready extends Event {
    constructor(client: BotClient, file: string) {
        super(client, file, {
            name: 'ready',
        });
    }

    public async run(): Promise<void> {
        this.client.logger.success(`${this.client.user?.tag} is ready!`);
        this.client.user?.setPresence({
            activities: [
                {
                    name: `Uivar | /help`,
                    type: ActivityType.Listening,
                },
            ],
            status: 'online',
        });
    }
}
