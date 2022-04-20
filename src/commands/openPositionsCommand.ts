import { MessageFactory, TurnContext } from "botbuilder";
import { ServiceContainer } from "../services/data/serviceContainer";
import { CommandBase } from "./commandBase";

export class OpenPositionsCommand extends CommandBase {

    constructor(services: ServiceContainer) {
        super("open positions", services);
    }

    public async execute(turnContext: TurnContext): Promise<void> {
        const positions = await this.services.positionService.getAll(true);

        const positionsAttachment = this.services.templatingService.getPositionsAsListAttachment(positions, "position", "Open positions");

        await turnContext.sendActivity(MessageFactory.attachment(positionsAttachment));
    }
}