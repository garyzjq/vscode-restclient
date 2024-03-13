export class KeyValueCache {
    private static cache = new Map<string, { value: string, expiresAt: number }>();

    public static get(key: string): string | undefined {
        const cachedValue = this.cache.get(key);
        if (cachedValue && cachedValue.expiresAt > Date.now()) {
            return cachedValue.value;
        }
        return undefined;
    }

    public static set(key: string, value: string, expiresInMinutes: number) {
        const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;
        this.cache.set(key, { value, expiresAt });
    }

    public static clear(): void {
        this.cache.clear();
    }
}