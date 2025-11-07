import { ContextMenuCommandInteraction } from 'discord.js';
import { Context } from '../structures/index';
import Utils from '../utils/Utils';

export default class handleContext {
    private cooldownCache = new Map();

    public async handleContext(
        interaction: ContextMenuCommandInteraction,
        context: Context
    ): Promise<any> {
        // check cooldown
        if (context.cooldown) {
            const remaining = this.getRemainingCooldown(interaction.user.id, context);
            if (remaining > 0) {
                return await interaction.reply({
                    content: `\`❌\` You are on cooldown. You can again use the command after ${Utils.timeformat(remaining)}`,
                    ephemeral: true,
                });
            }
        }
        // check permissions
        if (context.permissions) {
            const user_permissions = context.permissions.user;

            const missing_user_permissions = user_permissions.filter(
                (x: any) =>
                    typeof interaction.member.permissions !== 'string' &&
                    interaction.member.permissions.has(x)
            );
            if (missing_user_permissions.length > 0) {
                return await interaction.reply({
                    content: `\`❌\` You need ${Utils.parsePermissions(missing_user_permissions)} to execute this command.`,
                    ephemeral: true,
                });
            }
        }

        try {
            await context.run(interaction);
        } catch (error) {
            console.error(error);
            return await interaction.reply({
                content: '\`❌\` An error occurred while executing this command.',
                ephemeral: true,
            });
        } finally {
            if (context.cooldown) {
                this.setCooldown(interaction.user.id, context);
            }
        }
    }

    private getRemainingCooldown(id: string, context: Context): number {
        const key = context.name + '|' + id;
        if (this.cooldownCache.has(key)) {
            const remaining = (Date.now() - this.cooldownCache.get(key)) * 0.001;
            if (remaining > context.cooldown) {
                this.cooldownCache.delete(key);
                return 0;
            }
            return context.cooldown - remaining;
        }
        return 0;
    }

    private setCooldown(id: string, context: Context) {
        const key = context.name + '|' + id;
        this.cooldownCache.set(key, Date.now());
    }
}
