import { Consumable } from 'src/app/classes/Consumable';
import { CharacterService } from 'src/app/services/character.service';
import { Creature } from 'src/app/classes/Creature';
import { TypeService } from 'src/app/services/type.service';
import { ItemsService } from 'src/app/services/items.service';

export class Scroll extends Consumable {
    //Scrolls should be type "scrolls" to be found in the database
    public readonly type = 'scrolls';
    public recast(typeService: TypeService, itemsService: ItemsService): Scroll {
        super.recast(typeService, itemsService);

        return this;
    }
    public effectiveName(): string {
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
    public effectiveTraits(characterService: CharacterService, creature: Creature): Array<string> {
        let traits: Array<string> = [];

        if (this.storedSpells[0]?.spells.length) {
            const spell = characterService.spellsService.get_Spells(this.storedSpells[0].spells[0].name)[0];

            if (spell) {

                traits = Array.from(new Set(this.traits.concat(spell.traits))).sort();
            }
        }

        this.$traits = traits;

        return this.$traits;
    }
}
