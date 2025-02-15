import { BasicRuneLevels } from 'src/libs/shared/definitions/basic-rune-levels';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recast-fns';
import { SpellCastingTypes } from 'src/libs/shared/definitions/spell-casting-types';
import { HintEffectsObject } from 'src/libs/shared/effects-generation/definitions/interfaces/hint-effects-object';
import { setupSerializationWithHelpers } from 'src/libs/shared/util/serialization';
import { safeParseInt } from 'src/libs/shared/util/string-utils';
import { ActivityGain } from '../activities/activity-gain';
import { ItemActivity } from '../activities/item-activity';
import { SpellChoice } from '../character-creation/spell-choice';
import { ConditionGain } from '../conditions/condition-gain';
import { EffectGain } from '../effects/effect-gain';
import { Hint } from '../hints/hint';
import { InventoryGain } from './inventory-gain';
import { Item } from './item';
import { Material } from './material';
import { Rune } from './rune';
import { Talisman } from './talisman';
import { WeaponRune } from './weapon-rune';
import { WornItem } from './worn-item';
import { MaybeSerialized, Serialized } from 'src/libs/shared/definitions/interfaces/serializable';
import { computed, Signal, signal } from '@angular/core';
import { isTruthy } from 'src/libs/shared/util/type-guard-utils';

const { assign, forExport, isEqual } = setupSerializationWithHelpers<Equipment>({
    primitives: [
        'allowEquippable',
        'equippable',
        'broken',
        'shoddy',
        'carryingBulk',
        'invested',
        'moddable',
        'showName',
        'showRunes',
        'showStatus',
        'showChoicesInInventory',
        'choice',
        'equipped',
        'potencyRune',
        'resilientRune',
        'strikingRune',
    ],
    primitiveArrays: [
        'gainSenses',
        'choices',
    ],
    serializableArrays: {
        effects:
            () => obj => EffectGain.from(obj),
        gainActivities:
            recastFns => obj => ActivityGain.from({
                ...obj, originalActivity: recastFns.getOriginalActivity(obj),
            }),
        gainInventory:
            () => obj => InventoryGain.from(obj),
        gainConditions:
            recastFns => obj => ConditionGain.from(obj, recastFns),
        gainSpells:
            () => obj => SpellChoice.from(obj),
        hints:
            () => obj => Hint.from(obj),
        activities:
            recastFns => obj => ItemActivity.from(obj, recastFns),
    },
    messageSerializableArrays: {
        talismans:
            recastFns => obj => recastFns.getItemPrototype<Talisman>(obj, { type: 'talismans' }).with(obj, recastFns),
        talismanCords:
            recastFns => obj => recastFns.getItemPrototype<WornItem>(obj, { type: 'wornitems' }).with(obj, recastFns),
        bladeAllyRunes:
            recastFns => obj => recastFns.getItemPrototype<WeaponRune>(obj, { type: 'weaponrunes' }).with(obj, recastFns),
    },
});

export abstract class Equipment extends Item {
    /** Allow changing of "equippable" by custom item creation */
    public allowEquippable = true;
    //Equipment can normally be equipped.
    public equippable = true;
    public shoddy = false;
    /** Some items have a different bulk when you are carrying them instead of wearing them, like backpacks */
    public carryingBulk = '';
    /**
     * Can runes and material be applied to this item? Armor, shields,
     * weapons and handwraps of mighty blows can usually be modded, but other equipment and specific magic versions of them should not.
     */
    public moddable = false;
    public showChoicesInInventory = false;

    /** List any senses you gain when the item is equipped or invested. */
    public gainSenses: Array<string> = [];
    public choices: Array<string> = [];

    /** List EffectGain for every Effect that comes from equipping and investing the item */
    public effects: Array<EffectGain> = [];
    /** Name any common activity that becomes available when you equip and invest this item. */
    public gainActivities: Array<ActivityGain> = [];
    /** If this is a container, list whether it has a limit and a bulk reduction. */
    public gainInventory: Array<InventoryGain> = [];
    /** These conditions are applied whenever the item is equipped or invested respectively. They should be used sparingly. */
    public gainConditions: Array<ConditionGain> = [];
    /**
     * Equipment can allow you to cast a spell as an innate spell.
     * These are listed in gainSpells, and are always innate and always locked, with no choices available.
     */
    public gainSpells: Array<SpellChoice> = [];
    /**
     * What hints should show up for this item? If no hint is set, desc will show instead.
     */
    public hints: Array<Hint> = [];
    /** Describe all activities that you gain from this item. The activity must be a fully described "Activity" type object */
    public activities: Array<ItemActivity> = [];

    /** Is the item currently invested - items without the Invested trait are always invested and don't count against the limit. */
    //TODO: Invested needs to be reactive.
    public readonly invested = signal(false);
    /** Is the name input visible in the inventory. */
    public readonly showName = signal(false);
    /** Is the rune selection visible in the inventory. */
    public readonly showRunes = signal(false);
    /** Is the status selection visible in the inventory. */
    public readonly showStatus = signal(false);
    public readonly choice = signal('');
    public readonly broken = signal(false);
    /** Store any talismans attached to this item. */
    public readonly talismans = signal<Array<Talisman>>([]);
    /** List any Talisman Cords attached to this item. */
    public readonly talismanCords = signal<Array<WornItem>>([]);
    public readonly propertyRunes = signal<Array<Rune>>([]);
    public readonly material = signal<Array<Material>>([]);
    /** Is the item currently equipped - items with equippable==false are always equipped */
    public readonly equipped = signal(false);
    /** Potency Rune level for weapons and armor. */
    public readonly potencyRune = signal(BasicRuneLevels.None);
    /** Striking Rune level for weapons. */
    public readonly strikingRune = signal(BasicRuneLevels.None);
    /** Resilient Rune level for armor. */
    public readonly resilientRune = signal(BasicRuneLevels.None);
    /** Blade Ally Runes can be emulated on weapons and handwraps. */
    public readonly bladeAllyRunes = signal<Array<WeaponRune>>([]);

    public readonly investedOrEquipped$$ = computed(() => this.canInvest ? this.invested() : (this.equipped() === this.equippable));

    /** Amount of propertyRunes you can still apply */
    public readonly freePropertyRunesOfItem$$ = computed(() => {
        //You can apply as many property runes as the level of your potency rune. Each rune with the Saggorak trait counts double.
        const saggorakRuneWorth = 2;
        const otherRuneWorth = 1;

        const potencyRune = this.potencyRune();

        const runeSlotsUsed = this.propertyRunes().reduce(
            (amount, rune) =>
                amount + (rune.traits.includes('Saggorak')
                    ? saggorakRuneWorth
                    : otherRuneWorth
                ),
            0,
        );

        let runes = potencyRune - runeSlotsUsed;

        //Material can allow you to have four runes if you would have three.
        const extraRuneAmount = Math.max(...this.material().map(({ extraRune }) => extraRune), 0);

        if (potencyRune === BasicRuneLevels.Third) {
            runes += extraRuneAmount;
        }

        return runes;
    });

    public readonly effectiveBulk$$ = computed(() => {
        //Return either the bulk set by an oil, or the bulk of the item, possibly reduced by the material.
        const oilBulk = this.oilsApplied()
            .map(({ bulkEffect }) => bulkEffect)
            .find(isTruthy);

        if (oilBulk) {
            return oilBulk;
        }

        if (this.carryingBulk && !this.equipped) {
            return this.carryingBulk;
        }

        // This parses numeral bulk to numbers so modifiers can be replaced.
        // Bulk of 0 or L are parsed to 0.
        const ownBulk = safeParseInt(this.bulk, 0);

        return this.material()
            .filter(({ bulkModifier }) => !!bulkModifier)
            .map(material => {
                const modifiedBulk = ownBulk + material.bulkModifier;

                if (modifiedBulk <= 0 && ownBulk !== 0) {
                    // Material can't reduce the bulk to 0. If the bulk is reduced from above 0 to 0, it is 'L' instead.
                    // This also saves bulks of L from being parsed to 0.
                    return 'L';
                } else {
                    return String(modifiedBulk);
                }
            })
            .pop()
            // If there are no modifiers, return the original bulk (preserving '', '0' and 'L')
            ?? this.bulk;
    });

    /** Return the highest value of your potency rune or any oils that emulate one. */
    public readonly effectivePotency$$ = computed(() =>
        Math.max(...this.oilsApplied().map(oil => oil.potencyEffect), this.potencyRune()),
    );

    /** Return the highest value of your striking rune or any oils that emulate one. */
    public readonly effectiveStriking$$ = computed(() =>
        Math.max(...this.oilsApplied().map(oil => oil.strikingEffect), this.strikingRune()),
    );

    /** Return the highest value of your resilient rune or any oils that emulate one. */
    public readonly effectiveResilient$$ = computed(() =>
        Math.max(...this.oilsApplied().map(oil => oil.resilientEffect), this.resilientRune()),
    );

    public readonly effectsGenerationHints$$: Signal<Array<HintEffectsObject>>;

    public readonly gridIconValue$$: Signal<string> = computed(() => {
        const parts: Array<string> = [];

        if (this.subType.length) {
            parts.push(this.subType.substring(0, 1));
        }

        if (this.choice()) {
            parts.push(this.choice().substring(0, 1));
        }

        return parts.join(',');
    });

    //Weapons, Armors and Worn Items that can bear runes have their own version of this property.
    protected readonly _secondaryRuneName$$: Signal<string> = signal('').asReadonly();

    //Weapons have their own version of this property.
    protected readonly _bladeAllyName$$: Signal<Array<string>> = signal<Array<string>>([]).asReadonly();

    protected readonly _equipmentEffectsGenerationHints$$ = computed(() => {
        const extractHintEffectsObject = (hintItem: Item | Material): Array<HintEffectsObject> => {
            if (hintItem.hasHints()) {
                const objectName = hintItem.effectiveName$$()();

                return hintItem.hints.map(hint => ({
                    hint,
                    parentItem: hintItem,
                    objectName,
                }));
            }

            return [];
        };

        return new Array<HintEffectsObject>(
            ...extractHintEffectsObject(this),
            ...this.oilsApplied()
                .map(oil => extractHintEffectsObject(oil))
                .flat(),
            ...this.material()
                .map(material => extractHintEffectsObject(material))
                .flat(),
            ...this.propertyRunes()
                .map(rune => extractHintEffectsObject(rune))
                .flat(),
        );
    });

    constructor() {
        super();

        this.effectsGenerationHints$$ = this._equipmentEffectsGenerationHints$$;
    }

    public get canInvest(): boolean {
        return (this.traits.includes('Invested'));
    }

    public readonly secondaryRuneTitleFunction: ((secondary: number) => string) = secondary => secondary.toString();

    public with(values: MaybeSerialized<Equipment>, recastFns: RecastFns): Equipment {
        super.with(values, recastFns);
        assign(this, values, recastFns);

        this.activities.forEach(activity => { activity.source = this.id; });

        this.gainActivities.forEach(gain => { gain.source = this.id; });

        this.gainConditions.forEach(conditionGain => {
            if (!conditionGain.source) {
                conditionGain.source = this.name;
            }

            conditionGain.fromItem = true;
        });

        this.gainSpells.forEach(choice => {
            if (!choice.castingType) {
                choice.castingType = SpellCastingTypes.Innate;
            }

            choice.source = this.name;
            choice.spells().forEach(gain => {
                gain.source = choice.source;
            });
        });

        if (!this.choices.includes(this.choice())) {
            this.choice.update(value => this.choices[0] ?? value);
        }

        return this;
    }

    public forExport(): Serialized<Equipment> {
        return {
            ...super.forExport(),
            ...forExport(this),
        };
    }

    public isEqual(compared: Partial<Equipment>, options?: { withoutId?: boolean }): boolean {
        return super.isEqual(compared, options) && isEqual(this, compared, options);
    }

    public isEquipment(): this is Equipment { return true; }

    public hasActivities(): this is Equipment { return true; }

    public hasHints(): this is Equipment { return true; }

    public canStack(): boolean {
        //Equipment cannot stack.
        return false;
    }

    public potencyTitle(potency: number): string {
        if (potency > 0) {
            return `+${ potency }`;
        } else {
            return '';
        }
    }

    public effectiveName$$(options: { itemStore?: boolean } = {}): Signal<string> {
        if (this.displayName) {
            return computed(() => {
                const choice = this.choice();

                return (this.displayName() + ((!options.itemStore && choice) ? `: ${ choice }` : ''));
            });
        }

        return computed(() => {
            const potencyValue = this.effectivePotency$$();
            const secondaryRuneName = this._secondaryRuneName$$();
            const propertyRunes = this.propertyRunes();
            const materialNames = this.material().map(mat => mat.effectiveName$$()());
            const bladeAllyName = this._bladeAllyName$$();
            const choice = this.choice();

            return this._effectiveName(
                { potencyValue, secondaryRuneName, choice, propertyRunes, materialNames, bladeAllyName },
                options,
            );
        });
    }

    private _effectiveName(
        {
            potencyValue,
            secondaryRuneName,
            choice,
            propertyRunes,
            materialNames,
            bladeAllyName,
        }: {
            potencyValue: number;
            secondaryRuneName: string;
            choice: string;
            propertyRunes: Array<Rune>;
            materialNames: Array<string>;
            bladeAllyName: Array<string>;
        },
        options?: { itemStore?: boolean },
    ): string {
        const words: Array<string> = [];
        const potency = this.potencyTitle(potencyValue);

        if (potency) {
            words.push(potency);
        }

        if (secondaryRuneName) {
            words.push(secondaryRuneName);
        }

        propertyRunes.forEach(rune => {
            let runeName: string = rune.name;

            if (rune.name.includes('(Greater)')) {
                runeName = `Greater ${ rune.name.substring(0, rune.name.indexOf('(Greater)')) }`;
            } else if (rune.name.includes(', Greater)')) {
                runeName = `Greater ${ rune.name.substring(0, rune.name.indexOf(', Greater)')) })`;
            }

            words.push(runeName);
        });

        words.push(...bladeAllyName);

        words.push(...materialNames);

        // If you have any material in the name of the item, and it has a material applied, remove the original material.
        // E.g. if this Steel Shield is has Silver as its material name, it will be a Silver Shield instead of a Silver Steel Shield.
        // This list may grow.
        const inherentMaterialNames = [
            'Wooden ',
            'Steel ',
        ];

        if (
            materialNames.length
        ) {
            let itemName = this.name;

            inherentMaterialNames
                .forEach(mat => {
                    itemName = itemName.replace(mat, '');
                });
            words.push(itemName);
        } else {
            words.push(this.name);
        }

        let name = words.join(' ');

        const hasChoice = !options?.itemStore && !!choice;

        if (hasChoice) {
            name += `: ${ choice }`;
        }

        return name;
    }

    public abstract clone(recastFns: RecastFns): Equipment;
}
