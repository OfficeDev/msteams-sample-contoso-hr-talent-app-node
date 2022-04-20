import { IdentifiableEntity } from "./dtos";
import * as fs from 'fs';
import * as path from 'path';
import { ServiceContainer } from "./serviceContainer";


export class DataService<T extends IdentifiableEntity> {
    private data: T[] = [];
    private sampleDataFile: string;
    protected services: ServiceContainer;

    constructor(sampleDataFile: string, services: ServiceContainer) {
        this.sampleDataFile = sampleDataFile;
        this.services = services;
    }

    protected promisify<T>(obj: T) : Promise<T> {
        return Promise.resolve(obj);
    }

    public load(sampleDataPath: string) {
        const data = fs.readFileSync(path.join(sampleDataPath, this.sampleDataFile + ".json"));
        this.data = <T[]>JSON.parse(data.toString());
        const _this = this;
        this.data.forEach(x => {
            if (!x.id) {
                x.id = _this.getNextId();
            }
            _this.decorate(x);
        });
    }

    private cloneOne(obj: T | undefined) : T | undefined {
        if (!obj) {
            return obj;
        }
        return Object.assign({}, obj);
    }

    private cloneAll(objs: T[]): T[] {
        const clones: T[] = [];
        objs.forEach(x => {if (x) clones.push(<T>this.cloneOne(x)); });
        return clones;
    }

    public async getById(id: number, expand: boolean = false): Promise<T | undefined> {
        const obj = this.cloneOne(await this.getReference(id));
        const result = obj && expand ? (await this.expand(obj)) : obj;
        return result;
    }

    protected getReference(id: number): Promise<T | undefined> {
        const result = this.data.find(x => x.id == id);
        return this.promisify(result);
    }

    protected getNextId(): number {
        let maxId = 0;
        this.data.forEach(x => maxId = Math.max(maxId, x.id || 0));
        return maxId + 1;
    }

    public async getAll(expand: boolean = false): Promise<T[]> {
        const data = this.cloneAll(this.data);
        const result = expand ? (await this.expandAll(data)) : data;
        return result;
    }

    protected decorate(obj: T) { }
    protected expand(obj: T): Promise<T> { return this.promisify(obj); }

    private async expandAll(objs: T[]): Promise<T[]> {
        for (let i = 0; i < objs.length; i++) {
            await this.expand(objs[i]);
        }
        return objs;
    }

    protected async filter(predicate: (obj: T) => boolean, take?: number, expand: boolean = false): Promise<T[]> {
        let results = this.cloneAll(this.data.filter(predicate));
        if (expand) {
            results = await this.expandAll(results);
        }
        if (take) {
            results = results.slice(0, take);
        }
        return results;
    }

    protected async filterOne(predicate: (obj: T) => boolean, take?: number, expand: boolean = false): Promise<T | undefined> {
        const result = this.cloneOne(this.data.find(predicate));
        if (result && expand) {
            await this.expand(result);
        }
        return result;
    }

    protected add(obj: T) : Promise<undefined> {
        this.data.push(obj);
        return this.promisify(undefined);
    }
}
