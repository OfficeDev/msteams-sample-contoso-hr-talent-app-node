import { ConfidentialClientApplication } from '@azure/msal-node';
import { ChannelAccount } from 'botbuilder';

// Simple implementation of a bot service API connector
export class ConnectorClient {

    // Gets an access token that can be used to call bot service
    public async getAccessToken() : Promise<string | undefined> {
        const cca = new ConfidentialClientApplication({
            auth: {
                clientId: process.env.MicrosoftAppId!,
                clientSecret: process.env.MicrosoftAppPassword,
                authority: `https://login.microsoftonline.com/botframework.com`
            }
        });

        // This uses the client credential grant process to get a token for bot service
        // very simply, this will call the `{authority}/oauth2/v2.0/token` endpoint
        const result = await cca.acquireTokenByClientCredential({
            scopes: ["https://api.botframework.com/.default"]
        });

        return result?.accessToken;
    }

    // This wraps the get conversation members bot service endpoint: 
    // https://docs.microsoft.com/en-us/azure/bot-service/rest-api/bot-framework-rest-connector-api-reference?view=azure-bot-service-4.0#get-conversation-members
    public async getConversationMembers(serviceUrl: string, conversationId: string): Promise<ChannelAccount[]> {
        const accessToken = await this.getAccessToken();
        const response = await fetch(`${serviceUrl}/v3/conversations/${conversationId}/members`, {
            headers: {
                authorization: `Bearer ${accessToken}`
            }
        });

        const body = await response.json() as ChannelAccount[];

        return body;
    }
}