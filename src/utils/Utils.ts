import { ColorResolvable, PermissionResolvable } from 'discord.js';
import { lstatSync, readdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import permissions from '../helpers/Permissions';
import http from 'node:http'
import https from 'node:https'
import http2 from 'node:http2'
import zlib from 'node:zlib'
import process from 'node:process'

export default class Utils {
    public static containsLink(text: string): boolean {
        return /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/.test(
            text
        );
    }
    public static coDiscordInvite(text: string): boolean {
        return /(https?:\/\/)?(www.)?(discord.(gg|io|me|li|link|plus)|discorda?p?p?.com\/invite|invite.gg|dsc.gg|urlcord.cf)\/[^\s/]+?(?=\b)/.test(
            text
        );
    }
    public static parsePermissions(perms: PermissionResolvable[]): string {
        const permissionWord = `permission${perms.length > 1 ? 's' : ''}`;
        return `\`${perms.map(perm => permissions[perm as string] || perm).join('`, `')}\` ${permissionWord}`;
    }

    public static _http1Events(request, headers, statusCode) {
        return new Promise((resolve) => {
            let data = ''

            request.setEncoding('utf8')
            request.on('data', (chunk) => data += chunk)
            request.on('end', () => {
                resolve({
                    statusCode: statusCode,
                    headers: headers,
                    body: (headers && headers['content-type'] && headers['content-type'].startsWith('application/json')) ? JSON.parse(data) : data
                })
            })
        })
    }

    public static http1makeRequest(url: string, options: { method: string, headers?: any, body?: any, streamOnly?: boolean, disableBodyCompression?: boolean }) {
        return new Promise(async (resolve, reject) => {
            let compression = null

            let req = (url.startsWith('https') ? https : http).request(url, {
                method: options.method,
                headers: {
                    'Accept-Encoding': 'br, gzip, deflate',
                    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/111.0',
                    'DNT': '1',
                    ...(options.headers || {}),
                    ...(options.body ? { 'Content-Type': 'application/json' } : {})
                }
            }, async (res) => {
                const statusCode = res.statusCode
                const headers = res.headers

                if (headers.location) {
                    resolve(await Utils.http1makeRequest(headers.location, options))
                    return res.destroy()
                }

                switch (res.headers['content-encoding']) {
                    case 'deflate': {
                        compression = zlib.createInflate()
                        break
                    }
                    case 'br': {
                        compression = zlib.createBrotliDecompress()
                        break
                    }
                    case 'gzip': {
                        compression = zlib.createGunzip()
                        break
                    }
                }

                if (compression) {
                    res.pipe(compression)

                    if (options.streamOnly) {
                        return resolve({
                            statusCode,
                            headers,
                            stream: compression
                        })
                    }

                    resolve(await Utils._http1Events(compression, headers, statusCode))
                } else {
                    if (options.streamOnly) {
                        return resolve({
                            statusCode,
                            headers,
                            stream: res
                        })
                    }

                    resolve(await Utils._http1Events(res, headers, statusCode))
                }
            })

            if (options.body) {
                if (options.disableBodyCompression || process.versions.deno)
                    req.end(JSON.stringify(options.body))
                else zlib.gzip(JSON.stringify(options.body), (error, data) => {
                    if (error) throw new Error(`\u001b[31mhttp1makeRequest\u001b[37m]: Failed gziping body: ${error}`)
                    req.end(data)
                })
            } else req.end()

            req.on('error', (error) => {
                console.error(`[\u001b[31mhttp1makeRequest\u001b[37m]: Failed sending HTTP request to ${url}: \u001b[31m${error}\u001b[37m`)
                reject(error)
            })
        })
    }
    public static _http2Events(request, headers) {
        return new Promise((resolve) => {
            let data = ''

            request.setEncoding('utf8')
            request.on('data', (chunk) => data += chunk)
            request.on('end', () => {
                resolve({
                    statusCode: headers[':status'],
                    headers: headers,
                    body: (headers && headers['content-type'] && headers['content-type'].startsWith('application/json')) ? JSON.parse(data) : data
                })
            })
        })
    }
    public static makeRequest(url, options) {
        if (process.versions.deno) return Utils.http1makeRequest(url, options)
        return new Promise(async (resolve) => {
            const parsedUrl = new URL(url)
            let compression = null

            const client = http2.connect(parsedUrl.origin)

            let reqOptions = {
                ':method': options.method,
                ':path': parsedUrl.pathname + parsedUrl.search,
                'Accept-Encoding': 'br, gzip, deflate',
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/111.0',
                'DNT': '1',
                ...(options.headers || {})
            }

            if (options.body) {
                if (!options.disableBodyCompression) reqOptions['Content-Encoding'] = 'gzip'

                reqOptions['Content-Type'] = 'application/json'
            }

            let req = client.request(reqOptions)

            client.on('connect', () => {
                if (client.alpnProtocol !== 'h2') {
                    client.close()

                    resolve({
                        error: {
                            message: 'No HTTP/2 support'
                        }
                    })
                }
            })

            client.on('error', () => {
                console.log(`[\u001b[31mmakeRequest\u001b[37m]: Failed connecting to ${url}.`)
            })

            req.on('error', (error) => {
                console.log(`[\u001b[31mmakeRequest\u001b[37m]: Failed sending HTTP request to ${url}: \u001b[31m${error}\u001b[37m`)
                resolve({ error })
            })

            req.on('response', async (headers) => {
                if (headers.location) {
                    client.close()
                    req.destroy()

                    return resolve(await Utils.makeRequest(headers.location, options))
                }

                switch (headers['content-encoding']) {
                    case 'deflate': {
                        compression = zlib.createInflate()
                        break
                    }
                    case 'br': {
                        compression = zlib.createBrotliDecompress()
                        break
                    }
                    case 'gzip': {
                        compression = zlib.createGunzip()
                        break
                    }
                }

                if (compression) {
                    req.pipe(compression)

                    if (options.streamOnly) {
                        req.on('end', () => client.close())

                        return resolve({
                            statusCode: headers[':status'],
                            headers: headers,
                            stream: compression
                        })
                    }

                    compression.on('error', (error) => {
                        console.log(`[\u001b[31mmakeRequest\u001b[37m]: Failed decompressing HTTP response: \u001b[31m${error}\u001b[37m`)
                        resolve({ error })
                    })

                    resolve(await Utils._http2Events(compression, headers))

                    client.close()
                } else {
                    if (options.streamOnly) {
                        req.on('end', () => client.close())

                        return resolve({
                            statusCode: headers[':status'],
                            headers: headers,
                            stream: req
                        })
                    }
                    resolve(await Utils._http2Events(req, headers))
                    client.close()
                }
            })

            if (options.body) {
                if (options.disableBodyCompression)
                    req.end(JSON.stringify(options.body))
                else zlib.gzip(JSON.stringify(options.body), (error, data) => {
                    if (error) throw new Error(`\u001b[31mmakeRequest\u001b[37m]: Failed gziping body: ${error}`)
                    req.end(data)
                })
            } else req.end()
        })
    }
    public static playerTime(time: any) {
        const hours = Math.floor(time / 3600000);
        const minutes = Math.floor((time % 3600000) / 60000);
        const seconds = Math.floor(((time % 360000) % 60000) / 1000);
        const hoursString = hours.toString().padStart(2, '0');
        const minutesString = minutes.toString().padStart(2, '0');
        const secondsString = seconds.toString().padStart(2, '0');
        if (hours >= 24) {
            return 'LIVE';
        } else if (hours > 0) {
            return `${hoursString}:${minutesString}:${secondsString}`;
        } else {
            return `${minutesString}:${secondsString}`;
        }
    }
    public static timeformat(timeInSeconds: number): string {
        const days = Math.floor((timeInSeconds % 31536000) / 86400);
        const hours = Math.floor((timeInSeconds % 86400) / 3600);
        const minutes = Math.floor((timeInSeconds % 3600) / 60);
        const seconds = Math.round(timeInSeconds % 60);
        return (
            (days > 0 ? `${days} days, ` : '') +
            (hours > 0 ? `${hours} hours, ` : '') +
            (minutes > 0 ? `${minutes} minutes, ` : '') +
            (seconds > 0 ? `${seconds} seconds` : '')
        );
    }
    public static getRandomColor(): ColorResolvable {
        const R = Math.floor(Math.random() * 256);
        const G = Math.floor(Math.random() * 256);
        const B = Math.floor(Math.random() * 256);

        return `#${R.toString(16)}${G.toString(16)}${B.toString(16)}`;
    }
    public static stringToMs(str: string): number {
        const time = str.split(' ');
        let ms = 0;
        time.forEach(t => {
            const type = t.slice(-1);
            const num = parseInt(t.slice(0, -1));
            switch (type) {
                case 'd':
                    ms += num * 86400000;
                    break;
                case 'h':
                    ms += num * 3600000;
                    break;
                case 'm':
                    ms += num * 60000;
                    break;
                case 's':
                    ms += num * 1000;
                    break;
                default:
                    break;
            }
        });
        return ms;
    }
    static capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    static removeDuplicates(arr: any[]): any[] {
        const uniqueArray: any[] = [];
        for (const elem of arr) {
            if (!uniqueArray.includes(elem)) {
                uniqueArray.push(elem);
            }
        }
        return uniqueArray;
    }
    public static chunk(array: any[], size: number): any {
        const chunked_arr = [];
        let index = 0;
        while (index < array.length) {
            chunked_arr.push(array.slice(index, size + index));
            index += size;
        }
        return chunked_arr;
    }
    static parseTime(time: string): number {
        const regex = /(?:(\d+)(?:d|days?))?\s?(?:(\d+)(?:h|hours?))?\s?(?:(\d+)(?:m|minutes?))?\s?(?:(\d+)(?:s|seconds?))?\s?(?:(\d{1,2}):(\d{2})(?::(\d{2}))?)?\s?/i;
        const matches = regex.exec(time);
        if (!matches) return 0;
        const days = parseInt(matches[1]) || 0;
        const hours = parseInt(matches[2]) || 0;
        const minutes = parseInt(matches[3]) || 0;
        const seconds = parseInt(matches[4]) || 0;
        const colHours = parseInt(matches[5]) || 0;
        const colMinutes = parseInt(matches[6]) || 0;
        const colSeconds = parseInt(matches[7]) || 0;

        let ms = 0;
        if (days) ms += days * 86400000;
        if (hours) ms += hours * 3600000;
        if (minutes) ms += minutes * 60000;
        if (seconds) ms += seconds * 1000;
        if (colHours) ms += colHours * 3600000;
        if (colMinutes) ms += colMinutes * 60000;
        if (colSeconds) ms += colSeconds * 1000;
        return ms;
    }

    static ms(time: string): number {
        const timeArray = time.split(' ');
        let ms = 0;
        timeArray.forEach(t => {
            const type = t.slice(-1);
            const num = parseInt(t.slice(0, -1));
            switch (type) {
                case 'd':
                    ms += num * 86400000;
                    break;
                case 'h':
                    ms += num * 3600000;
                    break;
                case 'm':
                    ms += num * 60000;
                    break;
                case 's':
                    ms += num * 1000;
                    break;
                default:
                    break;
            }
        });

        return ms;
    }
    static formatTime(ms: number): string {
        const time = {
            d: 0,
            h: 0,
            m: 0,
            s: 0,
        };
        while (ms > 0) {
            if (ms >= 86400000) {
                time.d++;
                ms -= 86400000;
            } else if (ms >= 3600000) {
                time.h++;
                ms -= 3600000;
            } else if (ms >= 60000) {
                time.m++;
                ms -= 60000;
            } else {
                time.s++;
                ms -= 1000;
            }
        }
        return `${time.d}d ${time.h}h ${time.m}m ${time.s}s`;
    }
    static recursiveReadDirSync(dir: string, allowedExtensions: string[]): string[] {
        const filePaths = [];
        const readCommands = (dir: string): void => {
            const files = readdirSync(join(process.cwd(), dir));
            files.forEach(file => {
                const stat = lstatSync(join(process.cwd(), dir, file));
                if (stat.isDirectory()) {
                    readCommands(join(dir, file));
                } else {
                    const extension = extname(file);
                    if (!allowedExtensions.includes(extension)) return;
                    const filePath = join(process.cwd(), dir, file);
                    filePaths.push(filePath);
                }
            });
        };
        readCommands(dir);
        return filePaths;
    }

    // reload a all commands 
    static reloadCommands(dir: string, allowedExtensions: string[]): void {
        const commandFiles = Utils.recursiveReadDirSync(dir, allowedExtensions);
        for (const file of commandFiles) {
            delete require.cache[require.resolve(file)];
        }
    }
}
