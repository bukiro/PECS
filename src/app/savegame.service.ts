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
import { AlchemicalBomb } from './AlchemicalBomb';
import { AlchemicalTool } from './AlchemicalTool';
import { Snare } from './Snare';
import { WeaponMaterial } from './WeaponMaterial';
import { ArmorMaterial } from './ArmorMaterial';
import { ShieldMaterial } from './ShieldMaterial';
import { AlchemicalPoison } from './AlchemicalPoison';
import { OtherConsumableBomb } from './OtherConsumableBomb';
import { Wand } from './Wand';
import { Equipment } from './Equipment';
import { ConfigService } from './config.service';

@Injectable({
    providedIn: 'root'
})
export class SavegameService {

    private savegames: Savegame[] = [];
    private loadingError: boolean = false;
    private loading: boolean = false;
    private loader;

    constructor(
        private http: HttpClient,
        private configService: ConfigService
    ) {

    }

    get_Savegames() {
        return this.savegames;
    }

    get_LoadingError() {
        return this.loadingError;
    }

    load_Character(character: Character, itemsService: ItemsService, classesService: ClassesService, historyService: HistoryService, animalCompanionsService: AnimalCompanionsService) {
        //Restore a lot of data from reference objects.
        //This allows us to save a lot of data at saving by removing all data from certain objects that is the same as in their original template.
        character.inventories = character.inventories.map(inventory => Object.assign(new ItemCollection(), inventory));

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
                    character.class.animalCompanion.inventories = character.class.animalCompanion.inventories
                        .map(inventory => Object.assign(new ItemCollection(), inventory));
                }
                if (character.class.animalCompanion?.class?.ancestry) {
                    character.class.animalCompanion.class.ancestry = animalCompanionsService.restore_AncestryFromSave(character.class.animalCompanion.class.ancestry, this);
                }
                if (character.class.animalCompanion?.class?.levels) {
                    character.class.animalCompanion.class = animalCompanionsService.restore_LevelsFromSave(character.class.animalCompanion.class, this);
                }
                if (character.class.animalCompanion.class?.specializations) {
                    character.class.animalCompanion.class.specializations = character.class.animalCompanion.class.specializations
                        .map(spec => animalCompanionsService.restore_SpecializationFromSave(spec, this));
                }
            }
            //Restore the class last, so we don't null its components (ancestry, animal companion etc.)
            character.class = classesService.restore_ClassFromSave(character.class, this);
        }

        character = this.reassign(character, "", itemsService);
        if (character['_id']) {
            delete character['_id'];
        }
        return character;
    }

    classCast(obj: any, className: string) {
        //This function tries to cast an object according to the given class name.
        switch (className) {
            case "AbilityChoice": return Object.assign(new AbilityChoice(), obj);
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
            case "Background": return Object.assign(new Background(), obj);
            case "Bulk": return Object.assign(new Bulk(), obj);
            case "Character": return Object.assign(new Character(), obj);
            case "Class": return Object.assign(new Class(), obj);
            case "ConditionGain": return Object.assign(new ConditionGain(), obj);
            case "Consumable": return Object.assign(new Consumable(), obj);
            case "EffectGain": return Object.assign(new EffectGain(), obj);
            case "Familiar": return Object.assign(new Familiar(), obj);
            case "Feat": return Object.assign(new Feat(), obj);
            case "FeatChoice": return Object.assign(new FeatChoice(), obj);
            case "FormulaChoice": return Object.assign(new FormulaChoice(), obj);
            case "Health": return Object.assign(new Health(), obj);
            case "HeldItem": return Object.assign(new HeldItem(), obj);
            case "Heritage": return Object.assign(new Heritage(), obj);
            case "InventoryGain": return Object.assign(new InventoryGain(), obj);
            case "Item": return Object.assign(new Item(), obj);
            case "ItemActivity": return Object.assign(new ItemActivity(), obj);
            case "ItemCollection": return Object.assign(new ItemCollection(), obj);
            case "ItemGain": return Object.assign(new ItemGain(), obj);
            case "Level": return Object.assign(new Level(), obj);
            case "LoreChoice": return Object.assign(new LoreChoice(), obj);
            case "Oil": return Object.assign(new Oil(), obj);
            case "OtherConsumable": return Object.assign(new OtherConsumable(), obj);
            case "OtherConsumableBomb": return Object.assign(new OtherConsumableBomb(), obj);
            case "OtherItem": return Object.assign(new OtherItem(), obj);
            case "Potion": return Object.assign(new Potion(), obj);
            case "Scroll": return Object.assign(new Scroll(), obj);
            case "Settings": return Object.assign(new Settings(), obj);
            case "Shield": return Object.assign(new Shield(), obj);
            case "ShieldMaterial": return Object.assign(new ShieldMaterial(), obj);
            case "Skill": return Object.assign(new Skill(), obj);
            case "SkillChoice": return Object.assign(new SkillChoice(), obj);
            case "Snare": return Object.assign(new Snare(), obj);
            case "Speed": return Object.assign(new Speed(), obj);
            case "SpellCast": return Object.assign(new SpellCast(), obj);
            case "SpellCasting": return Object.assign(new SpellCasting(obj.castingType), obj);
            case "SpellChoice": return Object.assign(new SpellChoice(), obj);
            case "SpellGain": return Object.assign(new SpellGain(), obj);
            case "Talisman": return Object.assign(new Talisman(), obj);
            case "Weapon": return Object.assign(new Weapon(), obj);
            case "WeaponMaterial": return Object.assign(new WeaponMaterial(), obj);
            case "WeaponRune": return Object.assign(new WeaponRune(), obj);
            case "WornItem": return Object.assign(new WornItem(), obj);
            case "Wand": return Object.assign(new Wand(), obj);
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

    clean(object: any, itemsService: ItemsService) {
        //Only cleanup objects that have Classes (= aren't object Object)
        if (typeof object == "object" && object.constructor !== Object) {
            //If the object is an array, iterate over its elements
            if (Array.isArray(object)) {
                object.forEach((obj: any) => {
                    obj = this.clean(obj, itemsService);
                });
            } else {
                let blank;
                //For items with a refId, don't compare them with blank items, but with their reference item if it exists.
                //If none can be found, the reference item is a blank item of the same class.
                if (object["refId"]) {
                    blank = itemsService.get_CleanItemByID(object.refId);
                }
                if (!blank) {
                    blank = new object.constructor();
                }
                Object.keys(object).forEach(key => {
                    //Delete attributes that are in the "neversave" list, if it exists.
                    if (object["neversave"] && object["neversave"].includes(key)) {
                        delete object[key];
                        //Don't cleanup the "_className" or any attributes that are in the "save" list.
                    } else if (!object["save"]?.includes(key) && (key != "_className") && (key.substr(0, 1) != "$")) {
                        //If the attribute has the same value as the default, delete it from the object.
                        if (JSON.stringify(object[key]) == JSON.stringify(blank[key])) {
                            delete object[key];
                        } else {
                            object[key] = this.clean(object[key], itemsService)
                        }
                        //Cleanup attributes that start with $.
                    } else if (key.substr(0, 1) == "$") {
                        delete object[key];
                    }
                })
                //Delete the "save" list last so it can be referenced during the cleanup, but still updated when loading.
                if (object["save"]) {
                    delete object["save"];
                }
            }
        }
        return object;
    }

    reassign(object: any, keyName: string = "", itemsService: ItemsService = null) {
        //Only objects get reassigned - if they have a _className attribute and aren't null/undefined/empty
        if (typeof object == "object" && object) {
            //If the object is an array, iterate over its elements
            if (Array.isArray(object)) {
                object.forEach((obj: any, index) => {
                    object[index] = this.reassign(obj, keyName + "[" + index + "]", itemsService);
                });
            } else {
                //For items with a refId, merge them with their reference item if it exists.
                if (object.refId && itemsService) {
                    let libraryItem = itemsService.get_CleanItemByID(object.refId);
                    if (libraryItem) {
                        //Map the restored object onto the library object and keep the result.
                        try {
                            object = this.merge(libraryItem, object);
                            object = itemsService.cast_ItemByClassName(object, libraryItem.constructor.name);
                            //Disable any active hint effects when loading an item.
                            if (object.hints?.length) {
                                (object as Equipment).hints?.forEach(hint => {
                                    hint.active = hint.active2 = hint.active3 = hint.active4 = hint.active5 = false;
                                })
                            }
                        } catch (e) {
                            console.log("Failed reassigning item " + object.id + ": " + e)
                        }
                    }
                }
                //If the object is not cast yet, try casting it object as its _className.
                if (object._className && object.constructor.name != object._className) {
                    try {
                        object = this.classCast(object, object._className);
                    } catch (e) {
                        console.log("Failed reassigning " + keyName + ": " + e)
                    }
                }
                Object.keys(object).forEach(key => {
                    object[key] = this.reassign(object[key], key, itemsService)
                })
            }
        }
        return object;
    }

    save_Character(character: Character, itemsService: ItemsService, classesService: ClassesService, historyService: HistoryService, animalCompanionsService: AnimalCompanionsService) {

        let savegame: Character = JSON.parse(JSON.stringify(character));

        //After copying the character into the savegame, we go through all its elements and make sure that they have the correct class.

        savegame = this.reassign(savegame, "", itemsService);

        //Go through all the items, class, ancestry, heritage, background and compare every element to its library equivalent, skipping the properties listed in .save
        //Everything that is the same as the library item gets deleted.
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
        savegame = this.clean(savegame, itemsService);

        return this.save_CharacterToDB(savegame);

    }

    load_Characters(): Observable<string[]> {
        return this.http.get<string[]>(this.configService.dbConnectionURL + '/list');
    }

    load_CharacterFromDB(id: string): Observable<string[]> {
        return this.http.get<string[]>(this.configService.dbConnectionURL + '/load/' + id);
    }

    delete_CharacterFromDB(savegame: Savegame): Observable<string[]> {
        //Why is this a get?
        return this.http.get<string[]>(this.configService.dbConnectionURL + '/delete/' + savegame.id);
    }

    save_CharacterToDB(savegame): Observable<string[]> {
        return this.http.post<string[]>(this.configService.dbConnectionURL + '/save/', savegame);
    }

    still_loading() {
        return this.loading;
    }

    initialize(characterService: CharacterService) {
        this.loading = true;
        characterService.set_Changed("charactersheet");
        characterService.set_Changed("top-bar");
        this.load_Characters()
            .subscribe((results: string[]) => {
                this.loader = results;
                this.finish_loading(characterService)
            }, (error) => {
                console.log('Error loading characters from database: ' + error.message);
                this.savegames = [];
                this.loadingError = true;
                this.loading = false;
                characterService.set_Changed("charactersheet");
                characterService.set_Changed("top-bar");
            });
    }

    finish_loading(characterService: CharacterService) {
        if (this.loader) {
            this.savegames = [];
            this.loader.forEach(savegame => {
                let newLength = this.savegames.push(new Savegame());
                this.savegames[newLength - 1].id = savegame.id;
                this.savegames[newLength - 1].dbId = savegame._id || "";
                this.savegames[newLength - 1].level = savegame.level || 1;
                this.savegames[newLength - 1].name = savegame.name || "Unnamed";
                this.savegames[newLength - 1].partyName = savegame.partyName || "No Party";
                if (savegame.class) {
                    this.savegames[newLength - 1].class = savegame.class.name || "";
                    if (savegame.class.levels?.[1]?.featChoices?.length) {
                        savegame.class.levels[1].featChoices.filter(choice => choice.specialChoice && choice.feats?.length == 1 && choice.available == 1 && choice.source == savegame.class.name).forEach(choice => {
                            let choiceName = choice.feats[0].name.split(":")[0];
                            if (!choiceName.includes("School") && choiceName.includes(choice.type)) {
                                choiceName = choiceName.substr(0, choiceName.length - choice.type.length - 1);
                            }
                            this.savegames[newLength - 1].classChoice = choiceName;
                        });
                    }
                    if (savegame.class.ancestry) {
                        this.savegames[newLength - 1].ancestry = savegame.class.ancestry.name || "";
                    }
                    if (savegame.class.heritage) {
                        this.savegames[newLength - 1].heritage = savegame.class.heritage.name || "";
                    }
                    if (savegame.class.animalCompanion?.class) {
                        this.savegames[newLength - 1].companionName = savegame.class.animalCompanion.name || savegame.class.animalCompanion.type;
                        this.savegames[newLength - 1].companionId = savegame.class.animalCompanion.id;
                    }
                    if (savegame.class.familiar?.originClass) {
                        this.savegames[newLength - 1].familiarName = savegame.class.familiar.name || savegame.class.familiar.type;
                        this.savegames[newLength - 1].familiarId = savegame.class.familiar.id;
                    }
                }
            });

            this.loadingError = false;
            this.loader = [];
        }
        if (this.loading) { this.loading = false; }
        characterService.set_Changed("charactersheet");
        characterService.set_Changed("top-bar");
    }

}
