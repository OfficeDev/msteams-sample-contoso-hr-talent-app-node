import { CloudAdapter, MessageFactory } from 'botbuilder';
import {Express, Response} from 'express';
import { InstallBotResult } from './services/data/graphApiService';
import { NotificationResult } from './services/data/notificationService';
import { ServiceContainer } from './services/data/serviceContainer';

interface UserTenantRequest {
    id: string
    tenantId: string
}

interface NotifyRequest extends UserTenantRequest {
    text: string
}

const configure : (app : Express, services: ServiceContainer, adapter: CloudAdapter) => void = (app, services) => {

    // Setup the proactive notification endpoint. This endpoint is anonymous and will allow anyone to call it
    app.post('/api/notify', async (req, res) => {
        const body: NotifyRequest = req.body;

        // Create the activity from the text content in the request
        const activity = MessageFactory.text(body.text);

        try{
            // Send the activity to the indended user
            const result = await services.notificationService.sendProactiveNotification(body.id, body.tenantId, activity);

            // Alias not found
            if (result == NotificationResult.AliasNotFound) {
                return res.status(404).send(`Alias '${body.id}' was not found in the tenant '${body.tenantId}'`);
            }

            // Precondition failed - app not installed!
            // In order for a user to receive a message from the bot, the Teams app needs to be installed but that user
            if (result == NotificationResult.BotNotInstalled) {
                return res.status(412).send(`The bot has not been installed for '${body.id}' in the tenant '${body.tenantId}'`);
            }
            
        }
        catch (err: any) {
            handleError(err, res);
        }

        // Return "Accepted" as sending a proactive message is an asynchronous task
        return res.sendStatus(202);
    });

    // Set the proactive installation endpoint
    app.post('/api/installbot', async (req, res) => {
        const body: UserTenantRequest = req.body;

        try {
            // Use GraphAPI to proactively install the bot for the user
            const result = await services.graphApiService.installBotForUser(body.id, body.tenantId);

            switch (result) {
                // Unable to get an application token - this could be due to misconfiguration in the .env file
                case InstallBotResult.MissingToken:
                    return res.sendStatus(403);
                // Alias not found
                case InstallBotResult.AliasNotFound:
                    return res.sendStatus(404);
                // Success!
                case InstallBotResult.Success:
                    return res.sendStatus(200);
            }
        }
        catch (err: any) {
            handleError(err, res);
        }
    });

};

const handleError : (err: any, res: Response) => void = (err, res) => {

    //If we have a status code on the error object, set that as the response status, otherwise InternalServerError
    if (err.hasOwnProperty("statusCode")) {
        res.status(<number>err["statusCode"]);
    }
    else {
        res.status(500);
    }

    if (err.hasOwnProperty("body")) {
        const body = JSON.parse(err["body"]);
        if (body.hasOwnProperty("message")) {
            res.send(body["message"]);
        }
        else{
            res.send(err["body"]);
        }
    }
    else {
        res.send(err);
    }
}

export default configure;