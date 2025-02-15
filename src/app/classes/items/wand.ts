import { RecastFns } from 'src/libs/shared/definitions/interfaces/recast-fns';
import { Serialized, MaybeSerialized, MessageSerializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { ItemTypes } from 'src/libs/shared/definitions/types/item-types';
import { setupSerializationWithHelpers } from 'src/libs/shared/util/serialization';
import { Equipment } from './equipment';
import { computed, Signal } from '@angular/core';
import { stringEqualsCaseInsensitive } from 'src/libs/shared/util/string-utils';

const { assign, forExport, forMessage, isEqual } = setupSerializationWithHelpers<Wand>({
    primitives: [
        'actions',
        'frequency',
        'effect',
        'overcharged',
        'cooldown',
    ],
});

export class Wand extends Equipment implements MessageSerializable<Wand> {
    //Wands should be type "wands" to be found in the database
    public readonly type: ItemTypes = 'wands';
    public readonly equippable: boolean = false;
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

    public static from(values: MaybeSerialized<Wand>, recastFns: RecastFns): Wand {
        return new Wand().with(values, recastFns);
    }

    public with(values: MaybeSerialized<Wand>, recastFns: RecastFns): Wand {
        super.with(values, recastFns);
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): Serialized<Wand> {
        return {
            ...super.forExport(),
            ...forExport(this),
        };
    }

    public forMessage(): Serialized<Wand> {
        return {
            ...super.forMessage(),
            ...forMessage(this),
        };
    }

    public clone(recastFns: RecastFns): Wand {
        return Wand.from(this, recastFns);
    }

    public isEqual(compared: Partial<Wand>, options?: { withoutId?: boolean }): boolean {
        return super.isEqual(compared, options) && isEqual(this, compared, options);
    }

    public isWand(): this is Wand { return true; }

    public effectiveName$$(): Signal<string> {
        return computed(() => {
            if (this.displayName) {
                return this.displayName;
            }

            const storedSpellName = this.storedSpells()[0]?.spells()[0]?.name;

            if (storedSpellName) {
                if (stringEqualsCaseInsensitive(this.name, 'Magic Wand (', { allowPartialString: true })) {
                    return `Wand of ${ storedSpellName }`;
                } else {
                    return `${ this.name.split('(')[0] }(${ storedSpellName })`;
                }
            }

            return this.name;
        });
    }
}
