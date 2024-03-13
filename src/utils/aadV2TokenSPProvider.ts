import { AadV2TokenCache } from './aadV2TokenCache';
import { AkvTokenProvider } from './akvTokenProvider';
import { AadV2TokenProvider, AuthParameters } from './aadV2TokenProvider';

export class AadV2TokenSPProvider {
    private aadV2TokenProvider: AadV2TokenProvider;

    public constructor() {
        this.aadV2TokenProvider = new AadV2TokenProvider();
    }

    public async acquireTokenSP(parameterString: string): Promise<string> {
        const { akvAppIdUrl, akvKeyUrl, tenantId, scope } = this.parseParameterString(parameterString);

        const appId = await this.getSecretFromAkv(akvAppIdUrl);
        const key = await this.getSecretFromAkv(akvKeyUrl);

        const authParams = new AuthParameters();
        authParams.clientId = appId;
        authParams.clientSecret = key;
        authParams.appUri = scope;
        authParams.scopes = [scope];
        authParams.tenantId = tenantId;
        authParams.appOnly = true;
        authParams.useAzCli = false;

        const cachedToken = AadV2TokenCache.getToken(authParams.getCacheKey());
        if (cachedToken) {
            return cachedToken.token;
        }

        const token = await this.aadV2TokenProvider.getConfidentialClientToken(authParams);

        return token;
    }

    private parseParameterString(parameterString: string): { akvAppIdUrl: string, akvKeyUrl: string, tenantId: string, scope: string } {
        const regex = /\s*appId:(?<akvAppIdUrl>[^\s]+)\s+key:(?<akvKeyUrl>[^\s]+)\s+tenantId:(?<tenantId>[^\s]+)\s+scope:(?<scope>[^\s]+)\s*/;
        const match = parameterString.match(regex);

        if (!match || !match.groups) {
            throw new Error("Invalid parameter string format");
        }

        return {
            akvAppIdUrl: match.groups.akvAppIdUrl,
            akvKeyUrl: match.groups.akvKeyUrl,
            tenantId: match.groups.tenantId,
            scope: match.groups.scope
        };
    }

    private async getSecretFromAkv(akvUrl: string): Promise<string> {
        const akvTokenProvider = new AkvTokenProvider();
        const secret = await akvTokenProvider.acquireToken(akvUrl);
        return secret;
    }
}
