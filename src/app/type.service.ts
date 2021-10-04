import { Injectable } from '@angular/core';
import { AbilityChoice } from './AbilityChoice';
import { Activity } from './Activity';
import { ActivityGain } from './ActivityGain';
import { AdventuringGear } from './AdventuringGear';
import { AlchemicalBomb } from './AlchemicalBomb';
import { AlchemicalElixir } from './AlchemicalElixir';
import { AlchemicalPoison } from './AlchemicalPoison';
import { AlchemicalTool } from './AlchemicalTool';
import { Ammunition } from './Ammunition';
import { Ancestry } from './Ancestry';
import { AnimalCompanion } from './AnimalCompanion';
import { AnimalCompanionAncestry } from './AnimalCompanionAncestry';
import { AnimalCompanionClass } from './AnimalCompanionClass';
import { AnimalCompanionLevel } from './AnimalCompanionLevel';
import { AnimalCompanionSpecialization } from './AnimalCompanionSpecialization';
import { Armor } from './Armor';
import { ArmorMaterial } from './ArmorMaterial';
import { ArmorRune } from './ArmorRune';
import { AttackRestriction } from './AttackRestriction';
import { Background } from './Background';
import { BloodMagic } from './BloodMagic';
import { Bulk } from './Bulk';
import { Creature } from './Creature';
import { Character } from './Character';
import { Class } from './Class';
import { Condition } from './Condition';
import { ConditionChoice } from './ConditionChoice';
import { ConditionDuration } from './ConditionDuration';
import { ConditionGain } from './ConditionGain';
import { Consumable } from './Consumable';
import { Deity } from './Deity';
import { Effect } from './Effect';
import { EffectGain } from './EffectGain';
import { Equipment } from './Equipment';
import { Familiar } from './Familiar';
import { Feat } from './Feat';
import { FeatChoice } from './FeatChoice';
import { FormulaChoice } from './FormulaChoice';
import { FormulaLearned } from './FormulaLearned';
import { Health } from './Health';
import { HeightenedDescSet } from './HeightenedDescSet';
import { HeldItem } from './HeldItem';
import { Heritage } from './Heritage';
import { HeritageGain } from './HeritageGain';
import { Hint } from './Hint';
import { InventoryGain } from './InventoryGain';
import { Item } from './Item';
import { ItemActivity } from './ItemActivity';
import { ItemCollection } from './ItemCollection';
import { ItemGain } from './ItemGain';
import { ItemsService } from './items.service';
import { LanguageGain } from './LanguageGain';
import { Level } from './Level';
import { LoreChoice } from './LoreChoice';
import { Material } from './Material';
import { Oil } from './Oil';
import { OtherConsumable } from './OtherConsumable';
import { OtherConsumableBomb } from './OtherConsumableBomb';
import { OtherItem } from './OtherItem';
import { Potion } from './Potion';
import { ProficiencyChange } from './ProficiencyChange';
import { ProficiencyCopy } from './ProficiencyCopy';
import { Rune } from './Rune';
import { Scroll } from './Scroll';
import { SenseGain } from './SenseGain';
import { Settings } from './Settings';
import { Shield } from './Shield';
import { ShieldMaterial } from './ShieldMaterial';
import { SignatureSpellGain } from './SignatureSpellGain';
import { Skill } from './Skill';
import { SkillChoice } from './SkillChoice';
import { Snare } from './Snare';
import { Specialization } from './Specialization';
import { SpecializationGain } from './SpecializationGain';
import { Speed } from './Speed';
import { Spell } from './Spell';
import { SpellCast } from './SpellCast';
import { SpellCasting } from './SpellCasting';
import { SpellChoice } from './SpellChoice';
import { SpellGain } from './SpellGain';
import { SpellTargetNumber } from './SpellTargetNumber';
import { Talisman } from './Talisman';
import { Trait } from './Trait';
import { Wand } from './Wand';
import { Weapon } from './Weapon';
import { WeaponMaterial } from './WeaponMaterial';
import { WeaponRune } from './WeaponRune';
import { WornItem } from './WornItem';

@Injectable({
    providedIn: 'root'
})
export class TypeService {

    constructor() { }

    classCast(obj: any, className: string) {
        //This function tries to cast an object according to the given class name.
        switch (className) {
            case "AbilityChoice": return Object.assign(new AbilityChoice(), obj);
            case "Activity": return Object.assign(new Activity(), obj);
            case "ActivityGain": return Object.assign(new ActivityGain(), obj);
            case "AdventuringGear": return Object.assign(new AdventuringGear(), obj);
            case "AlchemicalBomb": return Object.assign(new AlchemicalBomb(), obj);
            case "AlchemicalElixir": return Object.assign(new AlchemicalElixir(), obj);
            case "AlchemicalPoison": return Object.assign(new AlchemicalPoison(), obj);
            case "AlchemicalTool": return Object.assign(new AlchemicalTool(), obj);
            case "Ammunition": return Object.assign(new Ammunition(), obj);
            case "Ancestry": return Object.assign(new Ancestry(), obj);
            case "AnimalCompanion": return Object.assign(new AnimalCompanion(), obj);
            case "AnimalCompanionAncestry": return Object.assign(new AnimalCompanionAncestry(), obj);
            case "AnimalCompanionClass": return Object.assign(new AnimalCompanionClass(), obj);
            case "AnimalCompanionLevel": return Object.assign(new AnimalCompanionLevel(), obj);
            case "AnimalCompanionSpecialization": return Object.assign(new AnimalCompanionSpecialization(), obj);
            case "Armor": return Object.assign(new Armor(), obj);
            case "ArmorMaterial": return Object.assign(new ArmorMaterial(), obj);
            case "ArmorRune": return Object.assign(new ArmorRune(), obj);
            case "AttackRestriction": return Object.assign(new AttackRestriction(), obj);
            case "Background": return Object.assign(new Background(), obj);
            case "BloodMagic": return Object.assign(new BloodMagic(), obj);
            case "Bulk": return Object.assign(new Bulk(), obj);
            case "Character": return Object.assign(new Character(), obj);
            case "Class": return Object.assign(new Class(), obj);
            case "Condition": return Object.assign(new Condition(), obj);
            case "ConditionChoice": return Object.assign(new ConditionChoice(), obj);
            case "ConditionDuration": return Object.assign(new ConditionDuration(), obj);
            case "ConditionGain": return Object.assign(new ConditionGain(), obj);
            case "Consumable": return Object.assign(new Consumable(), obj);
            case "Creature": return Object.assign(new Creature(), obj);
            case "Deity": return Object.assign(new Deity(), obj);
            case "Effect": return Object.assign(new Effect(), obj);
            case "EffectGain": return Object.assign(new EffectGain(), obj);
            case "Equipment": return Object.assign(new Equipment(), obj);
            case "Familiar": return Object.assign(new Familiar(), obj);
            case "Feat": return Object.assign(new Feat(), obj);
            case "FeatChoice": return Object.assign(new FeatChoice(), obj);
            case "FormulaChoice": return Object.assign(new FormulaChoice(), obj);
            case "FormulaLearned": return Object.assign(new FormulaLearned(), obj);
            case "Health": return Object.assign(new Health(), obj);
            case "HeightenedDescSet": return Object.assign(new HeightenedDescSet(), obj);
            case "HeldItem": return Object.assign(new HeldItem(), obj);
            case "Heritage": return Object.assign(new Heritage(), obj);
            case "HeritageGain": return Object.assign(new HeritageGain(), obj);
            case "Hint": return Object.assign(new Hint(), obj);
            case "InventoryGain": return Object.assign(new InventoryGain(), obj);
            case "Item": return Object.assign(new Item(), obj);
            case "ItemActivity": return Object.assign(new ItemActivity(), obj);
            case "ItemCollection": return Object.assign(new ItemCollection(), obj);
            case "ItemGain": return Object.assign(new ItemGain(), obj);
            case "LanguageGain": return Object.assign(new LanguageGain(), obj);
            case "Level": return Object.assign(new Level(), obj);
            case "LoreChoice": return Object.assign(new LoreChoice(), obj);
            case "Material": return Object.assign(new Material(), obj);
            case "Oil": return Object.assign(new Oil(), obj);
            case "OtherConsumable": return Object.assign(new OtherConsumable(), obj);
            case "OtherConsumableBomb": return Object.assign(new OtherConsumableBomb(), obj);
            case "OtherItem": return Object.assign(new OtherItem(), obj);
            case "Potion": return Object.assign(new Potion(), obj);
            case "ProficiencyChange": return Object.assign(new ProficiencyChange(), obj);
            case "ProficiencyCopy": return Object.assign(new ProficiencyCopy(), obj);
            case "Rune": return Object.assign(new Rune(), obj);
            case "Scroll": return Object.assign(new Scroll(), obj);
            case "SenseGain": return Object.assign(new SenseGain(), obj);
            case "Settings": return Object.assign(new Settings(), obj);
            case "Shield": return Object.assign(new Shield(), obj);
            case "ShieldMaterial": return Object.assign(new ShieldMaterial(), obj);
            case "SignatureSpellGain": return Object.assign(new SignatureSpellGain(), obj);
            case "Skill": return Object.assign(new Skill(), obj);
            case "SkillChoice": return Object.assign(new SkillChoice(), obj);
            case "Snare": return Object.assign(new Snare(), obj);
            case "Specialization": return Object.assign(new Specialization(), obj);
            case "SpecializationGain": return Object.assign(new SpecializationGain(), obj);
            case "Speed": return Object.assign(new Speed(), obj);
            case "Spell": return Object.assign(new Spell(), obj);
            case "SpellCast": return Object.assign(new SpellCast(), obj);
            case "SpellCasting": return Object.assign(new SpellCasting(obj.castingType), obj);
            case "SpellChoice": return Object.assign(new SpellChoice(), obj);
            case "SpellGain": return Object.assign(new SpellGain(), obj);
            case "SpellTargetNumber": return Object.assign(new SpellTargetNumber(), obj);
            case "Talisman": return Object.assign(new Talisman(), obj);
            case "Trait": return Object.assign(new Trait(), obj);
            case "Wand": return Object.assign(new Wand(), obj);
            case "Weapon": return Object.assign(new Weapon(), obj);
            case "WeaponMaterial": return Object.assign(new WeaponMaterial(), obj);
            case "WeaponRune": return Object.assign(new WeaponRune(), obj);
            case "WornItem": return Object.assign(new WornItem(), obj);
            default: return obj;
        }
    }

    merge(target: any, source: any) {
        if (typeof source == "object" && source) {
            let output = Object.assign(new target.constructor, JSON.parse(JSON.stringify(target)))
            if (Array.isArray(source)) {
                source.forEach((obj: any, index) => {
                    if (!output[index]) {
                        Object.assign(output, { [index]: JSON.parse(JSON.stringify(source[index])) });
                    } else {
                        output[index] = this.merge(target[index], source[index]);
                    }
                });
            } else {
                Object.keys(source).forEach(key => {
                    if (typeof source === 'object') {
                        if (!(key in target))
                            Object.assign(output, { [key]: JSON.parse(JSON.stringify(source[key])) });
                        else
                            output[key] = this.merge(target[key], source[key]);
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

    restore_Item(object: any, itemsService: ItemsService = null) {
        if (object.refId && !object.restoredFromSave && itemsService) {
            let libraryItem = itemsService.get_CleanItemByID(object.refId);
            if (libraryItem) {
                //Map the restored object onto the library object and keep the result.
                try {
                    object = this.merge(libraryItem, object);
                    object = itemsService.cast_ItemByClassName(object, libraryItem.constructor.name);
                    //Disable any active hint effects when loading an item.
                    if (object instanceof Equipment) {
                        object.hints.forEach(hint => {
                            hint.active = hint.active2 = hint.active3 = hint.active4 = hint.active5 = false;
                        })
                    }
                    if (object instanceof Item) {
                        object.restoredFromSave = true;
                    }
                } catch (e) {
                    console.log("Failed reassigning item " + object.id + ": " + e)
                }
            }
        }
        return object;
    }

}
