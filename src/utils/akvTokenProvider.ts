import { exec } from 'child_process';
import { promisify } from 'util';
import { KeyValueCache } from './keyValueCache';
const execAsync = promisify(exec);

export class AkvTokenProvider {
    private static readonly cacheExpirationInMinutes = 10;

    public async acquireToken(akvUrl: string): Promise<string> {
        const cachedSecret = KeyValueCache.get(akvUrl);
        if (cachedSecret) {
            return cachedSecret;
        }

        const { akvName, secretName, secretVersion } = this.parseAkvUrl(akvUrl);

        try {
            let command;
            if (secretVersion) {
                command = `az keyvault secret show --name ${secretName} --vault-name ${akvName} --version ${secretVersion} --query value -o tsv`;
            } else {
                command = `az keyvault secret show --name ${secretName} --vault-name ${akvName} --query value -o tsv`;
            }
            const { stdout, stderr } = await execAsync(command);
            if (stderr) {
                console.error(`Error fetching secret: ${stderr}`);
                return "";
            }
            const secret = stdout.trim();
            KeyValueCache.set(akvUrl, secret, AkvTokenProvider.cacheExpirationInMinutes);
            return secret;
        } catch (error) {
            console.error(`Failed to execute az command: ${error}`);
            return "";
        }
    }

    private parseAkvUrl(akvUrl: string): { akvName: string, secretName: string, secretVersion?: string } {
        const urlPattern = /^https:\/\/(?<akvName>[^.]+)\.vault\.azure\.net\/secrets\/(?<secretName>[^\/]+)(?:\/(?<secretVersion>[^\/]+))?$/;
        const match = akvUrl.replace("$akvSecret", "").trim().match(urlPattern);

        if (!match || !match.groups) {
            throw new Error("Invalid AKV URL format");
        }

        return {
            akvName: match.groups.akvName,
            secretName: match.groups.secretName,
            secretVersion: match.groups.secretVersion
        };
    }
}