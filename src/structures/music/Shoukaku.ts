import { Shoukaku, Connectors } from 'shoukaku';
import { BotClient } from '../index';

export enum State {
    CONNECTING,
    NEARLY,
    CONNECTED,
    RECONNECTING,
    DISCONNECTING,
    DISCONNECTED,
}

export class ShoukakuClient extends Shoukaku {
    public client: BotClient;
    public cache: Array<any>;

    constructor(client: BotClient) {
        super(new Connectors.DiscordJS(client), client.config.lavalink, {
            moveOnDisconnect: false,
            voiceConnectionTimeout: 15,
            resumeByLibrary: true,
            resume: true,
            restTimeout: 30,
            userAgent: 'MoeBot/1.0',
            reconnectTries: 10,
            nodeResolver: nodes =>
                [...nodes.values()]
                    .filter(node => node.state === 2)
                    .sort((a, b) => a.penalties - b.penalties)
                    .shift(),
        });
        this.client = client;
        this.cache = [];

        this.on('ready', async (name: string, renamed: boolean) => {
            this.client.logger.info(`Shoukaku node ${name} is ${renamed ? 'renamed' : 'ready'}`);

            const data = await this.client.db.getAll247();
            await Promise.all(
                data.map(async (mdata, index) => {
                    if (mdata.mode) {
                        const guild = this.client.guilds.cache.get(mdata.guildId);
                        const voiceChannel = guild?.channels.cache.get(mdata.voiceChannelId);
                        if (guild && voiceChannel) {
                            await new Promise(resolve => setTimeout(resolve, 2000 * index));
                            this.client.queue.createPlayer({
                                guild: guild,
                                voiceChannelId: voiceChannel.id,
                                textChannelId: mdata.textChannelId || null,
                            });
                            this.client.logger.info(`Reconnected to ${guild.name} (${guild.id})`);
                        }
                    }
                })
            );
        });
        this.on('raw', (d: any) => {});
        this.on('debug', (name: string, message: string) => {
            // this.client.logger.debug(`Shoukaku node ${name} has debug: ${message}`);
        });
        this.on('error', (name: string, error: Error) => {
            this.client.logger.error(`Shoukaku node ${name} has error: ${error.message}`);
        });

        this.on('close', (name: string, code: number, reason: string) => {
            this.client.logger.warn(
                `Shoukaku node ${name} is closed with reason: ${reason} (${code})`
            );
        });
        this.on('disconnect', (name, count) => {
            this.client.logger.warn(
                `Shoukaku node ${name} is disconnected with attempts: ${count}`
            );
        });
        this.on('reconnecting', (name, attempts) => {
            this.client.logger.warn(
                `Shoukaku node ${name} is reconnecting with attempts: ${attempts}`
            );
        });
    }
}
