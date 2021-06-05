import { Consumable } from './Consumable';
import { CharacterService } from './character.service';
import { Creature } from './Creature';

export class Scroll extends Consumable {
    public readonly _className: string = this.constructor.name;
    //Scrolls should be type "scrolls" to be found in the database
    readonly type = "scrolls";
    get_Name() {
        if (this.displayName) {
            return this.displayName;
        } else if (this.storedSpells.length && this.storedSpells[0].spells.length) {
            return this.name+" of "+this.storedSpells[0].spells[0].name;
        } else {
            return this.name;
        }
    }
    get_Traits(characterService: CharacterService, creature: Creature) {
        //creature is not needed for scrolls, but for other types of item.
        if (this.storedSpells[0]?.spells.length) {
            let spell = characterService.spellsService.get_Spells(this.storedSpells[0].spells[0].name)[0];
            if (spell) {
                return Array.from(new Set(this.traits.concat(spell.traits))).sort(function(a,b) {
                    if (a > b) {
                        return 1;
                    }
                    if (a < b) {
                        return -1;
                    }
                    return 0;
                });
            } else {
                return this.traits;
            }
        } else {
            return this.traits;
        }
    }
}