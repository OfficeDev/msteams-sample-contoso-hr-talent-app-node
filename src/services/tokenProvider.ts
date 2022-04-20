import { StatePropertyAccessor, TurnContext, UserState } from "botbuilder";

export class TokenProvider {
    tokenAccessor: StatePropertyAccessor<string>;

    constructor(userState: UserState) {
        this.tokenAccessor = userState.createProperty<string>("userToken");
    }

    public getToken(turnContext: TurnContext) : Promise<string | undefined> {
        return this.tokenAccessor.get(turnContext);
    }

    public setToken(token: string, turnContext: TurnContext) : Promise<void> {
        return this.tokenAccessor.set(turnContext, token);
    }

    public async hasToken(turnContext: TurnContext) : Promise<boolean> {
        return !!(await this.getToken(turnContext));
    }
}