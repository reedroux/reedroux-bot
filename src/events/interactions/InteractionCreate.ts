import {
    Interaction,
    InteractionType,
    ContextMenuCommandInteraction,
    ChatInputCommandInteraction,
    ButtonInteraction,
    AutocompleteInteraction,
} from 'discord.js';
import { BotClient, Event } from '../../structures/index';
import {
    handleCommands,
    handleContext,
    handleAutoComplete,
    handleButtons,
} from '../../handlers/index';
import { Maintenance } from '../../helpers/decorators/Maintenance';

export default class InteractionCreate extends Event {
    constructor(client: BotClient, file: string) {
        super(client, file, {
            name: 'interactionCreate',
        });
    }

    @Maintenance()
    public async run(interaction: Interaction): Promise<any> {
        if (interaction.isCommand()) {
            // Ensure it's in a guild
            if (!interaction.guild) {
                await interaction.reply({
                    content: 'This command can only be executed in a server.',
                    ephemeral: true,
                }).catch(() => {});
                return;
            }
        }

        if (interaction.isChatInputCommand()) {
            // Slash command
            await new handleCommands().handleSlashCommand(interaction as ChatInputCommandInteraction);
        } else if (interaction.isContextMenuCommand()) {
            // Context menu
            const context = this.client.contextMenus.get(interaction.commandName);
            if (!context) return;
            await new handleContext().handleContext(interaction as ContextMenuCommandInteraction, context);
        } else if (interaction.isButton()) {
            // Button interaction
            await new handleButtons().handle(interaction as ButtonInteraction);
        } else if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
            // Autocomplete
            await new handleAutoComplete().handle(interaction as AutocompleteInteraction);
        }
    }
}
