import {
    ApplicationCommand,
    ApplicationCommandType,
    ButtonInteraction,
    CacheType,
    ChannelSelectMenuInteraction,
    Client,
    ClientOptions,
    Collection,
    MentionableSelectMenuInteraction,
    OAuth2Scopes,
    PermissionsBitField,
    REST,
    RESTPostAPIChatInputApplicationCommandsJSONBody,
    RESTPostAPIContextMenuApplicationCommandsJSONBody,
    RoleSelectMenuInteraction,
    Routes,
    StringSelectMenuInteraction,
    UserSelectMenuInteraction,
} from 'discord.js';
import Logger from './Logger';
import config from '../config';
import Validator from '../helpers/Validator';
import { Database } from '../helpers/database/DatabaseHelper';
import Utils from '../utils/Utils';
import { Command, Context } from './index';
import { ShoukakuClient } from './music/Shoukaku';
import { Queue } from './music/Queue';
import { SweeperManager } from "./sweeperManager";



export default class BotClient extends Client {
    public commands: Collection<string, Command> = new Collection();
    public slashCommand: Collection<string, Command> = new Collection();
    public aliases: Collection<string, string> = new Collection();
    public cooldowns: Collection<string, Collection<string, any>> = new Collection();
    public db = new Database();
    public config = config;
    public logger: Logger = new Logger();
    public utils = Utils;
    private slashs: Map<string, ApplicationCommand> = new Map();
    public shoukaku: ShoukakuClient;
    public queue: Queue;

    public isMaintenance = false;
    private sweepersManager: SweeperManager;
    public constructor(options: ClientOptions) {
        super(options);
    }
    public async start(): Promise<void> {
        let dir = './src';
        this.sweepersManager = new SweeperManager(this, {
            sweep: ["client", "topgg", "votes", "messages", "threads"],
            timeout: 300000, // 5 minutes
        });

        if (this.config.production) {
            dir = './dist/';

        }

        this.loadCommands(`${dir}/commands`);
        this.loadEvents(`${dir}/events`);
        this.queue = new Queue(this);
        this.shoukaku = new ShoukakuClient(this);
        await this.login(this.config.token ?? '');
    }

    public delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private loadCommands(directory: string): void {
        this.logger.log(`Loading commands...`);
        const files = this.utils.recursiveReadDirSync(directory, ['.js', '.ts']);
        for (const file of files) {
            try {
                const cmd = require(file).default;
                const command = new cmd(this, file);
                Validator.validateCommandOptions(command);
                this.loadCommand(command);
            } catch (ex) {
                this.logger.error(`Failed to load ${file} Reason: ${ex.message}`);
            }
        }
        this.logger.success(`Loaded ${this.commands.size} commands`);
    }


    private loadCommand(command: Command): void {
        // prefix commands
        this.commands.set(command.name, command);
        if (command.aliases.length !== 0) {
            command.aliases.forEach((alias: any) => {
                this.aliases.set(alias, command.name);
            });
        }
        // slash commands
        if (command.slashCommand) {
            if (this.slashCommand.has(command.name)) {
                throw new Error(`A command with the name ${command.name} already exists`);
            }
            this.slashCommand.set(command.name, command);
        }
    }

    public reloadCommands(): any {
        let dir = './src';
        if (this.config.production) dir = './dist/';
        this.commands.clear();
        this.slashCommand.clear();
        this.aliases.clear();
        this.utils.reloadCommands(dir, ['.js', '.ts']);
        this.loadCommands(`${dir}/commands`);
        this.logger.success('Successfully reloaded commands');
    }
    public async update(interaction: StringSelectMenuInteraction<CacheType> | UserSelectMenuInteraction<CacheType> | RoleSelectMenuInteraction<CacheType> | MentionableSelectMenuInteraction<CacheType> | ChannelSelectMenuInteraction<CacheType> | ButtonInteraction, data: any): Promise<void> {
        try {
            if (interaction.deferred) {
                await interaction.editReply(data);
            } else {
                await interaction.update(data);
            }
        } catch (error) {
            this.logger.error(`Failed to update interaction: ${error}`);
        }
    }

    private loadEvents(directory: string): void {
        this.logger.log(`Loading events...`);
        let success = 0;
        let failed = 0;
        const clientEvents = [];

        const files = this.utils.recursiveReadDirSync(directory, ['.js', '.ts']);
        for (const file of files) {
            try {
                const event = require(file).default;
                const evt = new event(this, file);
                this.on(evt.name, (...args) => evt.run(...args));
                clientEvents.push(evt);
                delete require.cache[require.resolve(file)];
                success++;
            } catch (error) {
                this.logger.error(`Error loading event from ${file}: ${error}`);
                failed++;
            }
        }
        this.logger.log(`Loaded ${success} events with ${failed} errors.`);
    }

    public async registerInteractions(guildId?: string): Promise<string> {
        const toRegister: Array<
            | RESTPostAPIChatInputApplicationCommandsJSONBody
            | RESTPostAPIContextMenuApplicationCommandsJSONBody
        > = [];
        this.slashCommand.forEach(command => {
            const data: RESTPostAPIChatInputApplicationCommandsJSONBody = {
                name: command.name,
                description: command.description.content,
                type: ApplicationCommandType.ChatInput,
                options: command.options ? [...command.options] : [],
                dm_permission: false,
            };
            if (command.permissions.user.length > 0) {
                const permissionValue = PermissionsBitField.resolve(command.permissions.user);
                if (typeof permissionValue === 'bigint') {
                    data.default_member_permissions = permissionValue.toString();
                } else {
                    data.default_member_permissions = permissionValue;
                }
            }
            toRegister.push(data);
        });
        
        if (!guildId) {
            const rest = new REST({ version: '10' }).setToken(this.config.token);
            try {
                await rest.put(Routes.applicationCommands(this.config.clientId), {
                    body: toRegister,
                });
            } catch (error) {
                this.logger.error(`Failed to register interactions globally: ${error}`);
            }
        } else if (guildId && typeof guildId === 'string') {
            const rest = new REST({ version: '10' }).setToken(this.config.token);
            try {
                await rest.put(Routes.applicationGuildCommands(this.config.clientId, guildId), {
                    body: toRegister,
                });
            } catch (error) {
                this.logger.error(`Failed to register interactions in guild ${guildId}: ${error}`);
            }
        } else {
            throw new Error('Did you provide a valid guildId to register interactions');
        }
        this.logger.success('Successfully registered interactions');
        return `Successfully registered ${toRegister.length} interactions`;
    }

    public async printCmd(cmdName: string): Promise<string> {
        let cmd: ApplicationCommand | undefined;

        if (Object.keys(this.slashs).length === 0) {
            const cmds = await this.application.commands.fetch();
            for (const cmd of cmds.values()) {
                this.slashs.set(cmd.name, cmd);
            }
        }
        cmd = this.slashs.get(cmdName);
        if (cmd) {
            return `</${cmdName}:${cmd.id}>`;
        } else {
            return cmdName;
        }
    }

    public getCommand(name: string): Command {
        const cmd = this.commands.get(name);
        if (cmd) return cmd;
        return this.commands.find(cmd => cmd.aliases.includes(name));
    }

    public getInvite(): string {
        return this.generateInvite({
            scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands],
            permissions: [
                'AddReactions',
                'AttachFiles',
                'BanMembers',
                'ChangeNickname',
                'Connect',
                'ManageMessages',
                'ModerateMembers',
                'DeafenMembers',
                'EmbedLinks',
                'KickMembers',
                'ManageChannels',
                'ManageGuild',
                'ManageMessages',
                'ManageNicknames',
                'ManageRoles',
                'ModerateMembers',
                'MoveMembers',
                'MuteMembers',
                'PrioritySpeaker',
                'ReadMessageHistory',
                'SendMessages',
                'SendMessagesInThreads',
                'Speak',
                'ViewChannel',
            ],
        });
    }
}

declare module 'discord.js' {
    interface Client {
        commands: Collection<string, Command>;
        slashCommand: Collection<string, Command>;
        aliases: Collection<string, string>;
        cooldowns: Collection<string, Collection<string, any>>;
        db: Database;
        config: typeof config;
        logger: Logger;
        utils: Utils;
        shoukaku: ShoukakuClient;
        queue: Queue;
        isMaintenance: boolean;
        start(): Promise<void>;
        update(interaction: StringSelectMenuInteraction<CacheType> | UserSelectMenuInteraction<CacheType> | RoleSelectMenuInteraction<CacheType> | MentionableSelectMenuInteraction<CacheType> | ChannelSelectMenuInteraction<CacheType> | ButtonInteraction, data: any): Promise<void>;
        delay(ms: number): Promise<void>;
        reloadCommands(commandsToReload: string[]): void;
        registerInteractions(guildId?: string): Promise<string>;
        printCmd(cmdName: string): Promise<string>;
        getCommand(name: string): Command;
        getInvite(): string;
    }
}
