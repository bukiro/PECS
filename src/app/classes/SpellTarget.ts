export class SpellTarget {
    name: string = "";
    id: string = "";
    playerId: string = "";
    type: "Character" | "Companion" | "Familiar" = "Character";
    selected: boolean = false;
    isPlayer: boolean = false;
    recast() {
        return this;
    }
}
