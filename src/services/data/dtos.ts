import { parseBool } from "adaptivecards"
import { CardAction } from "botbuilder"

export type IdentifiableEntity = {
    id: number
}

export type Candidate = IdentifiableEntity & {
    name: string
    stage: InterviewStageType
    previousStage: InterviewStageType
    phone: string
    currentRole: string
    profilePicture: string
    summary: string
    dateApplied: Date
    comments: Comment[]
    locationId: number
    location: Location | undefined
    positionId: number
    position: Position | undefined
    interviews: Interview[]
}

export enum InterviewStageType {
    Applied,
    Screening,
    Interviewing,
    Offered
}

export type Comment = {
    candidateId: number
    text: string
    authorName: string
    authorRole?: string
    authorProfilePicture?: string
}

export const convertInvokeActionDataToComment = (data: any, authorName: string) : Comment => {
    return {
        authorName,
        candidateId: data.candidateId,
        text: data.comment
    }
}

export type Location = IdentifiableEntity & {
    city: string
    state: string
    locationAddress: string
}

export type Recruiter = IdentifiableEntity & {
    name: string
    alias: string
    profilePicture: string
    role: RecruiterRole
    directReportIds: string
    positions: Position[]
}

export type RecruiterRole = "Hiring manager" | "HR staff" | "Interviewer"

export type Position = IdentifiableEntity & {
    title: string
    daysOpen: number
    level: number
    description: string
    hiringManagerId: number
    hiringManager?: Recruiter
    locationId: number
    location?: Location
    candidates: Candidate[],
    externalId?: string
}

export const convertInvokeActionDataToPosition = (data: any) : Position => {
    return {
        title: data.jobTitle,
        daysOpen: 0,
        candidates: [],
        description: data.jobDescription,
        hiringManagerId: parseInt(data.jobHiringManager),
        id: 0,
        level: parseInt(data.jobLevel),
        locationId: parseInt(data.jobLocation)
    }
}

export type Interview = IdentifiableEntity & {
    interviewDate: Date
    feedbackText?: string
    candidateId: number
    recruiterId: number
    recruiter?: Recruiter
    isRemote: boolean
}

export const convertInvokeActionDataToInterview = (data: any) : Interview => {
    return {
        candidateId: data.candidateId,
        id: 0,
        interviewDate: new Date(data.interviewDate),
        recruiterId: parseInt(data.interviewerId),
        isRemote: parseBool(data.isRemote) || false
    }
}

/* Extra adaptive card types! */

export interface ListCard {
    title: string
    items: CardListItem[]
    buttons: CardAction[]
}

export interface CardListItem {
    id?: string
    icon: string
    type: string
    title: string
    subtitle: string
    tap: CardAction
}