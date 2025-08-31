import { Serialized, MaybeSerialized, MessageSerializable } from 'src/libs/shared/serialization/util/models/serializable';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { setupSerialization } from 'src/libs/shared/serialization/util/utils/serialization';
import { computed, signal } from '@angular/core';
import { ItemTypes } from './item-types';
import { Weapon } from './weapon';

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

    public readonly canStack$$ = signal(true).asReadonly();

    // Bombs use the normal effectiveName function of Item, but Weapons do not. So it is reinstated here.
    public readonly effectiveName$$ = computed(() => this.displayName() ?? this.name);

    public static from(values: MaybeSerialized<AlchemicalBomb>, recastFns: RecastFns): AlchemicalBomb {
        return new AlchemicalBomb().with(values, recastFns);
    }

    public with(values: MaybeSerialized<AlchemicalBomb>, recastFns: RecastFns): this {
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

    public clone(recastFns: RecastFns): this {
        return AlchemicalBomb.from(this, recastFns) as this;
    }

    public isEqual(compared: Partial<AlchemicalBomb>, options?: { withoutId?: boolean }): boolean {
        return super.isEqual(compared, options) && isEqual(this, compared, options);
    }

    public isAlchemicalBomb(): this is AlchemicalBomb { return true; }
}
