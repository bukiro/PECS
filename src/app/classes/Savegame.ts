export class Savegame {
    public name = 'Unnamed';
    public id: string;
    public dbId: string;
    public class: string;
    public classChoice: string;
    public heritage: string;
    public ancestry: string;
    public level: number;
    public partyName: string;
    public companionName: string;
    public companionId: string;
    public familiarName: string;
    public familiarId: string;

    public recast(): Savegame {
        return this;
    }
}
