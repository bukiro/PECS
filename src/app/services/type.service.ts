import { Injectable } from '@angular/core';
import { AbilityChoice } from 'src/app/classes/AbilityChoice';
import { Activity } from 'src/app/classes/Activity';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { AdventuringGear } from 'src/app/classes/AdventuringGear';
import { AlchemicalBomb } from 'src/app/classes/AlchemicalBomb';
import { AlchemicalElixir } from 'src/app/classes/AlchemicalElixir';
import { AlchemicalPoison } from 'src/app/classes/AlchemicalPoison';
import { AlchemicalTool } from 'src/app/classes/AlchemicalTool';
import { Ammunition } from 'src/app/classes/Ammunition';
import { Ancestry } from 'src/app/classes/Ancestry';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { AnimalCompanionAncestry } from 'src/app/classes/AnimalCompanionAncestry';
import { AnimalCompanionClass } from 'src/app/classes/AnimalCompanionClass';
import { AnimalCompanionLevel } from 'src/app/classes/AnimalCompanionLevel';
import { AnimalCompanionSpecialization } from 'src/app/classes/AnimalCompanionSpecialization';
import { Armor } from 'src/app/classes/Armor';
import { ArmorMaterial } from 'src/app/classes/ArmorMaterial';
import { ArmorRune } from 'src/app/classes/ArmorRune';
import { AttackRestriction } from 'src/app/classes/AttackRestriction';
import { Background } from 'src/app/classes/Background';
import { BloodMagic } from 'src/app/classes/BloodMagic';
import { Bulk } from 'src/app/classes/Bulk';
import { Character } from 'src/app/classes/Character';
import { Class } from 'src/app/classes/Class';
import { Condition } from 'src/app/classes/Condition';
import { ConditionChoice } from 'src/app/classes/ConditionChoice';
import { ConditionDuration } from 'src/app/classes/ConditionDuration';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { Consumable } from 'src/app/classes/Consumable';
import { Creature } from 'src/app/classes/Creature';
import { Deity } from 'src/app/classes/Deity';
import { Effect } from 'src/app/classes/Effect';
import { EffectGain } from 'src/app/classes/EffectGain';
import { Equipment } from 'src/app/classes/Equipment';
import { Familiar } from 'src/app/classes/Familiar';
import { Feat } from 'src/app/character-creation/definitions/models/Feat';
import { FeatChoice } from 'src/app/character-creation/definitions/models/FeatChoice';
import { FormulaChoice } from 'src/app/classes/FormulaChoice';
import { FormulaLearned } from 'src/app/classes/FormulaLearned';
import { Health } from 'src/app/classes/Health';
import { HeightenedDescSet } from 'src/app/classes/HeightenedDescSet';
import { HeldItem } from 'src/app/classes/HeldItem';
import { Heritage } from 'src/app/classes/Heritage';
import { HeritageGain } from 'src/app/classes/HeritageGain';
import { Hint } from 'src/app/classes/Hint';
import { InventoryGain } from 'src/app/classes/InventoryGain';
import { Item } from 'src/app/classes/Item';
import { ItemActivity } from 'src/app/classes/ItemActivity';
import { ItemCollection } from 'src/app/classes/ItemCollection';
import { ItemGain } from 'src/app/classes/ItemGain';
import { ItemsService } from 'src/app/services/items.service';
import { LanguageGain } from 'src/app/classes/LanguageGain';
import { Level } from 'src/app/classes/Level';
import { LoreChoice } from 'src/app/classes/LoreChoice';
import { Material } from 'src/app/classes/Material';
import { MaterialItem } from 'src/app/classes/MaterialItem';
import { Oil } from 'src/app/classes/Oil';
import { OtherConsumable } from 'src/app/classes/OtherConsumable';
import { OtherConsumableBomb } from 'src/app/classes/OtherConsumableBomb';
import { OtherItem } from 'src/app/classes/OtherItem';
import { Potion } from 'src/app/classes/Potion';
import { ProficiencyChange } from 'src/app/classes/ProficiencyChange';
import { ProficiencyCopy } from 'src/app/classes/ProficiencyCopy';
import { Rune } from 'src/app/classes/Rune';
import { Scroll } from 'src/app/classes/Scroll';
import { SenseGain } from 'src/app/classes/SenseGain';
import { Settings } from 'src/app/classes/Settings';
import { Shield } from 'src/app/classes/Shield';
import { ShieldMaterial } from 'src/app/classes/ShieldMaterial';
import { SignatureSpellGain } from 'src/app/classes/SignatureSpellGain';
import { Skill } from 'src/app/classes/Skill';
import { SkillChoice } from 'src/app/classes/SkillChoice';
import { Snare } from 'src/app/classes/Snare';
import { Specialization } from 'src/app/classes/Specialization';
import { SpecializationGain } from 'src/app/classes/SpecializationGain';
import { Speed } from 'src/app/classes/Speed';
import { Spell } from 'src/app/classes/Spell';
import { SpellCast } from 'src/app/classes/SpellCast';
import { SpellCasting } from 'src/app/classes/SpellCasting';
import { SpellChoice } from 'src/app/classes/SpellChoice';
import { SpellGain } from 'src/app/classes/SpellGain';
import { SpellTargetNumber } from 'src/app/classes/SpellTargetNumber';
import { Talisman } from 'src/app/classes/Talisman';
import { Trait } from 'src/app/classes/Trait';
import { Wand } from 'src/app/classes/Wand';
import { Weapon } from 'src/app/classes/Weapon';
import { WeaponMaterial } from 'src/app/classes/WeaponMaterial';
import { WeaponRune } from 'src/app/classes/WeaponRune';
import { WornItem } from 'src/app/classes/WornItem';

@Injectable({
    providedIn: 'root',
})
export class TypeService {

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public classCast(obj: any, className: string): any {
        //This function tries to cast an object according to the given class name.
        switch (className) {
            case 'AbilityChoice': return Object.assign(new AbilityChoice(), obj);
            case 'Activity': return Object.assign(new Activity(), obj);
            case 'ActivityGain': return Object.assign(new ActivityGain(), obj);
            case 'AdventuringGear': return Object.assign(new AdventuringGear(), obj);
            case 'AlchemicalBomb': return Object.assign(new AlchemicalBomb(), obj);
            case 'AlchemicalElixir': return Object.assign(new AlchemicalElixir(), obj);
            case 'AlchemicalPoison': return Object.assign(new AlchemicalPoison(), obj);
            case 'AlchemicalTool': return Object.assign(new AlchemicalTool(), obj);
            case 'Ammunition': return Object.assign(new Ammunition(), obj);
            case 'Ancestry': return Object.assign(new Ancestry(), obj);
            case 'AnimalCompanion': return Object.assign(new AnimalCompanion(), obj);
            case 'AnimalCompanionAncestry': return Object.assign(new AnimalCompanionAncestry(), obj);
            case 'AnimalCompanionClass': return Object.assign(new AnimalCompanionClass(), obj);
            case 'AnimalCompanionLevel': return Object.assign(new AnimalCompanionLevel(), obj);
            case 'AnimalCompanionSpecialization': return Object.assign(new AnimalCompanionSpecialization(), obj);
            case 'Armor': return Object.assign(new Armor(), obj);
            case 'ArmorMaterial': return Object.assign(new ArmorMaterial(), obj);
            case 'ArmorRune': return Object.assign(new ArmorRune(), obj);
            case 'AttackRestriction': return Object.assign(new AttackRestriction(), obj);
            case 'Background': return Object.assign(new Background(), obj);
            case 'BloodMagic': return Object.assign(new BloodMagic(), obj);
            case 'Bulk': return Object.assign(new Bulk(), obj);
            case 'Character': return Object.assign(new Character(), obj);
            case 'Class': return Object.assign(new Class(), obj);
            case 'Condition': return Object.assign(new Condition(), obj);
            case 'ConditionChoice': return Object.assign(new ConditionChoice(), obj);
            case 'ConditionDuration': return Object.assign(new ConditionDuration(), obj);
            case 'ConditionGain': return Object.assign(new ConditionGain(), obj);
            case 'Consumable': return Object.assign(new Consumable(), obj);
            case 'Creature': return Object.assign(new Creature(), obj);
            case 'Deity': return Object.assign(new Deity(), obj);
            case 'Effect': return Object.assign(new Effect(), obj);
            case 'EffectGain': return Object.assign(new EffectGain(), obj);
            case 'Equipment': return Object.assign(new Equipment(), obj);
            case 'Familiar': return Object.assign(new Familiar(), obj);
            case 'Feat': return Object.assign(new Feat(), obj);
            case 'FeatChoice': return Object.assign(new FeatChoice(), obj);
            case 'FormulaChoice': return Object.assign(new FormulaChoice(), obj);
            case 'FormulaLearned': return Object.assign(new FormulaLearned(), obj);
            case 'Health': return Object.assign(new Health(), obj);
            case 'HeightenedDescSet': return Object.assign(new HeightenedDescSet(), obj);
            case 'HeldItem': return Object.assign(new HeldItem(), obj);
            case 'Heritage': return Object.assign(new Heritage(), obj);
            case 'HeritageGain': return Object.assign(new HeritageGain(), obj);
            case 'Hint': return Object.assign(new Hint(), obj);
            case 'InventoryGain': return Object.assign(new InventoryGain(), obj);
            case 'Item': return Object.assign(new Item(), obj);
            case 'ItemActivity': return Object.assign(new ItemActivity(), obj);
            case 'ItemCollection': return Object.assign(new ItemCollection(), obj);
            case 'ItemGain': return Object.assign(new ItemGain(), obj);
            case 'LanguageGain': return Object.assign(new LanguageGain(), obj);
            case 'Level': return Object.assign(new Level(), obj);
            case 'LoreChoice': return Object.assign(new LoreChoice(), obj);
            case 'Material': return Object.assign(new Material(), obj);
            case 'MaterialItem': return Object.assign(new MaterialItem(), obj);
            case 'Oil': return Object.assign(new Oil(), obj);
            case 'OtherConsumable': return Object.assign(new OtherConsumable(), obj);
            case 'OtherConsumableBomb': return Object.assign(new OtherConsumableBomb(), obj);
            case 'OtherItem': return Object.assign(new OtherItem(), obj);
            case 'Potion': return Object.assign(new Potion(), obj);
            case 'ProficiencyChange': return Object.assign(new ProficiencyChange(), obj);
            case 'ProficiencyCopy': return Object.assign(new ProficiencyCopy(), obj);
            case 'Rune': return Object.assign(new Rune(), obj);
            case 'Scroll': return Object.assign(new Scroll(), obj);
            case 'SenseGain': return Object.assign(new SenseGain(), obj);
            case 'Settings': return Object.assign(new Settings(), obj);
            case 'Shield': return Object.assign(new Shield(), obj);
            case 'ShieldMaterial': return Object.assign(new ShieldMaterial(), obj);
            case 'SignatureSpellGain': return Object.assign(new SignatureSpellGain(), obj);
            case 'Skill': return Object.assign(new Skill(), obj);
            case 'SkillChoice': return Object.assign(new SkillChoice(), obj);
            case 'Snare': return Object.assign(new Snare(), obj);
            case 'Specialization': return Object.assign(new Specialization(), obj);
            case 'SpecializationGain': return Object.assign(new SpecializationGain(), obj);
            case 'Speed': return Object.assign(new Speed(), obj);
            case 'Spell': return Object.assign(new Spell(), obj);
            case 'SpellCast': return Object.assign(new SpellCast(), obj);
            case 'SpellCasting': return Object.assign(new SpellCasting(obj.castingType), obj);
            case 'SpellChoice': return Object.assign(new SpellChoice(), obj);
            case 'SpellGain': return Object.assign(new SpellGain(), obj);
            case 'SpellTargetNumber': return Object.assign(new SpellTargetNumber(), obj);
            case 'Talisman': return Object.assign(new Talisman(), obj);
            case 'Trait': return Object.assign(new Trait(), obj);
            case 'Wand': return Object.assign(new Wand(), obj);
            case 'Weapon': return Object.assign(new Weapon(), obj);
            case 'WeaponMaterial': return Object.assign(new WeaponMaterial(), obj);
            case 'WeaponRune': return Object.assign(new WeaponRune(), obj);
            case 'WornItem': return Object.assign(new WornItem(), obj);
            default: return obj;
        }
    }

    public merge(target: unknown, source: unknown): unknown {
        if (typeof source === 'object' && source) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const output = Object.assign(new (target.constructor as any)(), JSON.parse(JSON.stringify(target)));

            if (Array.isArray(source)) {
                source.forEach((obj: unknown, index) => {
                    if (!output[index]) {
                        Object.assign(output, { [index]: JSON.parse(JSON.stringify(source[index])) });
                    } else {
                        output[index] = this.merge(target[index], source[index]);
                    }
                });
            } else {
                Object.keys(source).forEach(key => {
                    if (typeof source === 'object') {
                        if (!Object.prototype.hasOwnProperty.call(target, key)) { Object.assign(output, { [key]: JSON.parse(JSON.stringify(source[key])) }); } else { output[key] = this.merge(target[key], source[key]); }
                    } else {
                        Object.assign(output, { [key]: JSON.parse(JSON.stringify(source[key])) });
                    }
                });
            }

            return output;
        } else {
            return source;
        }
    }

    public restoreItem(object: Item, itemsService: ItemsService = null): Item {
        if (itemsService && object.refId && !object.restoredFromSave) {
            const libraryItem = itemsService.get_CleanItemByID(object.refId);
            let mergedObject = object;

            if (libraryItem) {
                //Map the restored object onto the library object and keep the result.
                try {
                    mergedObject = this.merge(libraryItem, mergedObject) as typeof libraryItem;
                    mergedObject = itemsService.cast_ItemByType(mergedObject, libraryItem.type);

                    //Disable any active hint effects when loading an item.
                    if (mergedObject instanceof Equipment) {
                        mergedObject.hints.forEach(hint => {
                            hint.active = hint.active2 = hint.active3 = hint.active4 = hint.active5 = false;
                        });
                    }

                    mergedObject.restoredFromSave = true;
                } catch (e) {
                    console.log(`Failed reassigning item ${ mergedObject.id }: ${ e }`);
                }
            }

            return mergedObject;
        }

        return object;
    }

}
