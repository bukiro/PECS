import { ItemActivity } from 'src/app/classes/ItemActivity';
import { Item } from 'src/app/classes/Item';
import { LoreChoice } from 'src/app/classes/LoreChoice';
import { Hint } from 'src/app/classes/Hint';
import { EffectGain } from 'src/app/classes/EffectGain';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recastFns';
import { ArmorRune } from './ArmorRune';
import { WeaponRune } from './WeaponRune';
import { setupSerializationWithHelpers } from 'src/libs/shared/util/serialization';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';

const { assign, forExport, forMessage } = setupSerializationWithHelpers<Rune>({
    primitives: [
        'desc',
        'potency',
        'usage',
    ],
    primitiveArrays: [
        'traits',
    ],
    serializableArrays: {
        activities:
            recastFns => obj => ItemActivity.from(obj, recastFns),
        hints:
            () => obj => Hint.from(obj),
        effects:
            () => obj => EffectGain.from(obj),
        loreChoices:
            () => obj => LoreChoice.from(obj),
    },
});

export abstract class Rune extends Item implements Serializable<Rune> {
    public readonly allowEquippable: boolean = false;
    public readonly equippable: boolean = false;
    public desc = '';
    public potency = 0;
    public usage = '';

    public traits: Array<string> = [];

    public activities: Array<ItemActivity> = [];
    /**
     * For weapon runes, the hints are shown directly on the weapon.
     * They don't have effects and are not taken into account when collecting hints or generating effects.
     * The hints on armor runes can have effects and are taken into account when collecting hints and generating effects.
     */
    public hints: Array<Hint> = [];
    public effects: Array<EffectGain> = [];
    // Certain runes train a lore skill while equipped and require this to be set.
    public loreChoices: Array<LoreChoice> = [];

    public get secondary(): number {
        return 0;
    }

    public isRune(): this is Rune { return true; }

    public isArmorRune(): this is ArmorRune { return false; }

    public isWeaponRune(): this is WeaponRune { return false; }

    public hasActivities(): this is Rune { return true; }

    public hasHints(): this is Rune { return true; }

    public with(values: DeepPartial<Rune>, recastFns: RecastFns): Rune {
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): DeepPartial<Rune> {
        return {
            ...super.forExport(),
            ...forExport(this),
        };
    }

    public forMessage(): DeepPartial<Rune> {
        return {
            ...super.forMessage(),
            ...forMessage(this),
        };
    }

    public canStack(): boolean {
        //Additionally to the usual considerations, runes can't stack if they add any activities.
        return (
            super.canStack() &&
            !this.activities.filter((activity: ItemActivity) => !activity.displayOnly).length
        );
    }

    public abstract clone(recastFns: RecastFns): Rune;
}
