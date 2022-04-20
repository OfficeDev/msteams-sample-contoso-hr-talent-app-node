import { MessageFactory, TurnContext } from "botbuilder";
import { ServiceContainer } from "../services/data/serviceContainer";
import { CommandBase } from "./commandBase";


export class TopCandidatesCommand extends CommandBase {

    constructor(services: ServiceContainer) {
        super("top candidates", services);
    }

    public async execute(turnContext: TurnContext): Promise<void> {
        const text = this.getTextWithoutCommand(turnContext.activity.text);
        const positions = await this.services.positionService.search(text, 15);

        if (positions.length == 1) {
            const candidatesAttachment = this.services.templatingService.getCandidatesAsListAttachment(positions[0].candidates, "candidate details", "Top candidates who have recently applied for this position");
            await turnContext.sendActivity(MessageFactory.attachment(candidatesAttachment));
            return;
        }

        if (positions.length == 0) {
            await turnContext.sendActivity(`Sorry, there is no position with the id ${text.trim()}`)
        }

        const positionsAttachment = this.services.templatingService.getPositionsAsListAttachment(positions, "top candidates", "Please choose a position to see the top candidates for");
        await turnContext.sendActivity(MessageFactory.attachment(positionsAttachment));
    }
}
