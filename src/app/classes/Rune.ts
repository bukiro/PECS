import { ItemActivity } from 'src/app/classes/ItemActivity';
import { Item } from 'src/app/classes/Item';
import { LoreChoice } from 'src/app/classes/LoreChoice';
import { Hint } from 'src/app/classes/Hint';
import { EffectGain } from 'src/app/classes/EffectGain';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recastFns';
import { ArmorRune } from './ArmorRune';
import { WeaponRune } from './WeaponRune';

export abstract class Rune extends Item {
    public activities: Array<ItemActivity> = [];
    public desc = '';
    /**
     * For weapon runes, the hints are shown directly on the weapon.
     * They don't have effects and are not taken into account when collecting hints or generating effects.
     * The hints on armor runes can have effects and are taken into account when collecting hints and generating effects.
     */
    public hints: Array<Hint> = [];
    public effects: Array<EffectGain> = [];
    // Certain runes train a lore skill while equipped and require this to be set.
    public loreChoices: Array<LoreChoice> = [];
    public potency = 0;
    public traits: Array<string> = [];
    public usage = '';
    public readonly allowEquippable = false;
    public readonly equippable = false;
    public get secondary(): number {
        return 0;
    }

    public isRune(): this is Rune { return true; }

    public isArmorRune(): this is ArmorRune { return false; }

    public isWeaponRune(): this is WeaponRune { return false; }

    public hasActivities(): this is Rune { return true; }

    public hasHints(): this is Rune { return true; }

    public recast(recastFns: RecastFns): Rune {
        super.recast(recastFns);
        this.activities = this.activities.map(obj => Object.assign(new ItemActivity(), obj).recast(recastFns));
        this.hints = this.hints.map(obj => Object.assign(new Hint(), obj).recast());
        this.loreChoices = this.loreChoices.map(obj => Object.assign(new LoreChoice(), obj).recast());

        return this;
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
