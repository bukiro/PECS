import { Weapon } from 'src/app/classes/items/weapon';
import { Serialized, MaybeSerialized, MessageSerializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recast-fns';
import { ItemTypes } from 'src/libs/shared/definitions/types/item-types';
import { setupSerialization } from 'src/libs/shared/util/serialization';
import { Signal, computed } from '@angular/core';

const { assign, forExport, forMessage, isEqual } = setupSerialization<AlchemicalBomb>({
    primitives: [
        'actions',
        'activationType',
        'hitEffect',
    ],
});

export class AlchemicalBomb extends Weapon implements MessageSerializable<AlchemicalBomb> {
    //Alchemical bombs should be type "alchemicalbombs" to be found in the database
    public readonly type: ItemTypes = 'alchemicalbombs';
    /** What kind of weapon is this based on? Needed for weapon proficiencies for specific magical items. */
    public readonly weaponBase: string = 'Alchemical Bomb';
    public readonly equippable: boolean = false;
    //Alchemical bombs are never moddable.
    public readonly moddable: boolean = false;
    /** Usually "Free", "Reaction", "1", "2" or "3", but can be something special like "1 hour" */
    public actions = '1A';
    /** What needs to be done to activate? Example: "Command", "Manipulate" */
    public activationType = '';
    /** A description of what happens if the bomb hits. */
    public hitEffect = '';

    public static from(values: MaybeSerialized<AlchemicalBomb>, recastFns: RecastFns): AlchemicalBomb {
        return new AlchemicalBomb().with(values, recastFns);
    }

    public with(values: MaybeSerialized<AlchemicalBomb>, recastFns: RecastFns): AlchemicalBomb {
        super.with(values, recastFns);
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<AlchemicalBomb> {
        return {
            ...super.forExport(),
            ...forExport(this),
        };
    }

    public forMessage(): Serialized<AlchemicalBomb> {
        return {
            ...super.forMessage(),
            ...forMessage(this),
        };
    }

    public clone(recastFns: RecastFns): AlchemicalBomb {
        return AlchemicalBomb.from(this, recastFns);
    }

    public isEqual(compared: Partial<AlchemicalBomb>, options?: { withoutId?: boolean }): boolean {
        return super.isEqual(compared, options) && isEqual(this, compared, options);
    }

    public isAlchemicalBomb(): this is AlchemicalBomb { return true; }

    public effectiveName$$(): Signal<string> {
        return computed(() => this.displayName() ?? this.name);
    }

    public canStack(): boolean {
        return true;
    }
}
