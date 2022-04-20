import { MessageFactory, TurnContext } from "botbuilder";
import { ServiceContainer } from "../services/data/serviceContainer";
import { CommandBase } from "./commandBase";

export class CandidateSummaryCommand extends CommandBase {

    constructor(services: ServiceContainer) {
        super("summary", services);
    }

    public async execute(turnContext: TurnContext): Promise<void> {
        const text = this.getTextWithoutCommand(turnContext.activity.text);
        const candidate = await this.services.candidateService.searchOne(text);

        if (!candidate) {
            await turnContext.sendActivity("Cannot find that candidate");
            return;
        }

        const card = this.services.templatingService.getCandidateSummaryAttachment(candidate);

        const activity = MessageFactory.attachment(card);

        await turnContext.sendActivity(activity);
    }
}
