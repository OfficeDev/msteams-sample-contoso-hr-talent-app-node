import { Interview } from "./dtos";
import { DataService } from "./dataService";
import { ServiceContainer } from "./serviceContainer";


export class InterviewService extends DataService<Interview> {

    constructor(services: ServiceContainer) {
        super("interviews", services);
    }

    protected async expand(obj: Interview): Promise<Interview> {
        obj.recruiter = await this.services.recruiterService.getById(obj.recruiterId);
        return obj;
    }

    public async scheduleInterview(interview: Interview) : Promise<void> {
        interview.id = this.getNextId();
        await this.add(interview);
    }

    public async getByCandidateId(id: number, expand: boolean = false): Promise<Interview[]> {
        return await this.filter(x => x.candidateId == id, undefined, expand);
    }
}
