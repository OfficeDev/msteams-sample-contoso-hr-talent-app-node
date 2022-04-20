import { Location } from "./dtos";
import { DataService } from "./dataService";
import { ServiceContainer } from "./serviceContainer";


export class LocationService extends DataService<Location> {

    constructor(services: ServiceContainer) {
        super("locations", services);
    }

    protected decorate(obj: Location): void {
        obj.locationAddress = `${obj.city}${!obj.state ? "" : `, ${obj.state}`}`;
    }
}
