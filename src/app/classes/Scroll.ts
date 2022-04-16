import { Consumable } from 'src/app/classes/Consumable';
import { CharacterService } from 'src/app/services/character.service';
import { Creature } from 'src/app/classes/Creature';
import { TypeService } from 'src/app/services/type.service';
import { ItemsService } from 'src/app/services/items.service';

export class Scroll extends Consumable {
    //Scrolls should be type "scrolls" to be found in the database
    readonly type = 'scrolls';
    recast(typeService: TypeService, itemsService: ItemsService) {
        super.recast(typeService, itemsService);
        return this;
    }
    get_Name() {
        if (this.displayName) {
            return this.displayName;
        } else if (this.storedSpells.length && this.storedSpells[0].spells.length) {
            return `${ this.name } of ${ this.storedSpells[0].spells[0].name }`;
        } else {
            return this.name;
        }
    }
    //Other implementations require creature.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    get_Traits(characterService: CharacterService, creature: Creature) {
        //creature is not needed for scrolls, but for other types of item.
        let traits: string[] = [];
        if (this.storedSpells[0]?.spells.length) {
            const spell = characterService.spellsService.get_Spells(this.storedSpells[0].spells[0].name)[0];
            if (spell) {

                traits = Array.from(new Set(this.traits.concat(spell.traits))).sort();
            }
        }
        this._traits = traits;
        return traits;
    }
}
