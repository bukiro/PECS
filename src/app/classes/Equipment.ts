import { EffectGain } from 'src/app/classes/EffectGain';
import { Item } from 'src/app/classes/Item';
import { ItemActivity } from 'src/app/classes/ItemActivity';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { Rune } from 'src/app/classes/Rune';
import { Oil } from 'src/app/classes/Oil';
import { ItemsService } from 'src/app/services/items.service';
import { InventoryGain } from 'src/app/classes/InventoryGain';
import { Talisman } from 'src/app/classes/Talisman';
import { Material } from 'src/app/classes/Material';
import { Hint } from 'src/app/classes/Hint';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { SpellChoice } from 'src/app/classes/SpellChoice';
import { WornItem } from 'src/app/classes/WornItem';
import { TypeService } from 'src/app/services/type.service';
import { HintEffectsObject } from 'src/app/services/effectsGeneration.service';
import { Specialization } from 'src/app/classes/Specialization';
import { Creature } from 'src/app/classes/Creature';
import { CharacterService } from 'src/app/services/character.service';
import { BasicRuneLevels } from 'src/libs/shared/definitions/basicRuneLevels';

export class Equipment extends Item {
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
    /** Is the item currently equipped - items with equippable==false are always equipped */
    public equipped = false;
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
    public invested = false;
    public material: Array<Material> = [];
    /**
     * Can runes and material be applied to this item? Armor, shields,
     * weapons and handwraps of mighty blows can usually be modded, but other equipment and specific magic versions of them should not.
     */
    public moddable = false;
    /** Potency Rune level for weapons and armor. */
    public potencyRune = BasicRuneLevels.None;
    /** Property Runes for weapons and armor. */
    public propertyRunes: Array<Rune> = [];
    /** Blade Ally Runes can be emulated on weapons and handwraps. */
    public bladeAllyRunes: Array<Rune> = [];
    /** Resilient Rune level for armor. */
    public resilientRune = BasicRuneLevels.None;
    /** Is the name input visible in the inventory. */
    public showName = false;
    /** Is the rune selection visible in the inventory. */
    public showRunes = false;
    /** Is the status selection visible in the inventory. */
    public showStatus = false;
    /** Striking Rune level for weapons. */
    public strikingRune = BasicRuneLevels.None;
    /** Store any talismans attached to this item. */
    public talismans: Array<Talisman> = [];
    /** List any Talisman Cords attached to this item. */
    public talismanCords: Array<WornItem> = [];
    /** List any senses you gain when the item is equipped or invested. */
    public gainSenses: Array<string> = [];
    public showChoicesInInventory = false;
    public choices: Array<string> = [];
    public choice = '';
    /** Amount of propertyRunes you can still apply */
    public get freePropertyRunes(): number {
        //You can apply as many property runes as the level of your potency rune. Each rune with the Saggorak trait counts double.
        let runes =
            this.potencyRune - this.propertyRunes.length - this.propertyRunes.filter(rune => rune.traits.includes('Saggorak')).length;
        //Material can allow you to have four runes instead of three.
        const extraRune = this.material?.[0]?.extraRune || 0;

        if (this.potencyRune === BasicRuneLevels.Third && extraRune) {
            for (let index = 0; index < extraRune; index++) {
                runes++;
            }
        }

        return runes;
    }
    public recast(typeService: TypeService, itemsService: ItemsService): Equipment {
        super.recast(typeService, itemsService);
        this.activities = this.activities.map(obj => Object.assign(new ItemActivity(), obj).recast());
        this.activities.forEach(activity => { activity.source = this.id; });
        this.effects = this.effects.map(obj => Object.assign(new EffectGain(), obj).recast());
        this.gainActivities = this.gainActivities.map(obj => Object.assign(new ActivityGain(), obj).recast());
        this.gainActivities.forEach(gain => { gain.source = this.id; });
        this.gainInventory = this.gainInventory.map(obj => Object.assign(new InventoryGain(), obj).recast());
        this.gainConditions = this.gainConditions.map(obj => Object.assign(new ConditionGain(), obj).recast());
        this.gainConditions.forEach(conditionGain => {
            if (!conditionGain.source) {
                conditionGain.source = this.name;
            }

            conditionGain.fromItem = true;
        });
        this.gainSpells = this.gainSpells.map(obj => Object.assign(new SpellChoice(), obj).recast());
        this.gainSpells.forEach(choice => {
            if (!choice.castingType) {
                choice.castingType = 'Innate';
            }

            choice.source = this.name;
            choice.spells.forEach(gain => {
                gain.source = choice.source;
            });
        });
        this.hints = this.hints.map(obj => Object.assign(new Hint(), obj).recast());
        this.material = this.material.map(obj => Object.assign(new Material(), obj).recast());
        this.propertyRunes =
            this.propertyRunes.map(obj =>
                Object.assign<Rune, Item>(new Rune(), typeService.restoreItem(obj, itemsService)).recast(typeService, itemsService),
            );
        this.bladeAllyRunes =
            this.bladeAllyRunes.map(obj =>
                Object.assign<Rune, Item>(new Rune(), typeService.restoreItem(obj, itemsService)).recast(typeService, itemsService));
        this.talismans =
            this.talismans.map(obj =>
                Object.assign<Talisman, Item>(
                    new Talisman(),
                    typeService.restoreItem(obj, itemsService),
                ).recast(typeService, itemsService),
            );
        //Talisman Cords need to be cast blindly to avoid circular dependency warnings.
        this.talismanCords =
            this.talismanCords.map(obj =>
                (typeService.classCast(typeService.restoreItem(obj, itemsService), 'WornItem') as WornItem)
                    .recast(typeService, itemsService),
            );

        if (this.choices.length && !this.choices.includes(this.choice)) {
            this.choice = this.choices[0];
        }

        return this;
    }
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
    public effectivePotency(): number {
        //Return the highest value of your potency rune or any oils that emulate one
        return Math.max(...this.oilsApplied.map(oil => oil.potencyEffect), this.potencyRune);
    }
    public potencyTitle(potency: number): string {
        if (potency > 0) {
            return `+${ potency }`;
        } else {
            return '';
        }
    }
    public effectiveStriking(): number {
        //Return the highest value of your striking rune or any oils that emulate one
        return Math.max(...this.oilsApplied.map(oil => oil.strikingEffect), this.strikingRune);
    }
    public strikingTitle(striking: number): string {
        switch (striking) {
            case BasicRuneLevels.None:
                return '';
            case BasicRuneLevels.First:
                return 'Striking';
            case BasicRuneLevels.Second:
                return 'Greater Striking';
            case BasicRuneLevels.Third:
                return 'Major Striking';
            default:
                return '';
        }
    }
    public effectiveResilient(): number {
        //Return the highest value of your resilient rune or any oils that emulate one
        return Math.max(...this.oilsApplied.map(oil => oil.resilientEffect), this.resilientRune);
    }
    public resilientTitle(resilient: number): string {
        switch (resilient) {
            case BasicRuneLevels.None:
                return '';
            case BasicRuneLevels.First:
                return 'Resilient';
            case BasicRuneLevels.Second:
                return 'Greater Resilient';
            case BasicRuneLevels.Third:
                return 'Major Resilient';
            default:
                return '';
        }
    }
    public effectiveName(options: { itemStore?: boolean } = {}): string {
        if (this.displayName.length) {
            return this.displayName + ((!options.itemStore && this.choice) ? `: ${ this.choice }` : '');
        } else {
            const words: Array<string> = [];
            const potency = this.potencyTitle(this.effectivePotency());

            if (potency) {
                words.push(potency);
            }

            let secondary = '';

            secondary = this._secondaryRuneName();

            if (secondary) {
                words.push(secondary);
            }

            this.propertyRunes.forEach(rune => {
                let name: string = rune.name;

                if (rune.name.includes('(Greater)')) {
                    name = `Greater ${ rune.name.substr(0, rune.name.indexOf('(Greater)')) }`;
                } else if (rune.name.includes(', Greater)')) {
                    name = `Greater ${ rune.name.substr(0, rune.name.indexOf(', Greater)')) })`;
                }

                words.push(name);
            });
            this._bladeAllyName().forEach(name => {
                words.push(name);
            });
            this.material.forEach(mat => {
                words.push(mat.effectiveName());
            });

            // If you have any material in the name of the item, and it has a material applied, remove the original material.
            // This list may grow.
            const materials = [
                'Wooden ',
                'Steel ',
            ];

            if (this.material.length && materials.some(mat => this.name.toLowerCase().includes(mat.toLowerCase()))) {
                let name = this.name;

                materials.forEach(mat => {
                    name = name.replace(mat, '');
                });
                words.push(name);
            } else {
                words.push(this.name);
            }

            return words.join(' ') + ((!options.itemStore && this.choice) ? `: ${ this.choice }` : '');
        }
    }
    //Other implementations require creature and characterService.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public effectsGenerationObjects(creature: Creature, characterService: CharacterService): Array<Equipment | Specialization | Rune> {
        return [this];
    }
    public effectsGenerationHints(): Array<HintEffectsObject> {
        const convertHints =
            (item: Equipment | Oil | Material): Array<{ hint: Hint; parentItem: Equipment | Oil | Material; objectName: string }> => (
                item.hints.map(hint => ({ hint, parentItem: item, objectName: item.effectiveName() }))
            );

        return convertHints(this)
            .concat(...this.oilsApplied.map(oil => convertHints(oil)))
            .concat(...this.material.map(material => convertHints(material)));
    }
    protected _secondaryRuneName(): string {
        //Weapons, Armors and Worn Items that can bear runes have their own version of this method.
        return '';
    }
    protected _bladeAllyName(): Array<string> {
        //Weapons have their own version of this method.
        return [];
    }
}
