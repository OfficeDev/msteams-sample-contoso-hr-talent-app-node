import { Candidate, Position, Recruiter, Location, CardListItem, ListCard } from "./dtos";
import * as fs from 'fs';
import * as path from 'path';
import * as act from 'adaptivecards-templating';
import { Attachment, CardFactory, CardImage, FileUploadInfo } from "botbuilder";


export class TemplatingService {

    candidateTemplate: string = "";
    positionTemplate: string = "";
    newPositionTempalte: string = "";
    templatesPath: string = "";

    public load(templatesPath: string) {
        this.templatesPath = templatesPath;
        this.candidateTemplate = fs.readFileSync(path.join(templatesPath, "candidateTemplate.json")).toString();
        this.positionTemplate = fs.readFileSync(path.join(templatesPath, "positionTemplate.json")).toString();
        this.newPositionTempalte = fs.readFileSync(path.join(templatesPath, "newPositionTemplate.json")).toString();
    }

    public getCandidateAttachment(candidate: Candidate, recruiters: Recruiter[], status?: string, renderActions: boolean = true): Attachment {
        const template = new act.Template(JSON.parse(this.candidateTemplate));
        const payload = template.expand({
            $root: {
                ...candidate,
                recruiters,
                hasComments: candidate.comments && candidate.comments.length > 0,
                status: status || "",
                candidateFeedbackUrl: `https://teams.microsoft.com/l/task/${process.env.TeamsAppId}?url=${encodeURIComponent(`${process.env.BaseUrl}/StaticViews/CandidateFeedback.html?candidateId=${candidate.id}`)}&title=${encodeURIComponent(`Feedback for ${candidate.name}`)}&completionBotId=${process.env.MicrosoftAppId}&height=large&width=large`,
                renderActions
            }
        });

        return CardFactory.adaptiveCard(payload);
    }

    public getCandidatePreviewAttachment(candidate: Candidate): Attachment {
        return CardFactory.thumbnailCard(
            candidate.name, 
            [candidate.profilePicture], 
            undefined, 
            { 
                text: `Current role: ${candidate.currentRole} | ${candidate.location?.locationAddress}`
            }
        );
    }

    public getCandidatesAsListAttachment(candidates: Candidate[], tapCommand: string, title: string): Attachment {
        const items: CardListItem[] = [];

        candidates.forEach(x => {
            items.push({
                icon: x.profilePicture,
                type: "resultItem",
                title: `<strong>${x.name}</strong>`,
                subtitle: `Current role: ${x.currentRole} | Stage: ${x.stage} | ${x.location?.locationAddress}`,
                tap: {
                    type: "imback",
                    value: `${tapCommand} ${x.name}`,
                    title: ""
                }
            })
        });

        return {
            contentType: "application/vnd.microsoft.teams.card.list",
            content: <ListCard>{
                title,
                items
            }
        }
    }

    public getCandidateSummaryAttachment(candidate: Candidate) : Attachment {
        return {
            contentType: "application/vnd.microsoft.teams.card.file.consent",
            content: {
                description: `Here is the summary for ${candidate.name}`,
                sizeInBytes: candidate.summary.length,
                acceptContext: {
                    candidateId: candidate.id
                },
                declineContext: {
                    candidateId: candidate.id
                }
            },
            name: `${candidate.name}.txt`
        }
    }

    public getCandidateSummaryAllowAttachment(candidate: Candidate): Attachment {
        return CardFactory.thumbnailCard(`Download candidate summary for ${candidate.name}`, undefined, undefined, {
            text: `The summary for ${candidate.name} is now available for download`
        });
    }

    public getCandidateSummaryFailedAttachment(candidate: Candidate, text: string): Attachment {
        return CardFactory.thumbnailCard(`Download candidate summary for ${candidate.name}`, undefined, undefined, {
            text
        });
    }

    public getFileInfoCardAttachment(fileInfo: FileUploadInfo) : Attachment {
        return {
            contentType: "application/vnd.microsoft.teams.card.file.info",
            content: {
                fileType: fileInfo.fileType,
                uniqueId: fileInfo.uniqueId
            },
            name: fileInfo.name,
            contentUrl: fileInfo.contentUrl
        }
    }

    public getPositionsAsListAttachment(positions: Position[], tapCommand: string, title: string): Attachment {
        const items: CardListItem[] = [];

        positions.forEach(x => {
            items.push({
                icon: x.hiringManager?.profilePicture || "",
                type: "resultItem",
                title: `<strong>${x.id} - ${x.title}</strong>`,
                subtitle: `Applicants: ${x.candidates.length} | Hiring manager: ${x.hiringManager?.name} | Days open ${x.daysOpen}`,
                tap: {
                    type: "imback",
                    value: `${tapCommand} ${x.externalId}`,
                    title: ""
                }
            })
        });

        return {
            contentType: "application/vnd.microsoft.teams.card.list",
            content: <ListCard>{
                title,
                items
            }
        }
    }

    public getPositionPreviewAttachment(position: Position): Attachment {
        return CardFactory.thumbnailCard(
            `${position.title} / ${position.externalId}`, 
            undefined, 
            undefined, 
            {
            text: `Hiring manager: ${position.hiringManager?.name} | ${position.location?.locationAddress}`
            }
        );
    }

    public getPositionAttachment(position: Position, renderActions: boolean = false): Attachment {
        const template = new act.Template(JSON.parse(this.positionTemplate));
        const payload = template.expand({
            $root: {
                ...position,
                renderActions
            }
        });

        return CardFactory.adaptiveCard(payload);
    }

    public getNewPositionAttachment(recruiters: Recruiter[], locations: Location[], source: string, signedIn: boolean): Attachment {
        const levels = [1,2,3,4,5,6,7];
        const template = new act.Template(JSON.parse(this.newPositionTempalte));
        const payload = template.expand({
            $root: {
                recruiters,
                locations,
                levels,
                source,
                signedIn
            }
        });
        return CardFactory.adaptiveCard(payload);
    }

    public getWelcomeMessageAttachment(): Attachment {
        return CardFactory.heroCard(
            "Hi, I'm Talent bot!",
            undefined,
            [{
                title: "help",
                type: "imback",
                value: "help"
            }],{
                text: "I can assist you with create new job postings, get details about your candidates, open positions and notify about your candidates stage updates. If you are admin, you can install the bot for the hiring managers"
            })
    }
}
