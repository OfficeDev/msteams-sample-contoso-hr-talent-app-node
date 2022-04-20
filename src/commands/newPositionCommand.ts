import { CardFactory, MessageFactory, TurnContext } from "botbuilder";
import { ServiceContainer } from "../services/data/serviceContainer";
import { TokenProvider } from "../services/tokenProvider";
import { CommandBase } from "./commandBase";

export class NewPositionCommand extends CommandBase {

    tokenProvider: TokenProvider;

    constructor(services: ServiceContainer, tokenProvider: TokenProvider) {
        super("new job posting", services);
        this.tokenProvider = tokenProvider;
    }

    public async execute(turnContext: TurnContext): Promise<void> {
        const locations = await this.services.locationService.getAll();
        const hiringManagers = await this.services.recruiterService.getAllHiringManagers();

        const signedIn = await this.tokenProvider.hasToken(turnContext);

        const card = this.services.templatingService.getNewPositionAttachment(hiringManagers, locations, "chat", signedIn);

        const activity = MessageFactory.attachment(card);

        await turnContext.sendActivity(activity);
    }
}
