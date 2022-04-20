import { TeamsActivityHandler, TurnContext, UserState, Activity, SigninStateVerificationQuery, MessageFactory, AdaptiveCardInvokeResponse, AdaptiveCardInvokeValue, MessagingExtensionQuery, MessagingExtensionResponse, MessagingExtensionAction, MessagingExtensionActionResponse, FileConsentCardResponse, StatePropertyAccessor } from "botbuilder";
import { CommandBase } from "../commands/commandBase";
import { HelpCommand } from "../commands/helpCommand";
import { PositionDetailsCommand } from "../commands/positionDetailsCommand";
import { CandidateDetailsCommand } from "../commands/candidateDetailsCommand";
import { TopCandidatesCommand } from "../commands/topCandidatesCommand";
import { ServiceContainer } from "../services/data/serviceContainer";
import { InvokeActivityHandler } from "../services/invokeActivityHandler";
import { TokenProvider } from "../services/tokenProvider";
import { NewPositionCommand } from "../commands/newPositionCommand";
import { CandidateSummaryCommand } from "../commands/candidateSummaryCommand";
import { OpenPositionsCommand } from "../commands/openPositionsCommand";
import { SignOutCommand } from "../commands/signOutCommand";
import { SignInCommand } from "../commands/signInCommand";

export class TeamsTalentMgmtBot extends TeamsActivityHandler {

    userState: UserState;
    invokeHandler: InvokeActivityHandler;
    commands: {command: CommandBase, requireAuth: boolean}[];
    services: ServiceContainer;
    tokenProvider: TokenProvider;

    constructor(userState: UserState, services: ServiceContainer) {
        super();

        this.userState = userState;
        this.services = services;

        this.tokenProvider = new TokenProvider(userState);
        this.invokeHandler = new InvokeActivityHandler(this.tokenProvider, services);

        // Setup a simple array of available command implementations and whether they require authentication or not
        this.commands = [
            {command: new HelpCommand(services), requireAuth: false },
            {command: new CandidateDetailsCommand(services), requireAuth: true},
            {command: new PositionDetailsCommand(services), requireAuth: true},
            {command: new TopCandidatesCommand(services), requireAuth: true},
            {command: new NewPositionCommand(services, this.tokenProvider), requireAuth: true},
            {command: new CandidateSummaryCommand(services), requireAuth: true},
            {command: new OpenPositionsCommand(services), requireAuth: true},
            {command: new SignOutCommand(services, this.tokenProvider), requireAuth: false},
            {command: new SignInCommand(services, this.tokenProvider), requireAuth: false}
        ]

        // This is a generic handler for any inbound activity with a type of "text"
        // This could be a simple text message or something more complex like
        // an Adaptive Card result from an Action.Submit button (that wasn't invoked
        // from a messaging extension).
        this.onMessage(async (context, next): Promise<void> => {

            if (this.hasFiles(context.activity)) {
                // TODO: handle files
            }

            // Just a simple text message?
            if (context.activity.text) {
                await this.handleTextMessage(context, context.activity.text);
            }

            await next();
        });

        this.onInstallationUpdate(async (context, next): Promise<void> => {
            // If the app was updated or uninstalled, clear the welcome message state for the current user
            if (context.activity.action == "add") {
                await context.sendActivity(MessageFactory.attachment(services.templatingService.getWelcomeMessageAttachment()));
            }
            await next();
        });
    }

    // This is the entry point for the bot processing pipeline
    // Generally we want the base class to handle the initial processing
    // but this is a great place to save any state changes we've set
    // during the turn
    async run(context: TurnContext): Promise<void> {
        await super.run(context);

        await this.userState.saveChanges(context);
    }

    // This is a really simple implementation of the Strategy design pattern.
    // This could also be implemented with Dialogs which could be a better option if
    // we had more complex conversational flows between the user and the bot... but we dont!
    private async handleTextMessage(context: TurnContext, text: string) : Promise<void> {

        const commandText = text.trim().toLowerCase();
        const commandContainer = this.commands.find(x => commandText.startsWith(x.command.id))

        if (commandContainer) {

            let command = commandContainer.command;

            if (commandContainer.requireAuth) {

                if (!await this.tokenProvider.hasToken(context)) {
                    // We've found the command and determined that you need to be signed in
                    // to execute it. As there is no cached token, we create this as a sign in
                    // command instead to take the user though the sign in and consent flow
                    command = new SignInCommand(this.services, this.tokenProvider);
                }
            }
            
            // Execute the command
            await command.execute(context);
        }
        else {
            await context.sendActivity("Sorry, I didn't recognise that command. Type 'help' to see what I can do.");
        }
    }

    // Handles when a user clicks an adaptive card button with `Action.Submit` in a messaging extention
    // ... or adaptive card embeded task module invoked from a messaging extension
    protected async handleTeamsMessagingExtensionSubmitAction(context: TurnContext, action: MessagingExtensionAction): Promise<MessagingExtensionActionResponse> {
        return await this.invokeHandler.handleMessagingExtensionSubmitAction(action);
    }

    // Handles clicking on a messaging extension action button
    protected async handleTeamsMessagingExtensionFetchTask(context: TurnContext, action: MessagingExtensionAction): Promise<MessagingExtensionActionResponse> {
        return await this.invokeHandler.handleMessageExtensionFetchTask(context, action);
    }

    // Handles retrieving data for any messaging extension queries. This could be after typing some search text, or during the initial load
    // if `initialRun` was set
    protected async handleTeamsMessagingExtensionQuery(context: TurnContext, query: MessagingExtensionQuery): Promise<MessagingExtensionResponse> {
        return await this.invokeHandler.handleMessagingExtensionQuery(context, query, context.activity.channelData.source.name);
    }

    // Handles clicking an adaptive card button with `Action.Execute`
    protected async onAdaptiveCardInvoke(context: TurnContext, invokeValue: AdaptiveCardInvokeValue): Promise<AdaptiveCardInvokeResponse> {
        
        // Buttons with action.execute have a "verb" property to determine what the bot should do with the posted data
        switch(invokeValue.action.verb) {
            case "LeaveComment":
                return await this.invokeHandler.handleLeaveComment(invokeValue.action.data, context.activity.from.name);
            case "ScheduleInterview":
                return await this.invokeHandler.handleScheduleInterview(invokeValue.action.data);
            case "CreatePosition":
                return await this.invokeHandler.handleCreatePosition(invokeValue.action.data);
        }

        return {
            statusCode: 400,
            type: "",
            value: {}
        };
    }

    // Handles the callback from a signin and consent attempt - the token is in `context.activity.value.token`
    protected async handleTeamsSigninTokenExchange(context: TurnContext, query: SigninStateVerificationQuery): Promise<void> {
        await this.invokeHandler.handleSignInVerifyState(context);
    }

    // Handles the callback from clicking Allow in a file consent adaptive card
    protected async handleTeamsFileConsentAccept(context: TurnContext, fileConsentCardResponse: FileConsentCardResponse): Promise<void> {
        await this.invokeHandler.handleFileConsent(context, fileConsentCardResponse, true);
    }

    // Handles the callback from clicking Decline in a file consent adaptive card
    protected async handleTeamsFileConsentDecline(context: TurnContext, fileConsentCardResponse: FileConsentCardResponse): Promise<void> {
        await this.invokeHandler.handleFileConsent(context, fileConsentCardResponse, false);
    }

    private hasFiles(activity: Activity) : boolean {
        return activity.attachments?.some(x => x.contentType == "application/vnd.microsoft.teams.file.download.info") || false;
    }
}