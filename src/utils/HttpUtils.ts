export class HttpUtils {
    public static async getJson(
        url: string,
        options?: RequestInit
    ): Promise<{ success: boolean; status?: number; data?: any }> {
        try {
            const response = options ? await fetch(url, options) : await fetch(url);
            const json = await response.json();
            return {
                success: response.status === 200 ? true : false,
                status: response.status,
                data: json,
            };
        } catch (ex) {
            console.error(`Error fetching JSON from ${url}: ${ex}`);
            return {
                success: false,
            };
        }
    }
}
