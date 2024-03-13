export class AadV2TokenCache {

    private static tokens: Map<string, AadV2TokenCacheEntry> = new Map<string, AadV2TokenCacheEntry>();

    public static setToken(cacheKey: string, scopes: string[], token: string, expires_in: number) {
        const entry: AadV2TokenCacheEntry = new AadV2TokenCacheEntry();
        entry.token = token;
        entry.scopes = scopes;
        this.tokens.set(cacheKey, entry);
        setTimeout(() => {
            this.tokens.delete(cacheKey);
        }, expires_in * 1000);
    }

    public static getToken(cacheKey: string): AadV2TokenCacheEntry | undefined {
        return this.tokens.get(cacheKey);
    }
}

export class AadV2TokenCacheEntry {
    public token: string;
    public scopes: string[];
    public supportScopes(scopes: string[]): boolean {
        return scopes.every((scope) => this.scopes.includes(scope));
    }
}
