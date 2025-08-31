import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/serialization/util/models/serializable';
import { setupSerializationWithHelpers } from 'src/libs/shared/serialization/util/utils/serialization';
import { ArmorRune } from './armor-rune';
import { Item } from './item';
import { computed } from '@angular/core';
import { ItemActivity } from 'src/libs/shared/activities/util/models/item-activity';
import { EffectGain } from 'src/libs/shared/effects/util/models/effect-gain';
import { Hint } from 'src/libs/shared/hints/util/models/hint';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { ItemGainOnOptions } from './item-gain-options';
import { WeaponRune } from './weapon-rune';
import { LoreChoice } from 'src/libs/shared/lores/util/models/lore-choice';
import { HintEffectsObject } from 'src/libs/shared/effects/util/models/hint-effects-object';

const { assign, forExport, forMessage, isEqual } = setupSerializationWithHelpers<Rune>({
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

    public readonly canStack$$ = computed(() =>
        //Additionally to the usual considerations, runes can't stack if they add any activities.
        !this.equippable
        && !this.canInvest
        && !this.gainItems().some(gain => gain.on !== ItemGainOnOptions.Use)
        && !this.storedSpells().length
        && !this.activities.some((activity: ItemActivity) => !activity.displayOnly),
    );

    public readonly effectsGenerationHints$$ = computed(() => {
        const objectName = this.effectiveName$$();

        return this.hints.map<HintEffectsObject>(hint => ({
            hint,
            parentItem: this,
            objectName,
        }));
    });

    public get secondary(): number {
        return 0;
    }

    public isRune(): this is Rune { return true; }

    public isArmorRune(): this is ArmorRune { return false; }

    public isWeaponRune(): this is WeaponRune { return false; }

    public hasActivities(): this is Rune { return true; }

    public hasHints(): this is Rune { return true; }

    public with(values: MaybeSerialized<Rune>, recastFns: RecastFns): this {
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): Serialized<Rune> {
        return {
            ...super.forExport(),
            ...forExport(this),
        };
    }

    public forMessage(): Serialized<Rune> {
        return {
            ...super.forMessage(),
            ...forMessage(this),
        };
    }

    public isEqual(compared: Partial<Rune>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }

    public abstract clone(recastFns: RecastFns): this;
}
