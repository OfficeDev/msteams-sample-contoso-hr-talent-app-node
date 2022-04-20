import { TurnContext } from "botbuilder";
import { ServiceContainer } from "../services/data/serviceContainer";

export abstract class CommandBase {
    public id: string;
    protected services: ServiceContainer;

    constructor (id: string, services: ServiceContainer) {
        this.id = id;
        this.services = services;
    }

    public abstract execute(turnContext: TurnContext) : Promise<void>;

    protected getTextWithoutCommand(text: string) : string {
        return text.trim().substring(this.id.length).trim();
    }
}