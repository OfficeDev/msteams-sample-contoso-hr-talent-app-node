import { MessageFactory, TurnContext } from "botbuilder";
import { ServiceContainer } from "../services/data/serviceContainer";
import { TokenProvider } from "../services/tokenProvider";
import { CommandBase } from "./commandBase";

export class SignOutCommand extends CommandBase {

    tokenProvider: TokenProvider;

    constructor(services: ServiceContainer, tokenProvider: TokenProvider) {
        super("signout", services);

        this.tokenProvider = tokenProvider;
    }

    public async execute(turnContext: TurnContext): Promise<void> {

        if (!await this.tokenProvider.hasToken(turnContext)) {
            await turnContext.sendActivity("You are not signed in");
            return;
        }

        // We are simply going to clear the user state for the token
        await this.tokenProvider.setToken("", turnContext);
        
        await turnContext.sendActivity("You have been successfuly signed out");
    }
}


