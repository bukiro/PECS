export class Savegame {
    public name = 'Unnamed';
    public dbId?: string;
    public class?: string;
    public classChoice?: string;
    public heritage?: string;
    public ancestry?: string;
    public level?: number;
    public partyName = 'No Party';
    public companionName?: string;
    public companionId?: string;
    public familiarName?: string;
    public familiarId?: string;

    constructor(public id: string) { }

    public recast(): Savegame {
        return this;
    }

    public clone(): Savegame {
        return Object.assign<Savegame, Savegame>(new Savegame(this.id), JSON.parse(JSON.stringify(this))).recast();
    }
}
