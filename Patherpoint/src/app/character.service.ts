import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Character } from './Character';
import { Skill } from './Skill';
import { Observable, BehaviorSubject } from 'rxjs';
import { Item } from './Item';
import { Class } from './Class';
import { AbilitiesService } from './abilities.service';
import { SkillsService } from './skills.service';
import { Level } from './Level';
import { ClassesService } from './classes.service';
import { ItemCollection } from './ItemCollection';
import { Armor } from './Armor';
import { Weapon } from './Weapon';
import { FeatsService } from './feats.service';
import { TraitsService } from './traits.service';
import { Ancestry } from './Ancestry';
import { HistoryService } from './history.service';
import { Heritage } from './Heritage';
import { Background } from './Background';
import { ItemsService } from './items.service';
import { Feat } from './Feat';
import { Health } from './Health';
import { Speed } from './Speed';
import { Bulk } from './Bulk';
import { Condition } from './Condition';
import { ConditionsService } from './Conditions.service';
import { ConditionGain } from './ConditionGain';
import { ActivitiesService } from './activities.service';
import { Activity } from './Activity';
import { ActivityGain } from './ActivityGain';
import { SpellsService } from './spells.service';
import { EffectsService } from './effects.service';
import { Effect } from './Effect';
import { Consumable } from './Consumable';
import { TimeService } from './time.service';
import { DefenseService } from './defense.service';
import { Equipment } from './Equipment';
import { EffectGain } from './EffectGain';
import { ItemGain } from './ItemGain';
import { ItemActivity } from './ItemActivity';
import { Rune } from './Rune';
import { DeitiesService } from './deities.service';
import { Deity } from './Deity';
import { AnimalCompanionsService } from './animalcompanions.service';
import { AnimalCompanion } from './AnimalCompanion';
import { AnimalCompanionClass } from './AnimalCompanionClass';
import { BloodlinesService } from './bloodlines.service';
import { Bloodline } from './Bloodline';

@Injectable({
    providedIn: 'root'
})
export class CharacterService {

    private me: Character = new Character();
    public characterChanged$: Observable<boolean>;
    private loader = [];
    private loading: boolean = false;
    private basicItems = []
    private changed: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);

    itemsMenuState: string = 'out';
    characterMenuState: string = 'out';
    companionMenuState: string = 'out';
    spellMenuState: string = 'out';
    conditionsMenuState: string = 'out';

    constructor(
        private http: HttpClient,
        public abilitiesService: AbilitiesService,
        private skillsService: SkillsService,
        private classesService: ClassesService,
        private featsService: FeatsService,
        private traitsService: TraitsService,
        private historyService: HistoryService,
        private conditionsService: ConditionsService,
        public activitiesService: ActivitiesService,
        public itemsService: ItemsService,
        public spellsService: SpellsService,
        public effectsService: EffectsService,
        public timeService: TimeService,
        public defenseService: DefenseService,
        public deitiesService: DeitiesService,
        public bloodlinesService: BloodlinesService,
        public animalCompanionsService: AnimalCompanionsService
    ) { }

    still_loading() {
        return this.loading;
    }

    get_Changed(): Observable<boolean> {
        return this.characterChanged$;
    }
    set_Changed() {
        this.changed.next(true);
    }

    set_Span(name: string) {
        if (document.getElementById(name)) {
            document.getElementById(name).style.gridRow = "span " + this.get_Span(name+"-height");
        }
    }
    
    get_Span(name: string, steps: number = 2) {
        //Calculates the grid-row span according to the height of the element with id=name
        //Returns a number, so don't forget to use "span "+get_Span(...)
        //Steps is how many 50px-rows the element should grow by at once - I prefer 2 steps (100px) for most
        let height = document.getElementById(name).offsetHeight;
        let margin: number = 16;
        let span = Math.ceil((height + margin) / 50 / steps) * steps;
        return span;
    }

    toggleMenu(menu: string = "") {
        switch (menu) {
            case "items":
                this.characterMenuState = 'out';
                this.companionMenuState = 'out';
                this.itemsMenuState = (this.itemsMenuState == 'out') ? 'in' : 'out';
                this.spellMenuState = 'out';
                this.conditionsMenuState = 'out';
                break;
            case "character":
                this.characterMenuState = (this.characterMenuState == 'out') ? 'in' : 'out';
                this.companionMenuState = 'out';
                this.itemsMenuState = 'out';
                this.spellMenuState = 'out';
                this.conditionsMenuState = 'out';
                break;
            case "companion":
                this.characterMenuState = 'out';
                this.companionMenuState = (this.companionMenuState == 'out') ? 'in' : 'out';
                this.itemsMenuState = 'out';
                this.spellMenuState = 'out';
                this.conditionsMenuState = 'out';
                break;
            case "spells":
                this.characterMenuState = 'out';
                this.companionMenuState = 'out';
                this.itemsMenuState = 'out';
                this.spellMenuState = (this.spellMenuState == 'out') ? 'in' : 'out';
                this.conditionsMenuState = 'out';
                break;
            case "conditions":
                this.characterMenuState = 'out';
                this.companionMenuState = 'out';
                this.itemsMenuState = 'out';
                this.spellMenuState = 'out';
                this.conditionsMenuState = (this.conditionsMenuState == 'out') ? 'in' : 'out';
                break;
        }
    }

    get_CharacterMenuState() {
        return this.characterMenuState;
    }

    get_CompanionMenuState() {
        return this.companionMenuState;
    }

    get_ItemsMenuState() {
        return this.itemsMenuState;
    }

    get_SpellMenuState() {
        return this.spellMenuState;
    }

    get_ConditionsMenuState() {
        return this.conditionsMenuState;
    }

    get_Level(number: number) {
        return this.get_Character().class.levels[number];
    }

    get_Creature(type: string) {
        if (type == "Character") {
            return this.get_Character();
        } else if (type == "Companion") {
            return this.get_Companion();
        }
    }

    get_Character() {
        if (!this.still_loading()) {
            return this.me;
        } else { return new Character() }
    }

    get_Companion() {
        return this.get_Character().class.animalCompanion;
    }

    get_Creatures() {
        if (!this.still_loading()) {
            return ([] as (Character|AnimalCompanion)[]).concat(this.get_Character()).concat(this.get_Companion());
        } else { return [new Character()] }
    }

    reset_Character(name: string = "") {
        this.loading = true;
        this.set_Changed();
        this.initialize(name);
    }

    get_Accent() {
        if (!this.still_loading()) {
            function hexToRgb(hex) {
                if (hex.length == 4) {
                    var result = /^#?([a-f\d]{1})([a-f\d]{1})([a-f\d]{1})$/i.exec(hex);
                    return result ? {
                        r: parseInt(result[1] + result[1], 16),
                        g: parseInt(result[2] + result[2], 16),
                        b: parseInt(result[3] + result[3], 16),
                    } : null;
                } else if (hex.length == 7) {
                    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                    return result ? {
                        r: parseInt(result[1], 16),
                        g: parseInt(result[2], 16),
                        b: parseInt(result[3], 16),
                    } : null;
                }
            }
            let original = this.get_Character().settings.accent;
            if (original.length == 4 || original.length == 7) {
                try {
                    let rgba = hexToRgb(original)
                    let result = rgba.r + "," + rgba.g + "," + rgba.b;
                    return result;
                }
                catch (error) {
                    return "25, 118, 210"
                }
            } else {
                return "25, 118, 210";
            }
        }
    }

    get_Classes(name: string) {
        return this.classesService.get_Classes(name);
    }

    get_Ancestries(name: string) {
        this.historyService.get_Ancestries(name)
    }

    get_Speeds(creature: Character|AnimalCompanion, name: string = "") {
        return creature.speeds.filter(speed => speed.name == name || name == "");
    }

    changeClass($class: Class) {
        //Cleanup Heritage, Ancestry, Background and class skills
        this.me.class.on_ChangeHeritage(this);
        this.me.class.on_ChangeAncestry(this);
        this.me.class.on_ChangeBackground(this);
        //Some feats get specially processed when taken.
        //We can't just delete these feats, but must specifically un-take them to undo their effects.
        this.me.class.levels.forEach(level => {
            level.featChoices.filter(choice => choice.available).forEach(choice => {
                choice.feats.forEach(feat => {
                    this.me.take_Feat(this, feat.name, false, choice, false);
                });
            });
        });
        this.me.class.customSkills.forEach(skill => {
            this.me.customSkills = this.me.customSkills.filter(customSkill => customSkill.name != skill.name);
        });
        this.me.class = new Class();
        this.me.class = Object.assign(new Class(), JSON.parse(JSON.stringify($class)));
        this.me.class.reassign();
        //Some feats get specially processed when taken.
        //We have to explicitly take these feats to process them.
        //So we remove them and then "take" them again.
        this.me.class.levels.forEach(level => {
            level.featChoices.forEach(choice => {
                let count: number = 0;
                choice.feats.forEach(feat => {
                    count++;
                    this.me.take_Feat(this, feat.name, true, choice, feat.locked);
                });
                choice.feats.splice(0, count);
            });
        });
        this.me.class.customSkills.forEach(skill => {
            this.me.customSkills.push(Object.assign(new Skill(), skill));
        });
        this.set_Changed();
    }

    change_Ancestry(ancestry: Ancestry, itemsService: ItemsService) {
        this.change_Heritage(new Heritage());
        this.me.class.on_ChangeAncestry(this);
        this.me.class.ancestry = new Ancestry();
        this.me.class.ancestry = Object.assign(new Ancestry(), JSON.parse(JSON.stringify(ancestry)))
        this.me.class.on_NewAncestry(this, itemsService);
        this.set_Changed();
    }

    change_Deity(deity: Deity) {
        this.me.class.on_ChangeDeity(this);
        this.me.class.deity = new Deity();
        this.me.class.deity = Object.assign(new Deity(), JSON.parse(JSON.stringify(deity)))
        this.me.class.on_NewDeity(this);
        this.set_Changed();
    }

    change_Bloodline(bloodline: Bloodline) {
        this.me.class.on_ChangeBloodline(this);
        this.me.class.bloodline = new Bloodline();
        this.me.class.bloodline = Object.assign(new Bloodline(), JSON.parse(JSON.stringify(bloodline)))
        this.me.class.on_NewBloodline(this);
        this.set_Changed();
    }

    change_Heritage(heritage: Heritage) {
        this.me.class.on_ChangeHeritage(this);
        this.me.class.heritage = new Heritage();
        this.me.class.heritage = Object.assign(new Heritage(), JSON.parse(JSON.stringify(heritage)))
        this.me.class.on_NewHeritage(this);
        this.set_Changed();
    }

    change_Background(background: Background) {
        this.me.class.on_ChangeBackground(this);
        this.me.class.background = new Background();
        this.me.class.background = Object.assign(new Background(), JSON.parse(JSON.stringify(background)));
        this.me.class.on_NewBackground(this);
        this.set_Changed();
    }

    get_Items() {
        return this.itemsService.get_Items();
    }

    get_InventoryItems(creature: Character|AnimalCompanion) {
        if (!this.still_loading()) {
            return creature.inventory;
        } else { return new ItemCollection() }
    }

    get_Specializations(group: string = "") {
        return this.itemsService.get_Specializations(group);
    }

    get_InvestedItems(creature: Character|AnimalCompanion) {
        return creature.inventory.allEquipment().filter(item => item.invested)
    }

    create_AdvancedWeaponFeats(advancedWeapons: Weapon[]) {
        //This function depends on the feats and items being loaded, and it will wait forever for them!
        if (this.featsService.still_loading() || this.itemsService.still_loading()) {
            setTimeout(() => {
                this.create_AdvancedWeaponFeats(advancedWeapons);
            }, 500)
        } else {
            let advancedWeapons = this.itemsService.get_ItemType("weapons").filter(weapon => weapon.prof == "Advanced Weapons");
            let advancedWeaponFeats = this.get_Feats().filter(feat => feat.advancedweaponbase);
            advancedWeapons.forEach(weapon => {
                advancedWeaponFeats.forEach(feat => {
                    if (this.me.customFeats.filter(customFeat => customFeat.name == feat.name.replace('Advanced Weapon', weapon.name)).length == 0) {
                        let newLength = this.add_CustomFeat(feat);
                        let newFeat = this.get_Character().customFeats[newLength - 1];
                        newFeat.name = newFeat.name.replace("Advanced Weapon", weapon.name);
                        newFeat.hide = false;
                        newFeat.subType = newFeat.subType.replace("Advanced Weapon", weapon.name);
                        newFeat.desc = newFeat.subType.replace("Advanced Weapon", weapon.name);
                        newFeat.specialreqdesc = newFeat.specialreqdesc.replace("Advanced Weapon", weapon.name);
                        newFeat.gainSkillChoice.forEach(choice => {
                            choice.source = choice.source.replace("Advanced Weapon", weapon.name);
                            choice.increases.forEach(increase => {
                                increase.name = increase.name.replace("Advanced Weapon", weapon.name);
                                increase.source = increase.source.replace("Advanced Weapon", weapon.name);
                            })
                        })
                    }
                })
            })
        }
    }

    grant_InventoryItem(creature: Character|AnimalCompanion, item: Item, resetRunes: boolean = true, changeAfter: boolean = true, equipAfter: boolean = true, amount: number = 1) {
        let newInventoryItem = this.itemsService.initialize_Item(item);
        let returnedInventoryItem;
        //Check if this item already exists in the inventory, and if it is stackable.
        let existingItems = creature.inventory[item.type].filter((existing: Item) =>
            existing.name == item.name && item.can_Stack()
        );
        //If any existing, stackable items are found, try parsing the amount and set it to 1 if failed, then raise the amount on the first of the existing items.
        //The amount must be parsed because it could be set to anything during custom item creation.
        //If no items are found, add the new item to the inventory.
        //Set returnedInventoryItem to either the found or the new item for further processing.
        if (existingItems.length) {
            let intAmount: number = 1
            try {
                intAmount = parseInt(amount.toString())
            } catch (error) {
                intAmount = 1
            }
            existingItems[0].amount += intAmount;
            returnedInventoryItem = existingItems[0];
        } else {
            let newInventoryLength = creature.inventory[item.type].push(newInventoryItem);
            let createdInventoryItem = creature.inventory[item.type][newInventoryLength - 1];
            if (createdInventoryItem.amount && amount > 1) {
                createdInventoryItem.amount += amount - 1;
            }
            if (equipAfter) {
                this.onEquip(creature, createdInventoryItem, true, false);
            }
            returnedInventoryItem = createdInventoryItem;
            if (returnedInventoryItem["prof"] == "Advanced Weapons") {
                this.create_AdvancedWeaponFeats([returnedInventoryItem]);
            }
            if (resetRunes && returnedInventoryItem["moddable"]) {
                if (returnedInventoryItem["potencyRune"]) {
                    returnedInventoryItem["potencyRune"] = 0;
                }
                if (returnedInventoryItem["strikingRune"]) {
                    returnedInventoryItem["strikingRune"] = 0;
                }
                if (returnedInventoryItem["resilientRune"]) {
                    returnedInventoryItem["resilientRune"] = 0;
                }
                if (returnedInventoryItem["propertyRunes"]) {
                    returnedInventoryItem["propertyRunes"].length = 0;
                }
            }
            if (returnedInventoryItem["propertyRunes"] && returnedInventoryItem["propertyRunes"].length) {
                returnedInventoryItem["propertyRunes"].filter((rune: Rune) => rune["loreChoices"]).forEach((rune: Rune) => {
                    this.add_RuneLore(rune as Rune);
                });
            }
        }
        //Add all Items that you get from being granted this one
        if (returnedInventoryItem["gainItems"] && returnedInventoryItem["gainItems"].length) {
            returnedInventoryItem["gainItems"].filter(gainItem => gainItem.on == "grant").forEach(gainItem => {
                let newItem: Item = this.get_Items()[gainItem.type].filter(libraryItem => libraryItem.name == gainItem.name)[0];
                if (newItem.can_Stack()) {
                    this.grant_InventoryItem(creature, newItem, true, false, false, gainItem.amount);
                } else {
                    let equip = true;
                    //Don't equip the new item if it's a shield or armor and this one is too - only one shield or armor can be equipped
                    if ((returnedInventoryItem.type == "armors" || returnedInventoryItem.type == "shields") && newItem.type == returnedInventoryItem.type) {
                        equip = false;
                    }
                    let grantedItem = this.grant_InventoryItem(creature, newItem, true, false, equip);
                    gainItem.id = grantedItem.id;
                    if (grantedItem.get_Name) {
                        grantedItem.displayName = grantedItem.name + " (granted by " + returnedInventoryItem.name + ")"
                    };
                }
            });
        }
        if (changeAfter) {
            this.set_Changed();
        }
        return returnedInventoryItem;
    }

    drop_InventoryItem(creature: Character|AnimalCompanion, item: Item, changeAfter: boolean = true, equipBasicItems: boolean = true, including: boolean = true, amount: number = 1) {
        if (amount < item.amount) {
            item.amount -= amount;
        } else {
            if (item["equipped"]) {
                this.onEquip(creature, item as Equipment, false, false);
            } else if (item["invested"]) {
                this.onInvest(creature, item as Equipment, false, false);
            }
            if (item["propertyRunes"]) {
                item["propertyRunes"].filter((rune: Rune) => rune.loreChoices.length).forEach((rune: Rune) => {
                    this.remove_RuneLore(rune);
                })
            }
            if (item["activities"]) {
                item["activities"].forEach(activity => {
                    if (activity.active) {
                        this.activitiesService.activate_Activity(creature, this, this.timeService, this.itemsService, this.spellsService, activity, activity, false);
                    }
                })
            }
            if (item["gainActivities"]) {
                item["gainActivities"].forEach(gain => {
                    if (gain.active) {
                        this.activitiesService.activate_Activity(creature, this, this.timeService, this.itemsService, this.spellsService, gain, this.activitiesService.get_Activities(gain.name)[0], false);
                    }
                })
            }
            if (including && item["gainItems"] && item["gainItems"].length) {
                item["gainItems"].filter((gainItem: ItemGain) => gainItem.on == "grant").forEach(gainItem => {
                    if (this.get_Items()[gainItem.type].filter((libraryItem: Item) => libraryItem.name == gainItem.name)[0].can_Stack()) {
                        let items: Item[] = creature.inventory[gainItem.type].filter((libraryItem: Item) => libraryItem.name == gainItem.name);
                        if (items.length) {
                            this.drop_InventoryItem(creature, items[0], false, false, true, gainItem.amount);
                        }
                    } else {
                        let items: Item[] = creature.inventory[gainItem.type].filter((libraryItem: Item) => libraryItem.id == gainItem.id);
                        if (items.length) {
                            this.drop_InventoryItem(creature, items[0], false, false, true);
                        }
                        gainItem.id = "";
                    }
                });
            }
            creature.inventory[item.type] = creature.inventory[item.type].filter((any_item: Item) => any_item !== item);
            if (equipBasicItems) {
                this.equip_BasicItems(creature);
            }
        }
        if (changeAfter) {
            this.set_Changed();
        }
    }

    add_RuneLore(rune: Rune) {
        //Then go through all the loreChoices (usually only one)
        rune.loreChoices.forEach(choice => {
            //Check if only one (=this) item's rune has this lore (and therefore no other item has already created it on the character), and if so, create it.
            if (this.get_Character().inventory.allEquipment()
                .filter(item => item.propertyRunes
                    .filter(propertyRune => propertyRune.loreChoices
                        .filter(otherchoice => otherchoice.loreName == choice.loreName)
                        .length)
                    .length)
                .length == 1) {
                this.get_Character().add_Lore(this, choice);
            }
        });
    }

    remove_RuneLore(rune: Rune) {
        //Iterate through the loreChoices (usually only one)
        rune.loreChoices.forEach(choice => {
            //Check if only one item's rune has this lore (and therefore no other rune still needs it created), and if so, remove it.
            if (this.get_Character().inventory.allEquipment()
                .filter(item => item.propertyRunes
                    .filter(propertyRune => propertyRune.loreChoices
                        .filter(otherchoice => otherchoice.loreName == choice.loreName)
                        .length)
                    .length)
                .length == 1) {
                this.get_Character().remove_Lore(this, choice);
            }
        });
    }

    change_Cash(multiplier: number = 1, sum: number, plat: number = 0, gold: number = 0, silver: number = 0, copper: number = 0) {
        if (sum) {
            plat = gold = silver = copper = 0;
            plat = Math.floor(sum / 100000) * 100;
            sum %= 100000;
            gold = Math.floor(sum / 100);
            sum %= 100;
            silver = Math.floor(sum / 10);
            sum %= 10;
            copper = sum;
        }
        if (copper) {
            this.get_Character().cash[3] += (copper * multiplier);
            if (this.get_Character().cash[3] < 0) {
                if (this.get_Character().cash[2] > 0 || this.get_Character().cash[1] > 0 || this.get_Character().cash[0] > 0) {
                    silver += Math.floor(this.get_Character().cash[3] / 10) * multiplier;
                    this.get_Character().cash[3] -= Math.floor(this.get_Character().cash[3] / 10) * 10;
                }
            };
        }
        if (silver) {
            this.get_Character().cash[2] += (silver * multiplier);
            if (this.get_Character().cash[2] < 0) {
                if (this.get_Character().cash[1] > 0 || this.get_Character().cash[0] > 0) {
                    gold += Math.floor(this.get_Character().cash[2] / 10) * multiplier;
                    this.get_Character().cash[2] -= Math.floor(this.get_Character().cash[2] / 10) * 10;
                }
            };
        }
        if (gold) {
            this.get_Character().cash[1] += (gold * multiplier);
            if (this.get_Character().cash[1] < 0) {
                if (this.get_Character().cash[0] > 0) {
                    plat += Math.floor(this.get_Character().cash[1] / 10) * multiplier;
                    this.get_Character().cash[1] -= Math.floor(this.get_Character().cash[1] / 10) * 10;
                }
            };
        }
        if (plat) {
            this.get_Character().cash[0] += (plat * multiplier);
            if (this.get_Character().cash[0] < 0) {
                this.sort_Cash();
            }
        }
    }

    sort_Cash() {
        let sum = (this.get_Character().cash[0] * 1000) + (this.get_Character().cash[1] * 100) + (this.get_Character().cash[2] * 10) + (this.get_Character().cash[3]);
        this.get_Character().cash = [0, 0, 0, 0];
        this.change_Cash(1, sum);
    }

    onEquip(creature: Character|AnimalCompanion, item: Equipment, equipped: boolean = true, changeAfter: boolean = true, equipBasicItems: boolean = true) {
        if ((creature.type == "Character" && item.traits.indexOf("Companion") == -1) || (creature.type == "Companion" && item.traits.indexOf("Companion") > -1) || item.name == "Unarmored") {
            item.equipped = equipped;
            if (item.equipped) {
                if (item.type == "armors" || item.type == "shields") {
                    let allOfType = this.get_InventoryItems(creature)[item.type];
                    allOfType.forEach(typeItem => {
                        this.onEquip(creature, typeItem, false, false, false);
                    });
                    item.equipped = true;
                }
                //If you get an Activity from an item that doesn't need to be invested, immediately invest it in secret so the Activity is gained
                if (item.gainActivities && item.traits.indexOf("Invested") == -1) {
                    this.onInvest(creature, item, true, false);
                }
                //Add all Items that you get from equipping this one
                if (item["gainItems"] && item["gainItems"].length) {
                    item["gainItems"].filter((gainItem: ItemGain) => gainItem.on == "equip").forEach(gainItem => {
                        let newItem: Item = this.itemsService.get_Items()[gainItem.type].filter((libraryItem: Item) => libraryItem.name == gainItem.name)[0]
                        if (newItem.can_Stack()) {
                            this.grant_InventoryItem(creature, newItem, false, false, false, gainItem.amount);
                        } else {
                            let equip = true;
                            //Don't equip the new item if it's a shield or armor and this one is too - only one shield or armor can be equipped
                            if ((item.type == "armors" || item.type == "shields") && newItem.type == item.type) {
                                equip = false;
                            }
                            let grantedItem = this.grant_InventoryItem(creature, newItem, false, false, equip);
                            gainItem.id = grantedItem.id;
                            if (grantedItem.get_Name) {
                                grantedItem.displayName = grantedItem.name + " (granted by " + item.name + ")"
                            };
                        }
                    });
                }
            } else {
                if (equipBasicItems) {
                    this.equip_BasicItems(creature);
                }
                //If you are unequipping a shield, you should also be lowering it and losing cover
                if (item.type == "shields") {
                    item["takingCover"] = false;
                    item["raised"] = false;
                }
                //Same with currently parrying weapons
                if (item.type == "weapons") {
                    item["parrying"] = false;
                }
                //If the item was invested, it isn't now.
                if (item.invested) {
                    this.onInvest(creature, item, false, false);
                }
                if (item["gainItems"] && item["gainItems"].length) {
                    item["gainItems"].filter((gainItem: ItemGain) => gainItem.on == "equip").forEach(gainItem => {
                        if (this.get_Items()[gainItem.type].filter((item: Item) => item.name == gainItem.name)[0].can_Stack()) {
                            let items: Item[] = creature.inventory[gainItem.type].filter((item: Item) => item.name == gainItem.name);
                            if (items.length) {
                                this.drop_InventoryItem(creature, items[0], false, false, true, gainItem.amount);
                            }
                        } else {
                            let items: Item[] = creature.inventory[gainItem.type].filter((item: Item) => item.id == gainItem.id);
                            if (items.length) {
                                this.drop_InventoryItem(creature, items[0], false, false, true);
                            }
                            gainItem.id = "";
                        }
                    });
                }
            }
            if (changeAfter) {
                this.set_Changed();
            }
        }
    }

    onInvest(creature: Character|AnimalCompanion, item: Equipment, invested: boolean = true, changeAfter: boolean = true) {
        item.invested = invested;
        if (item.invested) {
            if (!item.equipped) {
                this.onEquip(creature, item, true, false);
            }
        } else {
            item.gainActivities.forEach((gainActivity: ActivityGain) => {
                this.activitiesService.activate_Activity(creature, this, this.timeService, this.itemsService, this.spellsService, gainActivity, this.activitiesService.get_Activities(gainActivity.name)[0], false);
            });
        }
        if (changeAfter) {
            this.set_Changed();
        }
    }

    on_ConsumableUse(creature: Character|AnimalCompanion, item: Consumable) {
        item.amount--
        this.itemsService.process_Consumable(creature, this, item);
        this.set_Changed();
    }

    grant_BasicItems() {
        //This function depends on the items being loaded, and it will wait forever for them!
        if (this.itemsService.still_loading()) {
            setTimeout(() => {
                this.grant_BasicItems();
            }, 500)
        } else {
            this.basicItems = [];
            let newBasicWeapon: Weapon = Object.assign(new Weapon(), this.itemsService.get_ItemType("weapons", "Fist")[0]);
            this.basicItems.push(newBasicWeapon);
            let newBasicArmor: Armor;
            newBasicArmor = Object.assign(new Armor(), this.itemsService.get_ItemType("armors", "Unarmored")[0]);
            this.basicItems.push(newBasicArmor);
            this.equip_BasicItems(this.get_Character(), false)
            this.equip_BasicItems(this.get_Companion(), false)
        }
    }

    equip_BasicItems(creature: Character|AnimalCompanion, changeAfter: boolean = true) {
        if (!this.still_loading() && this.basicItems.length) {
            if (!creature.inventory.weapons.length && creature.type == "Character") {
                this.grant_InventoryItem(creature, this.basicItems[0], true, false, false);
            }
            if (!creature.inventory.armors.length) {
                this.grant_InventoryItem(creature, this.basicItems[1], true, false, false);
            }
            if (!creature.inventory.weapons.filter(weapon => weapon.equipped == true).length) {
                if (creature.inventory.weapons.length) {
                    this.onEquip(creature, creature.inventory.weapons[0], true, changeAfter);
                }
            }
            if (!creature.inventory.armors.filter(armor => armor.equipped == true).length) {
                this.onEquip(creature, creature.inventory.armors[0], true, changeAfter);
            }
        }
    }

    add_CustomSkill(skillName: string, type: string, abilityName: string) {
        this.me.customSkills.push(new Skill(skillName, type, abilityName));
        //this.set_Changed();
    }

    remove_CustomSkill(oldSkill: Skill) {
        this.me.customSkills = this.me.customSkills.filter(skill => skill !== oldSkill);
        //this.set_Changed();
    }

    add_CustomFeat(oldFeat: Feat) {
        let newLength = this.me.customFeats.push(Object.assign(new Feat(), JSON.parse(JSON.stringify(oldFeat))));
        //this.set_Changed();
        return newLength;
    }

    remove_CustomFeat(oldFeat: Feat) {
        this.me.customFeats = this.me.customFeats.filter(skill => skill !== oldFeat);
        //this.set_Changed();
    }

    get_Conditions(name: string = "", type: string = "") {
        return this.conditionsService.get_Conditions(name, type);
    }

    get_AppliedConditions(creature: Character|AnimalCompanion, name: string = "", source: string = "") {
        //Returns ConditionGain[] with apply=true/false for each
        return this.conditionsService.get_AppliedConditions(creature, this, creature.conditions).filter(condition =>
            (condition.name == name || name == "") &&
            (condition.source == source || source == "")
        );
    }

    add_Condition(creature: Character|AnimalCompanion, conditionGain: ConditionGain, reload: boolean = true) {
        let originalCondition = this.get_Conditions(conditionGain.name)[0];
        //Select boxes turn numbers into strings. We have to turn them back into numbers, but we can't parseInt a number (which Typescript believes this still is)
        //So we turn it into a JSON string and back into a number.
        if (conditionGain.value) {
            conditionGain.value = parseInt(JSON.parse(JSON.stringify(conditionGain.value)));
        }
        let newLength: number = 0;
        if (conditionGain.addValue) {
            let existingConditions = creature.conditions.filter(gain => gain.name == conditionGain.name);
            if (existingConditions.length) {
                existingConditions.forEach(gain => {
                    gain.value += conditionGain.addValue;
                })
            } else {
                conditionGain.value = conditionGain.addValue;
                newLength = creature.conditions.push(conditionGain);
            }
        } else {
            newLength = creature.conditions.push(conditionGain);
        }
        if (newLength) {
            let newConditionGain = creature.conditions[newLength - 1];
            this.conditionsService.process_Condition(creature, this, this.effectsService, conditionGain, this.conditionsService.get_Conditions(conditionGain.name)[0], true);
            originalCondition.gainConditions.forEach(extraCondition => {
                this.add_Condition(creature, Object.assign(new ConditionGain, { name: extraCondition.name, value: extraCondition.value, source: newConditionGain.name, apply: true }), false)
            })
            if (reload) {
                this.set_Changed();
            }
            return newLength;
        }
    }

    remove_Condition(creature: Character|AnimalCompanion, conditionGain: ConditionGain, reload: boolean = true, increaseWounded: boolean = true) {
        let oldConditionGain = creature.conditions.filter($condition => $condition.name == conditionGain.name && $condition.value == conditionGain.value && $condition.source == conditionGain.source);
        let originalCondition = this.get_Conditions(conditionGain.name)[0];
        if (oldConditionGain.length) {
            originalCondition.gainConditions.forEach(extraCondition => {
                this.remove_Condition(creature, Object.assign(new ConditionGain, { name: extraCondition.name, value: extraCondition.value, source: oldConditionGain[0].name }), false, increaseWounded)
            })
            creature.conditions.splice(creature.conditions.indexOf(oldConditionGain[0]), 1)
            this.conditionsService.process_Condition(creature, this, this.effectsService, conditionGain, this.conditionsService.get_Conditions(conditionGain.name)[0], false, increaseWounded);
            if (reload) {
                this.set_Changed();
            }
        }
    }

    process_OnceEffect(creature: Character|AnimalCompanion, effect: EffectGain) {
        let value = 0;
        //Prepare values that can be used in an eval. Add to this list as needed.
        let currentHP = creature.health.currentHP(creature, this, this.effectsService);
        try {
            value = parseInt(eval(effect.value));
        } catch (error) {
            value = 0;
        }
        switch (effect.affected) {
            case "Focus":
                //Give the focus point some time. If a feat expands the focus pool and gives a focus point, the pool is not expanded yet at this point of processing.
                (creature as Character).class.focusPoints += value;
                break;
            case "Temporary HP":
                creature.health.temporaryHP += value;
                break;
            case "HP":
                if (value > 0) {
                    creature.health.heal(creature, this, this.effectsService, value, true)
                } else if (value < 0) {
                    creature.health.takeDamage(creature, this, this.effectsService, -value, false)
                }
                break;
            case "Languages":
                let languages = (creature as Character).class.ancestry.languages;
                for (let index = 0; index < languages.length; index++) {
                    if (languages[index] == "") {
                        languages[index] = (effect.value)
                        break;
                    }
                }
                if (languages.filter(language => language == effect.value).length == 0) {
                    languages.push(effect.value);
                }
                break;
        }
    }

    have_Trait(object: any, traitName: string) {
        return this.traitsService.have_Trait(this, object, traitName);
    }

    get_Abilities(name: string = "") {
        return this.abilitiesService.get_Abilities(name)
    }

    get_Skills(creature: Character|AnimalCompanion, name: string = "", type: string = "") {
        return this.skillsService.get_Skills(creature.customSkills, name, type)
    }

    get_Feats(name: string = "", type: string = "") {
        return this.featsService.get_Feats(this.me.customFeats, name, type);
    }

    get_Features(name: string = "") {
        return this.featsService.get_Features(name);
    }

    get_FeatsAndFeatures(name: string = "", type: string = "") {
        return this.featsService.get_All(this.me.customFeats, name, type);
    }

    get_Health(creature: Character|AnimalCompanion) {
        return creature.health;
    }

    get_AnimalCompanionLevels() {
        return this.animalCompanionsService.get_CompanionLevels();
    }

    process_Feat(featName: string, level: Level, taken: boolean) {
        this.featsService.process_Feat(this, featName, level, taken);
    }

    get_FeatsShowingOn(objectName: string) {
        let feats = this.me.get_FeatsTaken(0, this.me.level, "", "");
        let returnedFeats = []
        if (feats.length) {
            feats.forEach(feat => {
                let returnedFeat = this.get_FeatsAndFeatures(feat.name)[0];
                returnedFeat.showon.split(",").forEach(showon => {
                    if (showon == objectName || showon.substr(1) == objectName || (objectName.indexOf("Lore") > -1 && (showon == "Lore" || showon.substr(1) == "Lore"))) {
                        returnedFeats.push(returnedFeat);
                    }
                })
            });
        }
        return returnedFeats;
    }

    get_ConditionsShowingOn(creature: Character|AnimalCompanion, objectName: string) {
        let conditions = this.get_AppliedConditions(creature).filter(condition => condition.apply);
        if (objectName.indexOf("Lore") > -1) {
            objectName = "Lore";
        }
        let returnedConditions = [];
        if (conditions.length) {
            conditions.forEach(condition => {
                let originalCondition: Condition = this.get_Conditions(condition.name)[0];
                originalCondition.showon.split(",").forEach(showon => {
                    if (showon == objectName || showon.substr(1) == objectName || (objectName == "Lore" && showon.indexOf(objectName) > -1)) {
                        returnedConditions.push(originalCondition);
                    }
                });
            });
        }
        return returnedConditions;
    }

    get_OwnedActivities(creature: Character|AnimalCompanion, levelNumber: number = creature.level) {
        let activities: (ActivityGain | ItemActivity)[] = []
        if (!this.still_loading()) {
            if (creature.type == "Character") {
                activities.push(...(creature as Character).class.activities.filter(gain => gain.level <= levelNumber));
            }
            if (creature.type == "Companion" && creature.class.ancestry.name) {
                activities.push(...(creature as AnimalCompanion).class.ancestry.activities.filter(gain => gain.level <= levelNumber));
            }
            creature.inventory.allEquipment().filter(item => item.equipped && (item.can_Invest() ? item.invested : true) && (item.gainActivities.length || item.activities.length)).forEach(item => {
                if (item.gainActivities.length) {
                    activities.push(...item.gainActivities);
                }
                if (item.activities.length) {
                    activities.push(...item.activities);
                }
            })
            creature.inventory.allEquipment().filter(item => item.propertyRunes.filter(rune => item.equipped && (item.can_Invest() ? item.invested : true) && rune.activities.length).length).forEach(item => {
                item.propertyRunes.filter(rune => rune.activities.length).forEach(rune => {
                    activities.push(...rune.activities);
                })
            })
        }
        return activities;
    }

    get_ActivitiesShowingOn(creature: Character|AnimalCompanion, objectName: string) {
        let activityGains = this.get_OwnedActivities(creature).filter(gain => gain.active);
        let returnedActivities: Activity[] = [];
        activityGains.forEach(gain => {
            this.activitiesService.get_Activities(gain.name).forEach(activity => {
                activity.showon.split(",").forEach(showon => {
                    if (showon == objectName || showon.substr(1) == objectName || (objectName == "Lore" && showon.indexOf(objectName) > -1)) {
                        returnedActivities.push(activity);
                    }
                });
            });
        });
        return returnedActivities;
    }

    get_ItemsShowingOn(creature: Character|AnimalCompanion, objectName: string) {
        let returnedItems: Item[] = [];
        creature.inventory.allEquipment().forEach(item => {
            item.showon.split(",").forEach(showon => {
                if (showon == objectName || showon.substr(1) == objectName || (objectName == "Lore" && showon.indexOf(objectName) > -1)) {
                    returnedItems.push(item);
                }
            });
        });
        return returnedItems;
    }

    get_MaxFocusPoints() {
        let effects: Effect[] = this.effectsService.get_EffectsOnThis(this.get_Character(), "Focus Pool");
        let focusPoints: number = 0;
        effects.forEach(effect => {
            focusPoints += parseInt(effect.value);
        })
        return Math.min(focusPoints, 3);
    }

    get_AC() {
        return this.defenseService.get_AC();
    }

    initialize_AnimalCompanion() {
        if (this.me.class.animalCompanion) {
            this.me.class.animalCompanion = Object.assign(new AnimalCompanion(), this.me.class.animalCompanion);
            this.me.class.animalCompanion.customSkills = this.me.class.animalCompanion.customSkills.map(skill => Object.assign(new Skill(), skill));
            this.me.class.animalCompanion.class = Object.assign(new AnimalCompanionClass(), this.me.class.animalCompanion.class);
            this.me.class.animalCompanion.class.reassign(this);
            this.me.class.animalCompanion.health = Object.assign(new Health(), this.me.class.animalCompanion.health);
            this.me.class.animalCompanion.speeds = this.me.class.animalCompanion.speeds.map(speed => Object.assign(new Speed(), speed));
            this.me.class.animalCompanion.conditions = this.me.class.animalCompanion.conditions.map(condition => Object.assign(new Speed(), condition));
            this.me.class.animalCompanion.bulk = Object.assign(new Bulk(), this.me.class.animalCompanion.bulk);
            this.me.class.animalCompanion.inventory = Object.assign(new ItemCollection(), this.me.class.animalCompanion.inventory);
            this.me.class.animalCompanion.inventory.initialize(this.itemsService);
            this.equip_BasicItems(this.me.class.animalCompanion);
        }
    }

    initialize(charName: string) {
        this.loading = true;
        this.traitsService.initialize();
        this.featsService.initialize();
        this.historyService.initialize();
        this.classesService.initialize();
        this.conditionsService.initialize();
        this.spellsService.initialize();
        this.itemsService.initialize();
        this.effectsService.initialize(this);
        this.deitiesService.initialize();
        this.bloodlinesService.initialize();
        this.animalCompanionsService.initialize();
        if (charName) {
            this.me = new Character();
            this.load_Character(charName)
            .subscribe((results: string[]) => {
                this.loader = results;
                this.finish_loading()
            });
        } else {
            this.me = new Character();
            this.finish_loading();
        }
    }

    load_Character(charName: string): Observable<string[]> {
        return this.http.get<string[]>('/assets/' + charName + '.json');
    }

    finish_loading() {
        if (this.loader) {
            this.me = Object.assign(new Character(), JSON.parse(JSON.stringify(this.loader)));

            //We have loaded the entire character from the file, but everything is object Object.
            //Let's recast all the typed objects:
            if (this.me.customSkills) {
                this.me.customSkills = this.me.customSkills.map(skill => Object.assign(new Skill(), skill));
            } else {
                this.me.customSkills = [];
            }
            
            if (this.me.class) {
                this.me.class = Object.assign(new Class(), this.me.class);
                this.me.class.reassign();
            } else {
                this.me.class = new Class();
            }
            if (this.me.health) {
                this.me.health = Object.assign(new Health(), this.me.health);
            }
            if (this.me.customFeats) {
                this.me.customFeats = this.me.customFeats.map(feat => Object.assign(new Feat(), feat));
            }
            if (this.me.conditions) {
                this.me.conditions = this.me.conditions.map(condition => Object.assign(new Condition(), condition));
            }
            if (this.me.inventory) {
                this.me.inventory = Object.assign(new ItemCollection(), this.me.inventory);
                this.me.inventory.initialize(this.itemsService);
            } else {
                this.me.inventory = new ItemCollection();
            }
            if (this.me.speeds) {
                this.me.speeds = this.me.speeds.map(speed => Object.assign(new Speed(), speed));
            }
            if (this.me.bulk) {
                this.me.bulk = Object.assign(new Bulk(), this.me.bulk);
            }
            if (this.me.class.ancestry) {
                this.me.class.ancestry = Object.assign(new Ancestry(), this.me.class.ancestry);
                this.me.class.ancestry.reassign();
            }
            if (this.me.class.heritage) {
                this.me.class.heritage = Object.assign(new Heritage(), this.me.class.heritage);
                this.me.class.heritage.reassign();
            }
            if (this.me.class.background) {
                this.me.class.background = Object.assign(new Background(), this.me.class.background);
                this.me.class.background.reassign();
            }
            this.initialize_AnimalCompanion();

            this.loader = [];
        }
        if (this.loading) { this.loading = false; }
        this.grant_BasicItems();
        this.characterChanged$ = this.changed.asObservable();
        this.set_Changed();
        this.trigger_FinalChange();
    }

    trigger_FinalChange() {
        if (
            this.traitsService.still_loading() ||
            this.featsService.still_loading() ||
            this.historyService.still_loading() ||
            this.classesService.still_loading() ||
            this.conditionsService.still_loading() ||
            this.spellsService.still_loading() ||
            this.itemsService.still_loading()
        ) {
            setTimeout(() => {
                this.trigger_FinalChange();
            }, 500)
        } else {
            this.set_Changed();
        }
    }

    print() {
        console.log(JSON.stringify(this.me));
    }

}