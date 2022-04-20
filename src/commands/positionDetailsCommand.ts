import { CardFactory, MessageFactory, TurnContext } from "botbuilder";
import { ServiceContainer } from "../services/data/serviceContainer";
import { CommandBase } from "./commandBase";


export class PositionDetailsCommand extends CommandBase {

    constructor(services: ServiceContainer) {
        super("position", services);
    }

    public async execute(turnContext: TurnContext): Promise<void> {
        const text = this.getTextWithoutCommand(turnContext.activity.text);
        const position = await this.services.positionService.searchOne(text);

        if (!position) {
            await turnContext.sendActivity("Cannot find that position");
            return;
        }

        const card = this.services.templatingService.getPositionAttachment(position);

        const activity = MessageFactory.attachment(card);

        await turnContext.sendActivity(activity);
    }
}
