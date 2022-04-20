import { TurnContext } from "botbuilder";
import { ServiceContainer } from "../services/data/serviceContainer";
import { CommandBase } from "./commandBase";

export class HelpCommand extends CommandBase {

    constructor(services: ServiceContainer) {
        super("help", services)
    }

    public async execute(turnContext: TurnContext): Promise<void> {

        const candidate = await this.services.candidateService.searchOne("");

        const helpMessage = "Here's what I can help you with:\n\n"
            + `* Show details about a candidate, for example: candidate details ${candidate?.name} \n`
            + `* Show summary about a candidate, for example: summary ${candidate?.name} \n`
            + `* Show top recent candidates for a Position ID, for example: top candidates ${candidate?.position?.externalId} \n`
            + `* Create a new job posting \n`
            + `* List all your open positions`;
        await turnContext.sendActivity(helpMessage);
    }
}