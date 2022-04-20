import { Candidate, Comment } from "./dtos";
import { ServiceContainer } from "./serviceContainer";
import { DataService } from "./dataService";

export class CandidateService extends DataService<Candidate> {

    constructor(services: ServiceContainer) {
        super("candidates", services)
    }

    public async expand(obj: Candidate): Promise<Candidate> {
        obj.location = await this.services.locationService.getById(obj.locationId);
        obj.position = await this.services.positionService.getById(obj.positionId);
        obj.interviews = await this.services.interviewService.getByCandidateId(obj.id);

        return obj;
    }

    protected decorate(obj: Candidate): void {
        obj.comments = [];
    }

    public async searchOne(searchText: string) : Promise<Candidate | undefined> {
        const candidates = await this.search(searchText, 1);
        return candidates.length == 0 ? undefined : candidates[0];
    }

    public async search(searchText: string, maxResults: number) : Promise<Candidate[]> {
        
        if (!searchText) {
            return await this.filter(x => true, maxResults, true);
        }

        searchText = searchText.trim();

        const id = parseInt(searchText);

        if (id) {
            const candidate = await this.getById(id, true);
            return candidate ? [candidate] : [];
        }

        return await this.filter(x => x.name.indexOf(searchText) > -1, maxResults, true);
    }

    public async getByPosition(positionId: number, expand: boolean = false): Promise<Candidate[]> {
        return await this.filter(x => x.positionId == positionId, undefined, expand);
    }

    public async saveComment(comment: Comment) : Promise<void> {
        const candidate = await this.getReference(comment.candidateId);

        if (!candidate) {
            return;
        }

        (candidate.comments || (candidate.comments = [])).push(comment);
    }
}


