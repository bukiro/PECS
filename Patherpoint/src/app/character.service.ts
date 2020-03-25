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
import { Shield } from './Shield';
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
import { WornItem } from './WornItem';
import { ActivityGain } from './ActivityGain';
import { SpellsService } from './spells.service';
import { EffectsService } from './effects.service';
import { Effect } from './Effect';
import { AlchemicalElixir } from './AlchemicalElixir';
import { Consumable } from './Consumable';
import { OtherConsumable } from './OtherConsumable';
import { HeldItem } from './HeldItem';
import { TimeService } from './time.service';

@Injectable({
    providedIn: 'root'
})
export class CharacterService {

    private me: Character = new Character();
    public characterChanged$: Observable<boolean>;
    private loader = [];
    private loading: Boolean = false;
    private basicItems = []
    private changed: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);

    itemsMenuState: string = 'out';
    characterMenuState: string = 'out';
    spellMenuState: string = 'out';
    conditionsMenuState: string = 'out';

    constructor(
        private http: HttpClient,
        private abilitiesService: AbilitiesService,
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
        public timeService: TimeService
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

    toggleMenu(menu: string = "") {
        switch (menu) {
            case "items":
                this.characterMenuState = 'out';
                this.itemsMenuState = (this.itemsMenuState == 'out') ? 'in' : 'out';
                this.spellMenuState = 'out';
                this.conditionsMenuState = 'out';
                break;
            case "character":
                this.characterMenuState = (this.characterMenuState == 'out') ? 'in' : 'out';
                this.itemsMenuState = 'out';
                this.spellMenuState = 'out';
                this.conditionsMenuState = 'out';
                break;
            case "spells":
                this.characterMenuState = 'out';
                this.itemsMenuState = 'out';
                this.spellMenuState = (this.spellMenuState == 'out') ? 'in' : 'out';
                this.conditionsMenuState = 'out';
                break;
            case "conditions":
                this.characterMenuState = 'out';
                this.itemsMenuState = 'out';
                this.spellMenuState = 'out';
                this.conditionsMenuState = (this.conditionsMenuState == 'out') ? 'in' : 'out';
                break;
        }
    }

    get_CharacterMenuState() {
        return this.characterMenuState;
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

    get_Character() {
        if (!this.still_loading()) {
            return this.me;
        } else { return new Character() }
    }

    get_Accent(hover: boolean = false) {
        if (!this.still_loading()) {
            if (hover) {
                function hexToRgb(hex) {
                    if (hex.length == 4) {
                        var result = /^#?([a-f\d]{1})([a-f\d]{1})([a-f\d]{1})$/i.exec(hex);
                        return result ? {
                            r: parseInt(result[1] + result[1], 16),
                            g: parseInt(result[2] + result[2], 16),
                            b: parseInt(result[3] + result[3], 16),
                            a: 0.8
                        } : null;
                    } else if (hex.length == 7) {
                        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                        return result ? {
                            r: parseInt(result[1], 16),
                            g: parseInt(result[2], 16),
                            b: parseInt(result[3], 16),
                            a: 0.8
                        } : null;
                    }
                }
                let original = this.get_Character().settings.accent;
                if (original.length == 4 || original.length == 7) {
                    let rgba = hexToRgb(original)
                    let result = "rgba(" + rgba.r + "," + rgba.g + "," + rgba.b + "," + rgba.a + ")";
                    return result;
                } else {
                    return this.get_Character().settings.accent;
                }
            } else {
                return this.get_Character().settings.accent;
            }

        }
    }

    get_Classes(name: string) {
        return this.classesService.get_Classes(name);
    }

    get_Ancestries(name: string) {
        this.historyService.get_Ancestries(name)
    }

    get_Speeds(name: string = "") {
        return this.me.speeds.filter(speed => speed.name == name || name == "");
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

    get_InventoryItems() {
        if (!this.still_loading()) {
            return this.me.inventory;
        } else { return new ItemCollection() }
    }

    get_InvestedItems() {
        return this.me.inventory.allEquipment().filter(item => item.invested)
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

    grant_InventoryItem(item: Item, changeAfter: boolean = true) {
        let newInventoryItem;
        switch (item.type) {
            case "weapons":
                newInventoryItem = Object.assign(new Weapon(), item);
                break;
            case "armors":
                newInventoryItem = Object.assign(new Armor(), item);
                break;
            case "shields":
                newInventoryItem = Object.assign(new Shield(), item);
                break;
            case "wornitems":
                newInventoryItem = Object.assign(new WornItem(), item);
                break;
            case "helditems":
                newInventoryItem = Object.assign(new HeldItem(), item);
                break;
            case "alchemicalelixirs":
                newInventoryItem = Object.assign(new AlchemicalElixir(), item);
                break;
            case "otherconsumables":
                newInventoryItem = Object.assign(new OtherConsumable(), item);
                break;
        }
        let existingItems = this.me.inventory[item.type].filter(existing => existing.name == item.name && existing.amount != undefined);
        if (existingItems.length) {
            existingItems.forEach(existing => {
                existing.amount++
            })
        } else {
            let newInventoryLength = this.me.inventory[item.type].push(newInventoryItem);
            this.onEquip(this.me.inventory[item.type][newInventoryLength - 1], true, false);
        }
        if (changeAfter) {
            this.set_Changed();
        }
    }

    drop_InventoryItem(item: Item, changeAfter: boolean = true) {
        if (item.equip) {
            this.onEquip(item, false, false);
        } else if (item.invested) {
            this.onInvest(item, false, false);
        }
        this.me.inventory[item.type] = this.me.inventory[item.type].filter(any_item => any_item !== item);
        this.equip_BasicItems();
        if (changeAfter) {
            this.set_Changed();
        }
    }

    onEquip(item: Item, equipped: boolean = true, changeAfter: boolean = true) {
        item.equip = equipped;
        if (item.equip) {
            if (item.type == "armors" || item.type == "shields") {
                let allOfType = this.get_InventoryItems()[item.type];
                allOfType.forEach(typeItem => {
                    typeItem.equip = false;
                });
                item.equip = true;
            }
            //If you get an Activity from an item that doesn't need to be invested, immediately invest it in secret so the Activity is gained
            if (item.gainActivity && item.traits.indexOf("Invested") == -1) {
                this.onInvest(item, true, false);
            }
            if (item["gainItems"] && item["gainItems"].length) {
                item["gainItems"].forEach(gainItem => {
                    let item: Item = this.itemsService.get_Items()[gainItem.type].filter(item => item.name == gainItem.name)[0];
                    this.grant_InventoryItem(item, false);
                });
            }
        } else {
            this.equip_BasicItems();
            //If you are unequipping a shield, you should also be lowering it and losing cover
            if (item.type == "shields") {
                item["takingCover"] = false;
                item["raised"] = false;
            }
            //Same with currently parrying weapons
            if (item.type == "weapons") {
                item["parrying"] = false;
            }
            //Also armor, even though cover is independent from armor (but we are tracking cover on the armor and we don't want it to change between equipment changes)
            if (item.type == "armors") {
                item["cover"] = 0;
            }
            //If the item was invested, it isn't now.
            if (item.invested) {
                this.onInvest(item, false, false);
            }
            if (item["gainItems"] && item["gainItems"].length) {
                item["gainItems"].forEach(gainItem => {
                    let items: Item[] = this.get_InventoryItems()[gainItem.type].filter(item => item.name == gainItem.name);
                    if (items.length) {
                        this.drop_InventoryItem(items[0], false);
                    }
                });
            }
        }
        if (changeAfter) {
            this.set_Changed();
        }
    }

    onInvest(item: Item, invested: boolean = true, changeAfter: boolean = true) {
        item.invested = invested;
        if (item.invested) {
            item.gainActivity.forEach(gainActivity => {
                this.me.gain_Activity(Object.assign(new ActivityGain(), { name: gainActivity, source: item.name }));
            });
            if (!item.equip) {
                this.onEquip(item, true, false);
            }
        } else {
            item.gainActivity.forEach(gainActivity => {
                let oldGain = this.me.class.activities.filter(gain => gain.name == gainActivity && gain.source == item.name);
                if (oldGain.length) {
                    this.me.lose_Activity(this, this.timeService, this.itemsService, this.activitiesService, oldGain[0]);
                }
            });
        }
        if (changeAfter) {
            this.set_Changed();
        }
    }

    on_ConsumableUse(item: Consumable) {
        item.amount--
        this.itemsService.process_Consumable(this, item);
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
            this.equip_BasicItems(false)
        }
    }

    equip_BasicItems(changeAfter: boolean = true) {
        if (!this.still_loading() && this.basicItems.length) {
            if (!this.get_InventoryItems().weapons.length) {
                this.grant_InventoryItem(this.basicItems[0]);
            }
            if (!this.get_InventoryItems().armors.length) {
                this.grant_InventoryItem(this.basicItems[1]);
            }
            if (!this.get_InventoryItems().weapons.filter(weapon => weapon.equip == true).length) {
                this.onEquip(this.get_InventoryItems().weapons[0], true, changeAfter);
            }
            if (!this.get_InventoryItems().armors.filter(armor => armor.equip == true).length) {
                this.onEquip(this.get_InventoryItems().armors[0], true, changeAfter);
            }
        }
    }

    add_CustomSkill(skillName: string, type: string, abilityName: string) {
        this.me.customSkills.push(new Skill(skillName, type, abilityName));
        this.set_Changed();
    }

    remove_CustomSkill(oldSkill: Skill) {
        this.me.customSkills = this.me.customSkills.filter(skill => skill !== oldSkill);
        this.set_Changed();
    }

    add_CustomFeat(oldFeat: Feat) {
        let newLength = this.me.customFeats.push(Object.assign(new Feat(), JSON.parse(JSON.stringify(oldFeat))));
        this.set_Changed();
        return newLength;
    }

    remove_CustomFeat(oldFeat: Feat) {
        this.me.customFeats = this.me.customFeats.filter(skill => skill !== oldFeat);
        this.set_Changed();
    }

    get_Conditions(name: string = "", type: string = "") {
        return this.conditionsService.get_Conditions(name, type);
    }

    get_AppliedConditions(name: string = "", source: string = "") {
        //Returns ConditionGain[] with apply=true/false for each
        return this.conditionsService.get_AppliedConditions(this, this.me.conditions).filter(condition =>
            (condition.name == name || name == "") &&
            (condition.source == source || source == "")
        );
    }

    add_Condition(conditionGain: ConditionGain, reload: boolean = true) {
        let originalCondition = this.get_Conditions(conditionGain.name)[0];
        //Select boxes turn numbers into strings. We have to turn them back into numbers, but we can't parseInt a number (which Typescript believes this still is)
        //So we turn it into a JSON string and back into a number.
        if (conditionGain.value) {
            conditionGain.value = parseInt(JSON.parse(JSON.stringify(conditionGain.value)));
        }
        let newLength = this.me.conditions.push(conditionGain);
        let newConditionGain = this.me.conditions[newLength - 1];
        this.conditionsService.process_Condition(this, this.effectsService, conditionGain, this.conditionsService.get_Conditions(conditionGain.name)[0], true);
        originalCondition.gainConditions.forEach(extraCondition => {
            this.add_Condition(Object.assign(new ConditionGain, { name: extraCondition.name, value: extraCondition.value, source: newConditionGain.name, apply: true }), false)
        })
        if (reload) {
            this.set_Changed();
        }
        return newLength;
    }

    remove_Condition(conditionGain: ConditionGain, reload: boolean = true) {
        let oldConditionGain = this.me.conditions.filter($condition => $condition.name == conditionGain.name && $condition.value == conditionGain.value && $condition.source == conditionGain.source);
        let originalCondition = this.get_Conditions(conditionGain.name)[0];
        if (oldConditionGain.length) {
            originalCondition.gainConditions.forEach(extraCondition => {
                this.remove_Condition(Object.assign(new ConditionGain, { name: extraCondition.name, value: extraCondition.value, source: oldConditionGain[0].name }), false)
            })
            this.me.conditions.splice(this.me.conditions.indexOf(oldConditionGain[0]), 1)
            this.conditionsService.process_Condition(this, this.effectsService, conditionGain, this.conditionsService.get_Conditions(conditionGain.name)[0], false);
            if (reload) {
                this.set_Changed();
            }
        }
    }

    have_Trait(object: any, traitName: string) {
        return this.traitsService.have_Trait(object, traitName);
    }

    get_Abilities(name: string = "") {
        return this.abilitiesService.get_Abilities(name)
    }

    get_Skills(name: string = "", type: string = "") {
        return this.skillsService.get_Skills(this.me.customSkills, name, type)
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

    get_Health() {
        return this.me.health;
    }

    process_Feat(featName: string, level: Level, taken: boolean) {
        this.featsService.process_Feat(this, featName, level, taken);
    }

    get_FeatsShowingOn(objectName: string) {
        let feats = this.me.get_FeatsTaken(0, this.me.level, "", "");
        if (objectName.indexOf("Lore") > -1) {
            objectName = "Lore";
        }
        let returnedFeats = []
        if (feats.length) {
            feats.forEach(feat => {
                let returnedFeat = this.get_FeatsAndFeatures(feat.name)[0];
                returnedFeat.showon.split(",").forEach(showon => {
                    if (showon == objectName || showon.substr(1) == objectName || (objectName == "Lore" && showon.indexOf(objectName) > -1)) {
                        returnedFeats.push(returnedFeat);
                    }
                })
            });
        }
        return returnedFeats;
    }

    get_ConditionsShowingOn(objectName: string) {
        let conditions = this.get_AppliedConditions().filter(condition => condition.apply);
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

    get_Activities() {
        return this.me.class.activities;
    }

    get_ActivitiesShowingOn(objectName: string) {
        let activityGains = this.me.class.activities.filter(gain => gain.active);
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

    get_ItemsShowingOn(objectName: string) {
        let returnedItems: Item[] = [];
        this.me.inventory.allEquipment().forEach(item => {
            item.showon.split(",").forEach(showon => {
                if (showon == objectName || showon.substr(1) == objectName || (objectName == "Lore" && showon.indexOf(objectName) > -1)) {
                    returnedItems.push(item);
                }
            });
        });
        return returnedItems;
    }

    get_MaxFocusPoints() {
        let effects: Effect[] = this.effectsService.get_EffectsOnThis("Focus Pool");
        let focusPoints: number = 0;
        effects.forEach(effect => {
            focusPoints += parseInt(effect.value);
        })
        return Math.min(focusPoints, 3);
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
        this.load_Character(charName)
            .subscribe((results: string[]) => {
                this.loader = results;
                this.finish_loading()
            });
    }

    load_Character(charName: string): Observable<string[]> {
        return this.http.get<string[]>('/assets/' + charName + '.json');
    }

    finish_loading() {
        if (this.loader) {
            this.me = Object.assign(new Character(), JSON.parse(JSON.stringify(this.loader)));

            //We have loaded the entire character from the file, but everything is object Object.
            //Let's recast all the typed objects:
            this.me.customSkills = this.me.customSkills.map(skill => Object.assign(new Skill(), skill));
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
                this.me.inventory.weapons = this.me.inventory.weapons.map(weapon => Object.assign(new Weapon(), weapon));
                this.me.inventory.armors = this.me.inventory.armors.map(armor => Object.assign(new Armor(), armor));
                this.me.inventory.shields = this.me.inventory.shields.map(shield => Object.assign(new Weapon(), shield));
                this.me.inventory.wornitems = this.me.inventory.wornitems.map(wornitem => Object.assign(new WornItem(), wornitem));
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

            this.loader = [];
        }
        if (this.loading) { this.loading = false; }
        this.grant_BasicItems();
        this.characterChanged$ = this.changed.asObservable();
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