export class ChangeTracker {
    public feats: Map<string, number> = new Map<string, number>();
    public abilities: Map<string, number> = new Map<string, number>();
    public skills: Map<string, number> = new Map<string, number>();
    public effects: Map<string, number> = new Map<string, number>();
    public level: Map<string, number> = new Map<string, number>();
    public languages: Map<string, number> = new Map<string, number>();
    public proficiencyCopies: Map<string, number> = new Map<string, number>();
    public proficiencyChanges: Map<string, number> = new Map<string, number>();
}
