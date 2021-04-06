import { CharacterService } from './character.service';
import { Character } from './Character';
import { AnimalCompanion } from './AnimalCompanion';
import { Familiar } from './Familiar';
import { Equipment } from './Equipment';
import { Creature } from './Creature';

export class Wand extends Equipment {
    public readonly _className: string = this.constructor.name;
    //Wands should be type "wands" to be found in the database
    readonly type = "wands";
    readonly equippable = false;
    public actions: string = "";
    public frequency: string = "one per day, plus overcharge";
    public effect: string = "You Cast the Spell at the indicated level."
    public overcharged: boolean = false;
    public cooldown: number = 0;
    public inputRequired = "After the spell is cast from the wand for the day, you can use it one more time, but the wand is immediately broken. Roll a DC 10 flat check. On a failure, drop the wand as it is destroyed. If you overcharge the wand when it's already been overcharged that day, the wand is automatically destroyed and dropped (even if it had been repaired) and no spell is cast."
    get_Name() {
        if (this.displayName) {
            return this.displayName;
        } else if (this.storedSpells.length && this.storedSpells[0].spells.length) {
            if (this.name.includes("Magic Wand (")) {
                return "Wand of "+this.storedSpells[0].spells[0].name;
            } else {
                return this.name.split("(")[0] + "(" + this.storedSpells[0].spells[0].name + ")";
            }
        } else {
            return this.name;
        }
    }
    get_Traits(characterService: CharacterService, creature: Creature) {
        //creature is not needed for wands, but for other types of item.
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