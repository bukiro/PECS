import { Injectable } from '@angular/core';
import { Character } from './Character';
import { Ancestry } from './Ancestry';
import { Class } from './Class';
import { AbilityChoice } from './AbilityChoice';
import { ItemGain } from './ItemGain';
import { AnimalCompanion } from './AnimalCompanion';
import { Familiar } from './Familiar';
import { AnimalCompanionClass } from './AnimalCompanionClass';
import { AnimalCompanionAncestry } from './AnimalCompanionAncestry';
import { ActivityGain } from './ActivityGain';
import { Level } from './Level';
import { FeatChoice } from './FeatChoice';
import { LoreChoice } from './LoreChoice';
import { SkillChoice } from './SkillChoice';
import { EffectGain } from './EffectGain';
import { SpellChoice } from './SpellChoice';
import { SpellCasting } from './SpellCasting';
import { AnimalCompanionLevel } from './AnimalCompanionLevel';
import { AnimalCompanionSpecialization } from './AnimalCompanionSpecialization';
import { Skill } from './Skill';
import { WornItem } from './WornItem';
import { AdventuringGear } from './AdventuringGear';
import { AlchemicalElixir } from './AlchemicalElixir';
import { Armor } from './Armor';
import { ArmorRune } from './ArmorRune';
import { Background } from './Background';
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
import { Ammunition } from './Ammunition';
import { Item } from './Item';
import { Scroll } from './Scroll';
import { InventoryGain } from './InventoryGain';
import { Oil } from './Oil';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Savegame } from './Savegame';
import { CharacterService } from './character.service';
import { AnimalCompanionsService } from './animalcompanions.service';
import { ClassesService } from './classes.service';
import { HistoryService } from './history.service';
import { Talisman } from './Talisman';

@Injectable({
    providedIn: 'root'
})
export class SavegameService {

    private savegames: Savegame[];
    private loading: boolean = false;
    private loader;
    //private server: string = "arne:8080"
    private server: string = "http://glswxiogstum9cgx.myfritz.net:23480"

    private AbilityChoice = AbilityChoice;
    private ActivityGain = ActivityGain;
    private AdventuringGear = AdventuringGear;
    private AlchemicalElixir = AlchemicalElixir;
    private Ammunition = Ammunition;
    private Ancestry = Ancestry;
    private AnimalCompanion = AnimalCompanion;
    private AnimalCompanionAncestry = AnimalCompanionAncestry;
    private AnimalCompanionClass = AnimalCompanionClass;
    private AnimalCompanionLevel = AnimalCompanionLevel;
    private AnimalCompanionSpecialization = AnimalCompanionSpecialization;
    private Armor = Armor;
    private ArmorRune = ArmorRune;
    private Background = Background;
    private Bulk = Bulk;
    private Character = Character;
    private Class = Class;
    private ConditionGain = ConditionGain;
    private Consumable = Consumable;
    private EffectGain = EffectGain;
    private Familiar = Familiar;
    private Feat = Feat;
    private FeatChoice = FeatChoice;
    private FormulaChoice = FormulaChoice;
    private Health = Health;
    private HeldItem = HeldItem;
    private Heritage = Heritage;
    private InventoryGain = InventoryGain;
    private Item = Item;
    private ItemActivity = ItemActivity;
    private ItemCollection = ItemCollection;
    private ItemGain = ItemGain;
    private Level = Level;
    private LoreChoice = LoreChoice;
    private Oil = Oil;
    private OtherConsumable = OtherConsumable;
    private OtherItem = OtherItem;
    private Potion = Potion;
    private Scroll = Scroll;
    private Settings = Settings;
    private Shield = Shield;
    private Skill = Skill;
    private SkillChoice = SkillChoice;
    private Speed = Speed;
    private SpellCast = SpellCast;
    private SpellCasting = SpellCasting;
    private SpellChoice = SpellChoice;
    private SpellGain = SpellGain;
    private Talisman = Talisman;
    private Weapon = Weapon;
    private WeaponRune = WeaponRune;
    private WornItem = WornItem;

    constructor(
        private http: HttpClient
    ) { }

    get_Savegames() {
        return this.savegames;
    }

    load_Character(character: Character, itemsService: ItemsService, classesService: ClassesService, historyService: HistoryService, animalCompanionsService: AnimalCompanionsService) {
        //Restore a lot of data from reference objects.
        //This allows us to save a lot of data at saving by removing all data from certain objects that is the same as in their original template.
        character.inventories = character.inventories.map(inventory => Object.assign(new ItemCollection(), inventory));
        character.inventories.forEach(inventory => inventory.restore_FromSave(itemsService));
        if (character.class.name) {
            if (character.class.ancestry && character.class.ancestry.name) {
                character.class.ancestry = historyService.restore_AncestryFromSave(character.class.ancestry, this);
            }
            if (character.class.heritage && character.class.heritage.name) {
                character.class.heritage = historyService.restore_HeritageFromSave(character.class.heritage, this);
            }
            if (character.class.background && character.class.background.name) {
                character.class.background = historyService.restore_BackgroundFromSave(character.class.background, this);
            }
            if (character.class.animalCompanion) {
                if (character.class.animalCompanion.inventories) {
                    character.class.animalCompanion.inventories = character.class.animalCompanion.inventories.map(inventory => Object.assign(new ItemCollection(), inventory));
                    character.class.animalCompanion.inventories.forEach(inventory => inventory.restore_FromSave(itemsService));
                }
                if (character.class.animalCompanion?.class?.ancestry) {
                    character.class.animalCompanion.class.ancestry = animalCompanionsService.restore_AncestryFromSave(character.class.animalCompanion.class.ancestry, this);
                }
                if (character.class.animalCompanion?.class?.levels) {
                    character.class.animalCompanion.class = animalCompanionsService.restore_LevelsFromSave(character.class.animalCompanion.class, this);
                }
                if (character.class.animalCompanion.class?.specializations) {
                    character.class.animalCompanion.class.specializations.forEach(spec => {
                        spec = animalCompanionsService.restore_SpecializationFromSave(spec, this);
                    })
                }
            }
            //Restore the class last, so we don't null its components (ancestry, animal companion etc.)
            character.class = classesService.restore_ClassFromSave(character.class, this);
        }

        character = this.reassign(character);
        if (character['_id']) {
            delete character['_id'];
        }
        return character;
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

    clean(object: any) {
        //Only cleanup objects that have Classes (= aren't object Object)
        if (typeof object == "object" && object.constructor !== Object) {
            //If the object is an array, iterate over its elements
            if (Array.isArray(object)) {
                object.forEach((obj: any) => {
                    obj = this.clean(obj);
                });
            } else {
                let blank = new object.constructor();
                Object.keys(object).forEach(key => {
                    //Don't cleanup the "_className" attribute
                    if (key != "_className" && key.substr(0, 1) != "$") {
                        //If the attribute has the same value as the default, delete it from the object.
                        if (JSON.stringify(object[key]) == JSON.stringify(blank[key])) {
                            delete object[key];
                        } else {
                            object[key] = this.clean(object[key])
                        }
                    } else if (key.substr(0, 1) == "$") {
                        delete object[key];
                    }
                })
            }
        }
        return object;
    }

    reassign(object: any, keyName: string = "") {
        //Only objects get reassigned - if they have a _className attribute and aren't null/undefined/empty
        if (typeof object == "object" && object) {
            //If the object is an array, iterate over its elements
            if (Array.isArray(object)) {
                object.forEach((obj: any, index) => {
                    object[index] = this.reassign(obj, keyName + "[" + index + "]");
                });
            } else {
                //Try casting this item as its _className, unless it's already cast.
                if (object._className && object.constructor.name != object._ClassName) {
                    try {
                        object = Object.assign(eval("new this." + object._className + "()"), object)
                    } catch (e) {
                        console.log("Failed reassigning " + keyName + ": " + e)
                    }
                }
                Object.keys(object).forEach(key => {
                    object[key] = this.reassign(object[key], key)
                })
            }
        }
        return object;
    }

    save_Character(character: Character, itemsService: ItemsService, classesService: ClassesService, historyService: HistoryService, animalCompanionsService: AnimalCompanionsService) {

        let savegame: Character = JSON.parse(JSON.stringify(character));

        //After copying the character into the savegame, we go through all its elements and make sure that they have the correct class.

        savegame = this.reassign(savegame);

        //Go through all the items, class, ancestry, heritage, background and compare every item to its library equivalent, skipping the properties listed in .save
        //Everything that is the same as the library item gets deleted.
        savegame.inventories.forEach(inventory => inventory.clean_ForSave(itemsService));
        if (savegame.class.name) {
            savegame.class = classesService.clean_ClassForSave(savegame.class);
            if (savegame.class.ancestry?.name) {
                savegame.class.ancestry = historyService.clean_AncestryForSave(savegame.class.ancestry);
            }
            if (savegame.class.heritage?.name) {
                savegame.class.heritage = historyService.clean_HeritageForSave(savegame.class.heritage);
            }
            if (savegame.class.background?.name) {
                savegame.class.background = historyService.clean_BackgroundForSave(savegame.class.background);
            }
            if (savegame.class.animalCompanion) {
                if (savegame.class.animalCompanion.inventories) {
                    savegame.class.animalCompanion.inventories.forEach(inventory => inventory.clean_ForSave(itemsService));
                }
                if (savegame.class.animalCompanion.class?.ancestry) {
                    savegame.class.animalCompanion.class.ancestry = animalCompanionsService.clean_AncestryForSave(savegame.class.animalCompanion.class.ancestry);
                }
                if (savegame.class.animalCompanion.class?.levels) {
                    savegame.class.animalCompanion.class = animalCompanionsService.clean_LevelsForSave(savegame.class.animalCompanion.class);
                }
                if (savegame.class.animalCompanion.class?.specializations) {
                    savegame.class.animalCompanion.class.specializations.forEach(spec => {
                        spec = animalCompanionsService.clean_SpecializationForSave(spec);
                    })
                }
            }
        }

        //Then go through the whole thing again and compare every object to its Class's default, deleting everything that has the same value as the default.
        savegame = this.clean(savegame);

        return this.save_CharacterToDB(savegame);

    }

    load_Characters(): Observable<string[]> {
        return this.http.get<string[]>(this.server+'/list');
    }

    load_CharacterFromDB(id: string): Observable<string[]> {
        return this.http.get<string[]>(this.server+'/load/' + id);
    }

    delete_CharacterFromDB(savegame: Savegame): Observable<string[]> {
        return this.http.get<string[]>(this.server+'/delete/' + savegame.id);
    }

    save_CharacterToDB(savegame): Observable<string[]> {
        return this.http.post<string[]>(this.server+'/save/', savegame);
    }

    still_loading() {
        return this.loading;
    }

    initialize(characterService: CharacterService) {
        this.loading = true;
        this.load_Characters()
            .subscribe((results: string[]) => {
                this.loader = results;
                this.finish_loading()
                characterService.set_Changed("charactersheet");
            }, (error) => {
                console.log('Error loading characters from database: ' + error.message);
            });
    }

    finish_loading() {
        if (this.loader) {
            this.savegames = [];
            this.loader.forEach(savegame => {
                let newLength = this.savegames.push(new Savegame());
                this.savegames[newLength - 1].id = savegame.id;
                this.savegames[newLength - 1].dbId = savegame._id || "";
                this.savegames[newLength - 1].level = savegame.level || 1;
                this.savegames[newLength - 1].name = savegame.name || "Unnamed";
                if (savegame.class) {
                    this.savegames[newLength - 1].class = savegame.class.name || "";
                    if (savegame.class.ancestry) {
                        this.savegames[newLength - 1].ancestry = savegame.class.ancestry.name || "";
                    }
                    if (savegame.class.heritage) {
                        this.savegames[newLength - 1].heritage = savegame.class.heritage.name || "";
                    }
                }
            });

            this.loader = [];
        }
        if (this.loading) { this.loading = false; }
    }

}
