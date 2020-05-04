import { Injectable, APP_INITIALIZER } from '@angular/core';
import { Character } from './Character';
import { Ancestry } from './Ancestry';
import { Class } from './Class';
import { AbilityChoice } from './AbilityChoice';
import { ItemGain } from './ItemGain';
import { AnimalCompanion } from './AnimalCompanion';
import { AnimalCompanionClass } from './AnimalCompanionClass';
import { AnimalCompanionAncestry } from './AnimalCompanionAncestry';
import { ActivityGain } from './ActivityGain';
import { Level } from './Level';
import { FeatChoice } from './FeatChoice';
import { LoreChoice } from './LoreChoice';
import { SkillChoice } from './SkillChoice';
import { EffectGain } from './EffectGain';
import { SpellChoice } from './SpellChoice';
import { TraditionChoice } from './TraditionChoice';
import { AnimalCompanionLevel } from './AnimalCompanionLevel';
import { AnimalCompanionSpecialization } from './AnimalCompanionSpecialization';
import { Skill } from './Skill';
import { WornItem } from './WornItem';
import { AdventuringGear } from './AdventuringGear';
import { AlchemicalElixir } from './AlchemicalElixir';
import { Armor } from './Armor';
import { ArmorRune } from './ArmorRune';
import { Background } from './Background';
import { Bloodline } from './Bloodline';
import { ConditionGain } from './ConditionGain';
import { Consumable } from './Consumable';
import { Feat } from './Feat';
import { FormulaChoice } from './FormulaChoice';
import { Health } from './Health';
import { HeldItem } from './HeldItem';
import { Heritage } from './Heritage';
import { ItemActivity } from './ItemActivity';
import { OtherConsumable } from './OtherConsumable';
import { OtherItem } from './OtherItem';
import { Potion } from './Potion';
import { Settings } from './Settings';
import { Shield } from './Shield';
import { SpellCast } from './SpellCast';
import { SpellGain } from './SpellGain';
import { Weapon } from './Weapon';
import { WeaponRune } from './WeaponRune';
import { ItemCollection } from './ItemCollection';
import { Speed } from './Speed';
import { Bulk } from './Bulk';
import { ItemsService } from './items.service';

@Injectable({
    providedIn: 'root'
})
export class SavegameService {

    private AbilityChoice = AbilityChoice;
    private ActivityGain = ActivityGain;
    private AdventuringGear = AdventuringGear;
    private AlchemicalElixir = AlchemicalElixir;
    private Ancestry = Ancestry;
    private AnimalCompanion = AnimalCompanion;
    private AnimalCompanionAncestry = AnimalCompanionAncestry;
    private AnimalCompanionClass = AnimalCompanionClass;
    private AnimalCompanionLevel = AnimalCompanionLevel;
    private AnimalCompanionSpecialization = AnimalCompanionSpecialization;
    private Armor = Armor;
    private ArmorRune = ArmorRune;
    private Background = Background;
    private Bloodline = Bloodline;
    private Bulk = Bulk;
    private Character = Character;
    private Class = Class;
    private ConditionGain = ConditionGain;
    private Consumable = Consumable;
    private EffectGain = EffectGain;
    private Feat = Feat;
    private FeatChoice = FeatChoice;
    private FormulaChoice = FormulaChoice;
    private Health = Health;
    private HeldItem = HeldItem;
    private Heritage = Heritage;
    private ItemActivity = ItemActivity;
    private ItemCollection = ItemCollection;
    private ItemGain = ItemGain;
    private Level = Level;
    private LoreChoice = LoreChoice;
    private OtherConsumable = OtherConsumable;
    private OtherItem = OtherItem;
    private Potion = Potion;
    private Settings = Settings;
    private Shield = Shield;
    private Skill = Skill;
    private SkillChoice = SkillChoice;
    private Speed = Speed;
    private SpellCast = SpellCast;
    private SpellChoice = SpellChoice;
    private SpellGain = SpellGain;
    private TraditionChoice = TraditionChoice;
    private Weapon = Weapon;
    private WeaponRune = WeaponRune;
    private WornItem = WornItem;
    
    constructor() { }

    load_Character(character: Character, itemsService: ItemsService) {
        character.inventory = Object.assign(new ItemCollection(), character.inventory);
        character.inventory.initialize(itemsService);
        character.class.animalCompanion.inventory = Object.assign(new ItemCollection(), character.class.animalCompanion.inventory);
        character.class.animalCompanion.inventory.initialize(itemsService);
        character = this.reassign(character);
        return character;
    }

    clean(object: any) {
        //Only cleanup objects that have Classes (= aren't object Object)
        if (typeof object == "object" && object.constructor !== Object) {
            //If the object is an array, iterate over its elements
            if (object.constructor === Array) {
                object.forEach((obj: any) => {
                    obj = this.clean(obj);
                });
            } else {
                let blank = new object.constructor();
                Object.keys(object).forEach(key => {
                    //Don't cleanup the "_className" attribute
                    if (key != "_className" && key.substr(0,1) != "$") {
                        //If the attribute has the same value as the default, delete it from the object.
                        if (JSON.stringify(object[key]) == JSON.stringify(blank[key])) {
                            delete object[key];
                        } else {
                            object[key] = this.clean(object[key])
                        }
                    } else if (key.substr(0,1) == "$") {
                        delete object[key];
                    }
                })
            }
        }
        return object;
    }

    reassign(object: any) {
        //Only objects get reassigned - if they have a _className attribute
        if (typeof object == "object") {
            //If the object is an array, iterate over its elements
            if (object.constructor === Array) {
                object.forEach((obj: any, index) => {
                    object[index] = this.reassign(obj);
                });
            } else {
                //Try casting this item as its _className
                if (object._className) {
                    try {
                        object = Object.assign(eval("new this."+object._className+"()"), object)
                    } catch (e) {
                        console.log("Failed reassigning: "+e)
                    }
                }
                Object.keys(object).forEach(key => {
                    object[key] = this.reassign(object[key])
                })
            }
        }
        return object;
    }

    save_Character(itemsService: ItemsService, character: Character) {
        
        let savegame = JSON.parse(JSON.stringify(character));
        
        //After copying the character into the savegame, we go through all its elements and make sure that they have the correct class.

        savegame = this.reassign(savegame);

        //Go through all the items and compare every item to its library equivalent, skipping the properties listed in .save
        //Everything that is the same as the library item gets deleted.
        savegame.inventory.cleanForSave(itemsService);
        savegame.class.animalCompanion.inventory.cleanForSave(itemsService);

        //Then go through again and compare every object to its Class's default, deleting everything that has the same value as the default.
                
        savegame = this.clean(savegame);

        console.log(JSON.stringify(savegame));
    }

}
