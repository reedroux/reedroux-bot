import { Command, Context } from '../structures/index';

export default class Validator {
    public static isNumber(value: any): boolean {
        return typeof value === 'number';
    }
    public static isString(value: any): boolean {
        return typeof value === 'string';
    }
    public static isBoolean(value: any): boolean {
        return typeof value === 'boolean';
    }
    public static isArray(value: any): boolean {
        return Array.isArray(value);
    }
    public static isObject(value: any): boolean {
        return typeof value === 'object';
    }
    public static isFunction(value: any): boolean {
        return typeof value === 'function';
    }
    public static isNull(value: any): boolean {
        return value === null;
    }
    public static validateCommandOptions(options: Command): void {
        if (!this.isObject(options)) throw new TypeError('Command options must be an object');

        if (!options.name) throw new Error('Command name is required');
        if (!this.isString(options.name)) throw new TypeError('Command name must be a string');
        if (options.name.length > 32)
            throw new RangeError('Command name length must not exceed 32 characters');
        if (!options.description) throw new Error('Command description is required');
        if (!this.isObject(options.description))
            throw new TypeError('Command description must be an object');
        if (!this.isString(options.description.content))
            throw new TypeError('Command description content must be a string');
        if (options.description.content.length > 100)
            throw new RangeError(
                'Command description content length must not exceed 100 characters'
            );

        if (options.description.usage && !this.isString(options.description.usage))
            throw new TypeError('Command description usage must be a string');
        if (options.description.usage && options.description.usage.length > 100)
            throw new RangeError('Command description usage length must not exceed 100 characters');

        if (options.description.examples && !this.isArray(options.description.examples))
            throw new TypeError('Command description examples must be an array');
        if (options.description.examples && options.description.examples.length > 10)
            throw new RangeError('Command description examples length must not exceed 10 examples');
        if (
            options.description.examples &&
            options.description.examples.some((example: any) => !this.isString(example))
        )
            throw new TypeError('Command description examples must be an array of strings');

        if (options.aliases && !this.isArray(options.aliases))
            throw new TypeError(
                `Command aliases must be an array of strings in cmd: ${options.name}`
            );

        if (options.cooldown && !this.isNumber(options.cooldown))
            throw new TypeError('Command cooldown must be a number');

        if (options.args && !this.isBoolean(options.args))
            throw new TypeError('Command args must be a boolean');
        if (options.permissions) {
            if (!this.isObject(options.permissions))
                throw new TypeError('Command permissions must be an object');
            if (!this.isBoolean(options.permissions.dev))
                throw new TypeError('Command permissions dev must be a boolean');
            if (!this.isArray(options.permissions.client))
                throw new TypeError('Command permissions client must be an array');
            if (!this.isArray(options.permissions.user))
                throw new TypeError('Command permissions user must be an array');
        }
        if (options.slashCommand && !this.isBoolean(options.slashCommand))
            throw new TypeError('Command slashCommand must be a boolean');
        if (options.slashCommand && !this.isArray(options.options))
            throw new TypeError('Command options must be an array');
    }
    public static validateContext(context: Context): void {
        if (!this.isObject(context)) throw new TypeError('Context must be an object');
        if (!context.name) throw new Error('Context name is required');
        if (!this.isString(context.name)) throw new TypeError('Context name must be a string');
        if (context.name.length > 32)
            throw new RangeError('Context name length must not exceed 32 characters');
        if (!context.description) throw new Error('Context description is required');
        if (!this.isString(context.description))
            throw new TypeError('Context description must be a string');
        if (context.description.length > 100)
            throw new RangeError('Context description length must not exceed 100 characters');
        if (!context.type) throw new Error('Context type is required');
        if (context.type !== 2 && context.type !== 3)
            throw new TypeError('Context type must be 2 or 3');
        if (!context.run) throw new Error('Context run is required');
        if (!this.isFunction(context.run)) throw new TypeError('Context run must be a function');
    }
}
