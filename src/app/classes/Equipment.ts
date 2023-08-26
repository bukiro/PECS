import { EffectGain } from 'src/app/classes/EffectGain';
import { Item } from 'src/app/classes/Item';
import { ItemActivity } from 'src/app/classes/ItemActivity';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { InventoryGain } from 'src/app/classes/InventoryGain';
import { Talisman } from 'src/app/classes/Talisman';
import { Material } from 'src/app/classes/Material';
import { Hint } from 'src/app/classes/Hint';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { SpellChoice } from 'src/app/classes/SpellChoice';
import { WornItem } from 'src/app/classes/WornItem';
import { BasicRuneLevels } from 'src/libs/shared/definitions/basicRuneLevels';
import { WeaponRune } from './WeaponRune';
import { SpellCastingTypes } from 'src/libs/shared/definitions/spellCastingTypes';
import { HintEffectsObject } from 'src/libs/shared/effects-generation/definitions/interfaces/HintEffectsObject';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recastFns';
import { BehaviorSubject, Observable, combineLatest, map, of } from 'rxjs';
import { OnChangeArray } from 'src/libs/shared/util/classes/on-change-array';
import { Rune } from './Rune';
import { stringEqualsCaseInsensitive } from 'src/libs/shared/util/stringUtils';

export abstract class Equipment extends Item {
    /** Allow changing of "equippable" by custom item creation */
    public allowEquippable = true;
    //Equipment can normally be equipped.
    public equippable = true;
    /** Describe all activities that you gain from this item. The activity must be a fully described "Activity" type object */
    public activities: Array<ItemActivity> = [];
    public broken = false;
    public shoddy = false;
    /** Some items have a different bulk when you are carrying them instead of wearing them, like backpacks */
    public carryingBulk = '';
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
    /** Is the item currently invested - items without the Invested trait are always invested and don't count against the limit. */
    //TODO: Invested needs to be reactive.
    public invested = false;
    /**
     * Can runes and material be applied to this item? Armor, shields,
     * weapons and handwraps of mighty blows can usually be modded, but other equipment and specific magic versions of them should not.
     */
    public moddable = false;
    /** Is the name input visible in the inventory. */
    public showName = false;
    /** Is the rune selection visible in the inventory. */
    public showRunes = false;
    /** Is the status selection visible in the inventory. */
    public showStatus = false;
    /** Store any talismans attached to this item. */
    public talismans: Array<Talisman> = [];
    /** List any Talisman Cords attached to this item. */
    public talismanCords: Array<WornItem> = [];
    /** List any senses you gain when the item is equipped or invested. */
    public gainSenses: Array<string> = [];
    public showChoicesInInventory = false;
    public choices: Array<string> = [];
    public choice = '';

    public equipped$: BehaviorSubject<boolean>;
    public potencyRune$: BehaviorSubject<BasicRuneLevels>;
    public resilientRune$: BehaviorSubject<BasicRuneLevels>;
    public strikingRune$: BehaviorSubject<BasicRuneLevels>;

    private _equipped = false;
    private readonly _material = new OnChangeArray<Material>();
    private _potencyRune = BasicRuneLevels.None;
    private _strikingRune = BasicRuneLevels.None;
    private _resilientRune = BasicRuneLevels.None;
    private readonly _propertyRunes = new OnChangeArray<Rune>();
    private readonly _bladeAllyRunes = new OnChangeArray<WeaponRune>();

    constructor() {
        super();

        this.equipped$ = new BehaviorSubject(this._equipped);
        this.potencyRune$ = new BehaviorSubject(this._potencyRune);
        this.resilientRune$ = new BehaviorSubject(this._resilientRune);
        this.strikingRune$ = new BehaviorSubject(this._resilientRune);
    }

    public get equipped(): boolean {
        return this._equipped;
    }

    /** Is the item currently equipped - items with equippable==false are always equipped */
    public set equipped(value: boolean) {
        this._equipped = value;
        this.equipped$.next(this._equipped);
    }

    public get material(): OnChangeArray<Material> {
        return this._material;
    }

    public set material(value: Array<Material>) {
        this._material.setValues(...value);
    }

    public get potencyRune(): BasicRuneLevels {
        return this._potencyRune;
    }

    /** Potency Rune level for weapons and armor. */
    public set potencyRune(value: BasicRuneLevels) {
        this._potencyRune = value;
        this.potencyRune$.next(this._potencyRune);
    }

    public get resilientRune(): BasicRuneLevels {
        return this._resilientRune;
    }

    /** Resilient Rune level for armor. */
    public set resilientRune(value: BasicRuneLevels) {
        this._resilientRune = value;
        this.resilientRune$.next(this._resilientRune);
    }

    public get strikingRune(): BasicRuneLevels {
        return this._strikingRune;
    }

    /** Striking Rune level for weapons. */
    public set strikingRune(value: BasicRuneLevels) {
        this._strikingRune = value;
        this.strikingRune$.next(this._strikingRune);
    }

    public get secondaryRune(): BasicRuneLevels {
        return BasicRuneLevels.None;
    }

    public set secondaryRune(value: BasicRuneLevels) {
        return;
    }

    public get propertyRunes(): OnChangeArray<Rune> {
        return this._propertyRunes;
    }

    public set propertyRunes(value: Array<Rune>) {
        this._propertyRunes.setValues(...value);
    }

    public get bladeAllyRunes(): OnChangeArray<WeaponRune> {
        return this._bladeAllyRunes;
    }

    /** Blade Ally Runes can be emulated on weapons and handwraps. */
    public set bladeAllyRunes(value: Array<WeaponRune>) {
        this._bladeAllyRunes.setValues(...value);
    }

    public readonly secondaryRuneTitleFunction: ((secondary: number) => string) = secondary => secondary.toString();

    public recast(recastFns: RecastFns): Equipment {
        super.recast(recastFns);
        this.activities = this.activities.map(obj => Object.assign(new ItemActivity(), obj).recast(recastFns));
        this.activities.forEach(activity => { activity.source = this.id; });
        this.effects = this.effects.map(obj => Object.assign(new EffectGain(), obj).recast());
        this.gainActivities = this.gainActivities.map(obj => recastFns.activityGain(obj).recast(recastFns));
        this.gainActivities.forEach(gain => { gain.source = this.id; });
        this.gainInventory = this.gainInventory.map(obj => Object.assign(new InventoryGain(), obj).recast());
        this.gainConditions = this.gainConditions.map(obj => Object.assign(new ConditionGain(), obj).recast(recastFns));
        this.gainConditions.forEach(conditionGain => {
            if (!conditionGain.source) {
                conditionGain.source = this.name;
            }

            conditionGain.fromItem = true;
        });
        this.gainSpells = this.gainSpells.map(obj => Object.assign(new SpellChoice(), obj).recast());
        this.gainSpells.forEach(choice => {
            if (!choice.castingType) {
                choice.castingType = SpellCastingTypes.Innate;
            }

            choice.source = this.name;
            choice.spells.forEach(gain => {
                gain.source = choice.source;
            });
        });
        this.hints = this.hints.map(obj => Object.assign(new Hint(), obj).recast());
        this.material = this.material.map(obj => Object.assign(new Material(), obj).recast());
        this.bladeAllyRunes =
            this.bladeAllyRunes.map(obj =>
                Object.assign(new WeaponRune(), recastFns.item(obj)).recast(recastFns));
        this.talismans =
            this.talismans.map(obj =>
                Object.assign(
                    new Talisman(),
                    recastFns.item(obj),
                ).recast(recastFns),
            );
        //Talisman Cords need to be cast blindly to avoid circular dependency warnings.
        this.talismanCords =
            this.talismanCords.map(obj => recastFns.item(obj, { type: 'wornitems' }).recast(recastFns));

        if (this.choices.length && !this.choices.includes(this.choice)) {
            this.choice = this.choices[0];
        }

        return this;
    }

    public isEquipment(): this is Equipment { return true; }

    public hasActivities(): this is Equipment { return true; }

    public hasHints(): this is Equipment { return true; }

    public gridIconValue(): string {
        const parts: Array<string> = [];

        if (this.subType) {
            parts.push(this.subType[0]);
        }

        if (this.choice) {
            parts.push(this.choice[0]);
        }

        return parts.join(',');
    }

    public investedOrEquipped(): boolean {
        return this.canInvest() ? this.invested : (this.equipped === this.equippable);
    }

    public canInvest(): boolean {
        return (this.traits.includes('Invested'));
    }

    public canStack(): boolean {
        //Equipment cannot stack.
        return false;
    }

    /** Amount of propertyRunes you can still apply */
    public freePropertyRunesOfItem(): number {
        //You can apply as many property runes as the level of your potency rune. Each rune with the Saggorak trait counts double.
        const saggorakRuneWorth = 2;
        const otherRuneWorth = 1;

        const runeSlotsUsed = this.propertyRunes.reduce(
            (amount, rune) =>
                amount + (rune.traits.includes('Saggorak')
                    ? saggorakRuneWorth
                    : otherRuneWorth
                ),
            0,
        );

        let runes =
            this.potencyRune - runeSlotsUsed;

        //Material can allow you to have four runes instead of three.
        const extraRune = this.material?.[0]?.extraRune || 0;

        if (this.potencyRune === BasicRuneLevels.Third && extraRune) {
            runes += extraRune;
        }

        return runes;
    }

    public effectiveBulk(): string {
        //Return either the bulk set by an oil, or the bulk of the item, possibly reduced by the material.
        let bulk: string = this.bulk;

        this.material.forEach(material => {
            if (parseInt(this.bulk, 10) && parseInt(this.bulk, 10) !== 0) {
                bulk = (parseInt(this.bulk, 10) + material.bulkModifier).toString();

                if (parseInt(bulk, 10) === 0 && parseInt(this.bulk, 10) !== 0) {
                    //Material can't reduce the bulk to 0.
                    bulk = 'L';
                }
            }
        });

        let oilBulk = '';

        this.oilsApplied.forEach(oil => {
            if (oil.bulkEffect) {
                oilBulk = oil.bulkEffect;
            }
        });
        bulk = (this.carryingBulk && !this.equipped) ? this.carryingBulk : bulk;

        return oilBulk || bulk;
    }

    /** Return the highest value of your potency rune or any oils that emulate one. */
    public effectivePotency$(): Observable<number> {
        return combineLatest([
            this.potencyRune$,
            this.oilsApplied.values$,
        ])
            .pipe(
                map(([potencyRune, oilsApplied]) =>
                    Math.max(...oilsApplied.map(oil => oil.potencyEffect), potencyRune),
                ),
            );
    }

    public effectivePotencySnapshot(): number {
        const potencyRune = this.potencyRune;
        const oilsApplied = this.oilsApplied;

        return Math.max(...oilsApplied.map(oil => oil.potencyEffect), potencyRune);
    }

    public potencyTitle(potency: number): string {
        if (potency > 0) {
            return `+${ potency }`;
        } else {
            return '';
        }
    }

    /** Return the highest value of your striking rune or any oils that emulate one. */
    public effectiveStriking$(): Observable<number> {
        return combineLatest([
            this.strikingRune$,
            this.oilsApplied.values$,
        ])
            .pipe(
                map(([strikingRune, oilsApplied]) =>
                    Math.max(...oilsApplied.map(oil => oil.strikingEffect), strikingRune),
                ),
            );
    }

    /** Return the highest value of your resilient rune or any oils that emulate one. */
    public effectiveResilient$(): Observable<number> {
        return combineLatest([
            this.resilientRune$,
            this.oilsApplied.values$,
        ])
            .pipe(
                map(([resilientRune, oilsApplied]) =>
                    Math.max(...oilsApplied.map(oil => oil.resilientEffect), resilientRune),
                ),
            );
    }

    public effectiveName$(options: { itemStore?: boolean } = {}): Observable<string> {
        if (this.displayName) {
            return of(this.displayName + ((!options.itemStore && this.choice) ? `: ${ this.choice }` : ''));
        }

        return combineLatest([
            this.effectivePotency$(),
            this._secondaryRuneName$(),
            this.propertyRunes.values$,
            this.material.values$,
            this._bladeAllyName$(),
        ])
            .pipe(
                map(([potencyValue, secondaryRuneName, propertyRunes, material, bladeAllyName]) =>
                    this._effectiveName(
                        { potencyValue, secondaryRuneName, propertyRunes, material, bladeAllyName },
                        options,
                    )),
            );
    }

    public effectiveNameSnapshot(options: { itemStore?: boolean } = {}): string {
        if (this.displayName) {
            return this.displayName + ((!options.itemStore && this.choice) ? `: ${ this.choice }` : '');
        }

        const potencyValue = this.effectivePotencySnapshot();
        const secondaryRuneName = this._secondaryRuneNameSnapshot();
        const propertyRunes = this.propertyRunes;
        const material = this.material;
        const bladeAllyName = this._bladeAllyNameSnapshot();

        return this._effectiveName(
            { potencyValue, secondaryRuneName, propertyRunes, material, bladeAllyName },
            options,
        );
    }

    public effectsGenerationHints$(): Observable<Array<HintEffectsObject>> {
        const extractHintEffectsObject$ = (hintItem: Item | Material): Observable<Array<HintEffectsObject>> =>
            hintItem.hasHints()
                ? hintItem.effectiveName$()
                    .pipe(
                        map(objectName =>
                            hintItem.hints.map(hint => ({
                                hint,
                                parentItem: hintItem,
                                objectName,
                            })),
                        ),
                    )
                : of([]);

        return combineLatest([
            extractHintEffectsObject$(this),
            ...this.oilsApplied.map(oil => extractHintEffectsObject$(oil)),
            ...this.material.map(material => extractHintEffectsObject$(material)),
            ...this.propertyRunes.map(rune => extractHintEffectsObject$(rune)),
        ])
            .pipe(
                map(objectLists =>
                    new Array<HintEffectsObject>()
                        .concat(...objectLists),
                ),
            );
    }

    protected _secondaryRuneName$(): Observable<string> {
        //Weapons, Armors and Worn Items that can bear runes have their own version of this method.
        return of('');
    }

    protected _secondaryRuneNameSnapshot(): string {
        //Weapons, Armors and Worn Items that can bear runes have their own version of this method.
        return '';
    }

    protected _bladeAllyName$(): Observable<Array<string>> {
        //Weapons have their own version of this method.
        return of([]);
    }

    protected _bladeAllyNameSnapshot(): Array<string> {
        //Weapons have their own version of this method.
        return [];
    }

    private _effectiveName(
        context: {
            potencyValue: number;
            secondaryRuneName: string;
            propertyRunes: Array<Rune>;
            material: Array<Material>;
            bladeAllyName: Array<string>;
        },
        options?: { itemStore?: boolean },
    ): string {
        const words: Array<string> = [];
        const potency = this.potencyTitle(context.potencyValue);

        if (potency) {
            words.push(potency);
        }

        if (context.secondaryRuneName) {
            words.push(context.secondaryRuneName);
        }

        context.propertyRunes.forEach(rune => {
            let runeName: string = rune.name;

            if (rune.name.includes('(Greater)')) {
                runeName = `Greater ${ rune.name.substring(0, rune.name.indexOf('(Greater)')) }`;
            } else if (rune.name.includes(', Greater)')) {
                runeName = `Greater ${ rune.name.substring(0, rune.name.indexOf(', Greater)')) })`;
            }

            words.push(runeName);
        });

        words.push(...context.bladeAllyName);

        const materialNames = this.material.map(mat => mat.effectiveName());

        words.push(...materialNames);

        // If you have any material in the name of the item, and it has a material applied, remove the original material.
        // E.g. if this Steel Shield is has Silver as its material name, it will be a Silver Shield instead of a Silver Steel Shield.
        // This list may grow.
        const inherentMaterialNames = [
            'Wooden ',
            'Steel ',
        ];

        if (context.material.length && inherentMaterialNames.some(matName => stringEqualsCaseInsensitive(this.name, matName))) {
            const itemName = this.name;

            inherentMaterialNames
                .forEach(mat => {
                    name = name.replace(mat, '');
                });
            words.push(itemName);
        } else {
            words.push(this.name);
        }

        let name = words.join(' ');

        const hasChoice = !options?.itemStore && !!this.choice;

        if (hasChoice) {
            name += `: ${ this.choice }`;
        }

        return name;
    }

    public abstract clone(recastFns: RecastFns): Equipment;
}
