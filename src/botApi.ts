import { Express } from "express";
import { botFrameworkAuth } from "./auth";
import { ServiceContainer } from "./services/data/serviceContainer";
import { CloudAdapter, ConfigurationServiceClientCredentialFactory, ConfigurationBotFrameworkAuthentication, MemoryStorage, UserState, ShowTypingMiddleware } from 'botbuilder';
import { TeamsTalentMgmtBot } from "./bots/teamsTalentMgmtBot";

export const configureAdapter : () => CloudAdapter = () => {
    const credentialsFactory = new ConfigurationServiceClientCredentialFactory({
        MicrosoftAppId: process.env.MicrosoftAppId,
        MicrosoftAppPassword: process.env.MicrosoftAppPassword,
        MicrosoftAppTenantId: process.env.MicrosoftDirectoryId
    });
    
    const botFrameworkAuthentication = new ConfigurationBotFrameworkAuthentication(undefined, credentialsFactory);

    // Create the cloud adapter with our app credentials (used to get a bot service token)
    const adapter = new CloudAdapter(botFrameworkAuthentication);

    // Add the built-in middleware that shows the typing indicator when a message is being processed
    adapter.use(new ShowTypingMiddleware());

    // Handle any turn context errors
    adapter.onTurnError = async (context, error) => {
        console.error(`\n [onTurnError] unhandled error: ${ error }`);
    
        // Send a trace activity, which will be displayed in Bot Framework Emulator
        await context.sendTraceActivity(
            'OnTurnError Trace',
            `${ error }`,
            'https://www.botframework.com/schemas/error',
            'TurnError'
        );
    
        // Send a message to the user
        await context.sendActivity('The bot encountered an error or bug.');
        await context.sendActivity('To continue to run this bot, please fix the bot source code.');
    }

    return adapter;
}

// Configure the API endpoint
const configure : (app : Express, services: ServiceContainer, adapter: CloudAdapter) => void = (app, services, adapter) => {
    
    // You can persist state across requests using Blob storage or CosmosDB using the built-in storage implementations
    // ... or build your own!
    const memoryStorage = new MemoryStorage();

    // User state allows us to maintain state for each user across requests, regardless of where they came from
    const userState = new UserState(memoryStorage);
    
    // Create our bot instance
    const bot = new TeamsTalentMgmtBot(userState, services);
    
    // Setup the endpoint - this is the endpoint configured in Bot Service
    // Here we are also uing a piece of middleware that authenticates bot service tokens
    app.post('/api/messages', botFrameworkAuth, async (req, res) => {
        await adapter.process(req, res, context => bot.run(context));
    });
};

export default configure;