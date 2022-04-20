import { parseBool } from "adaptivecards";
import { AdaptiveCardInvokeResponse, Attachment, CardFactory, FileConsentCardResponse, InvokeResponse, MessageFactory, MessagingExtensionAction, MessagingExtensionActionResponse, MessagingExtensionAttachment, MessagingExtensionQuery, MessagingExtensionResponse, TurnContext } from "botbuilder";
import { convertInvokeActionDataToComment, convertInvokeActionDataToInterview, convertInvokeActionDataToPosition, Position } from "./data/dtos";
import { ServiceContainer } from "./data/serviceContainer";
import { TokenProvider } from "./tokenProvider";
import "isomorphic-fetch";

export class InvokeActivityHandler {

    tokenProvider: TokenProvider;
    services: ServiceContainer;

    constructor(tokenProvider: TokenProvider, services: ServiceContainer) {
        this.tokenProvider = tokenProvider;
        this.services = services;
    }

    public async handleSignInVerifyState(turnContext: TurnContext) : Promise<InvokeResponse> {
        const token = turnContext.activity.value?.token;

        if (token) {
            await this.tokenProvider.setToken(token, turnContext);
            await turnContext.sendActivity("You have signed in successfully. Please type the command one more time");
        }

        return {
            status: 200
        };
    }

    public async handleMessagingExtensionSubmitAction(action: MessagingExtensionAction): Promise<MessagingExtensionActionResponse> {
        switch(action.data.commandId) {
            case "createPosition":
                let position = convertInvokeActionDataToPosition(action.data) ;
                position = await this.services.positionService.createPosition(position);
                const card = this.services.templatingService.getPositionAttachment(position, true);
                return {
                    task: {
                        type: "continue",
                        value: {
                            card,
                            title: "New position created",
                            width: "medium",
                            height: "medium"
                        }
                    }
                }
            case "sharePosition": {
                const position = await this.services.positionService.getById(parseInt(action.data.positionId), true);
                const positionCard = this.services.templatingService.getPositionAttachment(<Position>position);
                return {
                    composeExtension: {
                        attachments: [positionCard],
                        type: "result",
                        attachmentLayout: "list"
                    }
                }
            }
        }

        return {}
    }

    public async handleMessageExtensionFetchTask(context: TurnContext, action: MessagingExtensionAction): Promise<MessagingExtensionActionResponse> {

        if (action.commandId == "newPosition") {
            const locations = await this.services.locationService.getAll();
            const recruiters = await this.services.recruiterService.getAllHiringManagers();
            const signedIn = await this.tokenProvider.hasToken(context);

            const card = this.services.templatingService.getNewPositionAttachment(recruiters, locations, "compose", signedIn);

            return Promise.resolve({
                task: {
                    type: "continue",
                    value: {
                        card,
                        title: "Create new position",
                        width: "large",
                        height: "large"
                    }
                }
            });
        }

        return Promise.resolve({});
    }

    public async handleMessagingExtensionQuery(context: TurnContext, query: MessagingExtensionQuery, source: string): Promise<MessagingExtensionResponse> {

        if (!await this.tokenProvider.hasToken(context)) {
            return Promise.resolve({
                composeExtension: {
                    text: "You need to be signed in to use this messaging extension, please type 'signin' into the chat with your bot",
                    type: "message"
                }
            });
        }

        const initialRun = parseBool(query.parameters?.find(x => x.name == "initialRun")?.value);
        const maxResults = initialRun ? 5 : (query.queryOptions?.count || 5);
        const searchText = query.parameters?.find(x => x.name == "searchText")?.value;

        const attachments: MessagingExtensionAttachment[] = [];

        switch(query.commandId) {
            case "searchPositions":
                const positions = await this.services.positionService.search(searchText, maxResults);
                
                positions.forEach(x => {
                    attachments.push({
                        ...this.services.templatingService.getPositionAttachment(x),
                        preview: this.services.templatingService.getPositionPreviewAttachment(x)
                    })
                });
                break;
            case "searchCandidates":
                const candidates = await this.services.candidateService.search(searchText, maxResults);
                const recruiters = await this.services.recruiterService.getAll(true);
                candidates.forEach(x => {
                    attachments.push({
                        ...this.services.templatingService.getCandidateAttachment(x, recruiters, "", source === "compose"),
                        preview: this.services.templatingService.getCandidatePreviewAttachment(x)
                    })
                });
                break;
        }

        return Promise.resolve({
            composeExtension: {
                attachments,
                type: "result",
                attachmentLayout: "list"
            }
        });
    }

    public async handleLeaveComment(invokeData: any, authorName: string): Promise<AdaptiveCardInvokeResponse> {
        const comment = convertInvokeActionDataToComment(invokeData, authorName);
        const candidate = await this.services.candidateService.getById(comment.candidateId, true);
        const recruiters = await this.services.recruiterService.getAll();

        if (!candidate) {
            return this.getAdaptiveCardInvokeResponse(404);
        }

        await this.services.candidateService.saveComment(comment);
        return this.getAdaptiveCardInvokeResponse(200, this.services.templatingService.getCandidateAttachment(candidate, recruiters, "Comment added"));
    }

    public async handleScheduleInterview(invokeData: any): Promise<AdaptiveCardInvokeResponse> {
        const interview = convertInvokeActionDataToInterview(invokeData);
        const candidate = await this.services.candidateService.getById(interview.candidateId, true);
        const recruiters = await this.services.recruiterService.getAll();

        if (!candidate) {
            return this.getAdaptiveCardInvokeResponse(404);
        }

        await this.services.interviewService.scheduleInterview(interview);
        return this.getAdaptiveCardInvokeResponse(200, this.services.templatingService.getCandidateAttachment(candidate, recruiters, "Interview scheduled"));
    }

    public async handleCreatePosition(invokeData: any): Promise<AdaptiveCardInvokeResponse> {
        let position = convertInvokeActionDataToPosition(invokeData);
        position = await this.services.positionService.createPosition(position);
        const card = this.services.templatingService.getPositionAttachment(position, true);
        return this.getAdaptiveCardInvokeResponse(200, card);
    }

    public async handleFileConsent(turnContext: TurnContext, response: FileConsentCardResponse, accept: boolean): Promise<void> {

        const candidate = await this.services.candidateService.getById(parseInt(response.context.candidateId));

        if (!candidate) {
            return;
        }

        if (!await this.tokenProvider.hasToken(turnContext)) {
            const declineAttachment = this.services.templatingService.getCandidateSummaryFailedAttachment(candidate, "You must be signed in to download a candidate summary");
            const updateActivityWithDecline = MessageFactory.attachment(declineAttachment);
            updateActivityWithDecline.id = turnContext.activity.replyToId;

            await turnContext.updateActivity(updateActivityWithDecline);
            return;
        }

        if (!accept) {
            const declineAttachment = this.services.templatingService.getCandidateSummaryFailedAttachment(candidate, "Declined");
            const updateActivityWithDecline = MessageFactory.attachment(declineAttachment);
            updateActivityWithDecline.id = turnContext.activity.replyToId;

            await turnContext.updateActivity(updateActivityWithDecline);
            return;
        }

        if (!response.uploadInfo) {
            return;
        }

        const charArray = [candidate.summary.length];
        for (let i = 0; i < candidate.summary.length; i++) {
            charArray[i] = candidate.summary.charCodeAt(i) & 0xFF;
        }
        const arrayBuffer = Buffer.from(charArray);

        await fetch(response.uploadInfo?.uploadUrl!, {
            body: arrayBuffer,
            headers: {
                "content-range": `bytes 0-${arrayBuffer.byteLength - 1}/${arrayBuffer.byteLength}`,
                "content-type": "application/octet-stream"
            },
            method: "PUT"
        });

        const attachment = this.services.templatingService.getFileInfoCardAttachment(response.uploadInfo);
        const activity = MessageFactory.attachment(attachment);

        const allowCard = this.services.templatingService.getCandidateSummaryAllowAttachment(candidate);

        const updateActivity = MessageFactory.attachment(allowCard);
        updateActivity.id = turnContext.activity.replyToId;

        await turnContext.updateActivity(updateActivity);

        await turnContext.sendActivity(activity);
    }

    private getAdaptiveCardInvokeResponse(status: number, attachment?: Attachment): AdaptiveCardInvokeResponse {
        return {
            type: attachment ? attachment.contentType : "",
            statusCode: status,
            value: attachment ? attachment.content : {}
        };
    }
}