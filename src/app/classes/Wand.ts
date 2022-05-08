import { CharacterService } from 'src/app/services/character.service';
import { Equipment } from 'src/app/classes/Equipment';
import { Creature } from 'src/app/classes/Creature';
import { TypeService } from 'src/app/services/type.service';
import { ItemsService } from 'src/app/services/items.service';

export class Wand extends Equipment {
    //Wands should be type "wands" to be found in the database
    readonly type = 'wands';
    readonly equippable = false;
    public actions = '';
    public frequency = 'one per day, plus overcharge';
    public effect = 'You Cast the Spell at the indicated level.';
    public overcharged = false;
    public cooldown = 0;
    readonly inputRequired = 'After the spell is cast from the wand for the day, you can use it one more time, but the wand is immediately broken. Roll a DC 10 flat check. On a failure, drop the wand as it is destroyed. If you overcharge the wand when it\'s already been overcharged that day, the wand is automatically destroyed and dropped (even if it had been repaired) and no spell is cast.';
    recast(typeService: TypeService, itemsService: ItemsService) {
        super.recast(typeService, itemsService);

        return this;
    }
    effectiveName() {
        if (this.displayName) {
            return this.displayName;
        } else if (this.storedSpells.length && this.storedSpells[0].spells.length) {
            if (this.name.includes('Magic Wand (')) {
                return `Wand of ${ this.storedSpells[0].spells[0].name }`;
            } else {
                return `${ this.name.split('(')[0] }(${ this.storedSpells[0].spells[0].name })`;
            }
        } else {
            return this.name;
        }
    }
    //Other implementations require creature.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    effectiveTraits(characterService: CharacterService, creature: Creature) {
        //creature is not needed for wands, but for other types of item.
        let traits: Array<string> = [];

        if (this.storedSpells[0]?.spells.length) {
            const spell = characterService.spellsService.get_Spells(this.storedSpells[0].spells[0].name)[0];

            if (spell) {
                traits = Array.from(new Set(this.traits.concat(spell.traits))).sort();
            }
        }

        this.$traits = traits;

        return traits;
    }
}
