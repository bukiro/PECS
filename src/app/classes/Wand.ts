import { Equipment } from 'src/app/classes/Equipment';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recastFns';

export class Wand extends Equipment {
    //Wands should be type "wands" to be found in the database
    public readonly type = 'wands';
    public readonly equippable = false;
    public actions = '';
    public frequency = 'one per day, plus overcharge';
    public effect = 'You Cast the Spell at the indicated level.';
    public overcharged = false;
    public cooldown = 0;
    public readonly inputRequired =
        'After the spell is cast from the wand for the day, you can use it one more time, but the wand is immediately broken. '
        + 'Roll a DC 10 flat check. On a failure, drop the wand as it is destroyed. '
        + 'If you overcharge the wand when it\'s already been overcharged that day, '
        + 'the wand is automatically destroyed and dropped (even if it had been repaired) and no spell is cast.';

    public recast(recastFns: RecastFns): Wand {
        super.recast(recastFns);

        return this;
    }

    public clone(recastFns: RecastFns): Wand {
        return Object.assign<Wand, Wand>(new Wand(), JSON.parse(JSON.stringify(this))).recast(recastFns);
    }

    public isWand(): this is Wand { return true; }

    public effectiveName(): string {
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
}
