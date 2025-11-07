import {
    ApplicationCommandType,
    PermissionResolvable,
    ContextMenuCommandInteraction,
} from 'discord.js';
import BotClient from './Client';

interface ContextData {
    client?: BotClient;
    name: string;
    description: string;
    type: ApplicationCommandType.User | ApplicationCommandType.Message;
    enabled?: boolean;
    ephemeral?: boolean;
    permissions?: {
        client: PermissionResolvable[];
        user: PermissionResolvable[];
    };
    cooldown?: number;
}

export default class Context {
    public client?: BotClient;
    public name: string;
    public description: string;
    public type: ApplicationCommandType.User | ApplicationCommandType.Message;
    public enabled: boolean;
    public ephemeral: boolean;
    public permissions: {
        client: PermissionResolvable[];
        user: PermissionResolvable[];
    };
    public cooldown: number;

    constructor(client: BotClient, data: ContextData) {
        this.client = client;
        this.name = data.name;
        this.description = data.description;
        this.type = data.type;
        this.enabled = data.enabled ?? true;
        this.ephemeral = data.ephemeral ?? false;
        this.permissions = data.permissions ?? {
            client: [],
            user: [],
        };
        this.cooldown = data.cooldown ?? 3;
    }
    public async run(interaction: ContextMenuCommandInteraction): Promise<any> {
        return this.run(interaction);
    }
}
