import { Activity, BotFrameworkHttpClient, CloudAdapter, ConversationParameters, ConversationReference, TurnContext } from "botbuilder";
import { ConnectorClient } from "./botService";
import { ServiceContainer } from "./serviceContainer";

export enum NotificationResult {
    Success,
    AliasNotFound,
    BotNotInstalled,
    FailedToGetAppToken
}

export class NotificationService {
    
    adapter: CloudAdapter;
    services: ServiceContainer;

    constructor(services: ServiceContainer, adapter: CloudAdapter) {
        this.services = services;
        this.adapter = adapter;
    }

    public async sendProactiveNotification(aliasUpnOrOid: string, tenantId: string, activity: Partial<Activity>) : Promise<NotificationResult> {

        const chatIdResponse = await this.services.graphApiService.getProactiveChatIdForUser(aliasUpnOrOid, tenantId);

        if (!chatIdResponse) {
            return NotificationResult.FailedToGetAppToken;
        }

        const connectorClient = new ConnectorClient();
        const members = await connectorClient.getConversationMembers(process.env.ServiceUrl!, chatIdResponse.chatId!);

        const conversationParameters: Partial<ConversationParameters> = {
            isGroup: false,
            bot: {
                id: `28:${process.env.MicrosoftAppId}`,
                name: ""
            },
            tenantId,
            members
        };

        await this.adapter.createConversationAsync(process.env.MicrosoftAppId!, "", process.env.ServiceUrl!, "https://api.botframework.com", <ConversationParameters>conversationParameters, async (t1) => {
            const conversationReference: ConversationReference = {
                activityId: t1.activity.id,
                user: t1.activity.from,
                bot: t1.activity.recipient,
                conversation: t1.activity.conversation,
                channelId: t1.activity.channelId,
                locale: t1.activity.locale,
                serviceUrl: t1.activity.serviceUrl
            }
            await this.adapter.continueConversationAsync(process.env.MicrosoftAppId!, conversationReference, async (t2) => {
                await t2.sendActivity(activity);
            });
        });

        return NotificationResult.Success;
    }
}
