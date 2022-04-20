import { Position } from "./dtos";
import { DataService } from "./dataService";
import { ServiceContainer } from "./serviceContainer";
import { randomUUID } from "crypto";


export class PositionService extends DataService<Position> {

    constructor(services: ServiceContainer) {
        super("positions", services);
    }

    protected async expand(obj: Position): Promise<Position> {
        obj.hiringManager = await this.services.recruiterService.getById(obj.hiringManagerId);
        obj.candidates = await this.services.candidateService.getByPosition(obj.id);
        obj.location = await this.services.locationService.getById(obj.locationId);
        return obj;
    }

    protected decorate(obj: Position): void {
        obj.externalId = randomUUID().substring(0, 8).toUpperCase();
    }

    public async getOpenPositions(): Promise<Position[]> {
        return await this.getAll(true);
    }

    public async getByRecruiterId(id: number): Promise<Position[]> {
        return await this.filter(x => x.hiringManagerId == id, undefined, true);
    }

    public async searchOne(searchText: string) : Promise<Position | undefined> {
        const positions = await this.search(searchText, 1);
        return positions.length == 0 ? undefined : positions[0];
    }

    public async search(searchText: string | undefined, maxResults: number) : Promise<Position[]> {

        if (!searchText) {
            const results = await this.filter(x => true, maxResults, true);
            return results;
        }
        
        searchText = searchText.trim();

        return await this.filter(x => x.externalId == searchText || x.id == parseInt(<string>searchText), maxResults, true);
    }

    public async createPosition(position: Position) : Promise<Position> {
        position.id = this.getNextId();
        this.decorate(position);
        await this.add(position);
        return <Position>(await this.getById(position.id, true));
    }
}
