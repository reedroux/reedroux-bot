import {
    APIApplicationCommandOption,
    CommandInteraction,
    Message,
    PermissionResolvable,
} from 'discord.js';

import { BotClient } from './index';

interface CommandOptions {
    name: string;
    nameLocalizations?: any;
    description?: {
        content: string;
        usage: string;
        examples: string[];
    };
    descriptionLocalizations?: any;
    aliases?: string[];
    cooldown?: number;
    args?: boolean;
    permissions?: {
        dev: boolean;
        client: PermissionResolvable[];
        user: PermissionResolvable[];
    };
    slashCommand?: boolean;
    messageCommand?: boolean;
    options?: APIApplicationCommandOption[];
    category?: string;
    fileName?: string;
}
export default class Command {
    public client: BotClient;
    public name: string;
    public nameLocalizations: any;
    public description: {
        content: string | null;
        usage: string | null;
        examples: string[] | null;
    };
    public aliases: string[];
    public cooldown: number;
    public args: boolean;
    public permissions: {
        dev: boolean;
        client: PermissionResolvable[];
        user: PermissionResolvable[];
    };
    public slashCommand: boolean;
    public messageCommand: boolean;
    public options: APIApplicationCommandOption[];
    public category: string | null;
    public fileName?: string;
    constructor(client: BotClient, options: CommandOptions) {
        this.client = client;
        this.name = options.name;
        this.nameLocalizations = options.nameLocalizations;
        this.description = {
            content: options.description
                ? options.description.content || 'No description provided'
                : 'No description provided',
            usage: options.description
                ? options.description.usage || 'No usage provided'
                : 'No usage provided',
            examples: options.description ? options.description.examples || [''] : [''],
        };
        this.aliases = options.aliases || [];
        this.cooldown = options.cooldown || 3;
        this.args = options.args || false;
        this.permissions = {
            dev: options.permissions ? options.permissions.dev || false : false,
            client: options.permissions
                ? options.permissions.client || []
                : ['SendMessages', 'ViewChannel', 'EmbedLinks'],
            user: options.permissions ? options.permissions.user || [] : [],
        };
        this.slashCommand = options.slashCommand || false;
        this.messageCommand = options.messageCommand || false;
        this.options = options.options || [];
        this.category = options.category || 'general';
        this.fileName = options.fileName;
    }
    public async messageRun(_message: Message, _args: string[]): Promise<any> { }
    public async slashRun(_interaction: CommandInteraction): Promise<any> { }
}
