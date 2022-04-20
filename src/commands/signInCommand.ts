import { CardFactory, MessageFactory, TurnContext } from "botbuilder";
import { ServiceContainer } from "../services/data/serviceContainer";
import { TokenProvider } from "../services/tokenProvider";
import { CommandBase } from "./commandBase";
import { randomUUID } from "crypto";

export class SignInCommand extends CommandBase {

    tokenProvider: TokenProvider;

    constructor(services: ServiceContainer, tokenProvider: TokenProvider) {
        super("signin", services);

        this.tokenProvider = tokenProvider;
    }

    public async execute(turnContext: TurnContext): Promise<void> {

        if (await this.tokenProvider.hasToken(turnContext)) {
            await turnContext.sendActivity("You are already signed in");
            return;
        }

        // This is a very specific Adaptive Card that Teams knows how to
        // handle. It will get a token for the current user and check
        // that they have consented to your access_as_user scope
        const activity = MessageFactory.attachment({
            contentType: CardFactory.contentTypes.oauthCard,
            content: {
                tokenExchangeResource: {
                    id: randomUUID()
                },
                connectionName: process.env.OAuthConnectionName
            }
        });

        await turnContext.sendActivity(activity);
    }
}
