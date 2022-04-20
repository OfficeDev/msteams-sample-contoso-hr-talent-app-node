import { PositionService } from "./positionService";
import { RecruiterService } from "./recruiterService";
import { TemplatingService } from "./templatingService";
import { LocationService } from "./locationService";
import { InterviewService } from "./interviewService";
import { CandidateService } from "./candidateService";
import { CloudAdapter } from "botbuilder";
import { NotificationService } from "./notificationService";
import { GraphApiService } from "./graphApiService";


export class ServiceContainer {
    public candidateService: CandidateService;
    public interviewService: InterviewService;
    public locationService: LocationService;
    public positionService: PositionService;
    public recruiterService: RecruiterService;
    public templatingService: TemplatingService;
    public notificationService: NotificationService;
    public graphApiService: GraphApiService;

    constructor(adapter: CloudAdapter) {
        this.candidateService = new CandidateService(this);
        this.interviewService = new InterviewService(this);
        this.locationService = new LocationService(this);
        this.positionService = new PositionService(this);
        this.recruiterService = new RecruiterService(this);
        this.templatingService = new TemplatingService();
        this.notificationService = new NotificationService(this, adapter);
        this.graphApiService = new GraphApiService();
    }

    public loadData(sampleDataPath: string) {
        this.candidateService.load(sampleDataPath);
        this.interviewService.load(sampleDataPath);
        this.locationService.load(sampleDataPath);
        this.positionService.load(sampleDataPath);
        this.recruiterService.load(sampleDataPath);
    }

    public loadTemplates(templatesPath: string) {
        this.templatingService.load(templatesPath);
    }
}
