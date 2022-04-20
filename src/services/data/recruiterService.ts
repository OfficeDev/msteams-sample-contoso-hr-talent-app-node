import { Recruiter, RecruiterRole } from "./dtos";
import { DataService } from "./dataService";
import { ServiceContainer } from "./serviceContainer";

export class RecruiterService extends DataService<Recruiter> {

    constructor(services: ServiceContainer) {
        super("recruiters", services);
    }

    protected async expand(obj: Recruiter): Promise<Recruiter> {
        obj.positions = await this.services.positionService.getByRecruiterId(obj.id);
        return obj;
    }

    public async getByName(name: string): Promise<Recruiter | undefined> {
        return await this.filterOne(x => x.name == name);
    }

    public async getAllHiringManagers(): Promise<Recruiter[]> {
        return await this.filter(x => x.role == "Hiring manager", undefined, true);
    }

    public async getAllInterviewers(): Promise<Recruiter[]> {
        return await this.filter(x => x.role == "Interviewer", undefined, true);
    }
}