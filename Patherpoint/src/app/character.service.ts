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
import { Condition } from './Condition';
import { ConditionsService } from './conditions.service';
import { ConditionGain } from './ConditionGain';
import { ActivitiesService } from './activities.service';
import { Activity } from './Activity';
import { ActivityGain } from './ActivityGain';
import { SpellsService } from './spells.service';
import { EffectsService } from './effects.service';
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
import { Familiar } from './Familiar';
import { SavegameService } from './savegame.service';
import { FamiliarsService } from './familiars.service';
import { FeatChoice } from './FeatChoice';
import { InventoryGain } from './InventoryGain';
import { Oil } from './Oil';
import { WornItem } from './WornItem';
import { Savegame } from './Savegame';
import { FeatTaken } from './FeatTaken';

@Injectable({
    providedIn: 'root'
})
export class CharacterService {

    private me: Character = new Character();
    public characterChanged$: Observable<string>;
    public viewChanged$: Observable<{creature: string, target: string}>;
    private loader = [];
    private loading: boolean = false;
    private basicItems = []
    private toChange: {creature: string, target: string}[] = [];
    private changed: BehaviorSubject<string> = new BehaviorSubject<string>("");
    private viewChanged: BehaviorSubject<{creature: string, target: string}> = new BehaviorSubject<{creature: string, target: string}>({target: "", creature: ""});
    
    itemsMenuState: string = 'out';
    itemsMenuTarget: string = 'Character';
    characterMenuState: string = 'out';
    companionMenuState: string = 'out';
    familiarMenuState: string = 'out';
    spellMenuState: string = 'out';
    spelllibraryMenuState: string = 'out';
    conditionsMenuState: string = 'out';

    constructor(
        private savegameService: SavegameService,
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
        public animalCompanionsService: AnimalCompanionsService,
        public familiarsService: FamiliarsService
    ) { }

    still_loading() {
        return this.loading;
    }

    get_Changed(): Observable<string> {
        return this.characterChanged$;
    }

    get_ViewChanged(): Observable<{creature: string, target: string}> {
        return this.viewChanged$;
    }

    set_ToChange(creature: string = "Character", target: string = "all") {
        target = target || "all";
        this.toChange.push({target:target, creature:creature});
    }

    process_ToChange() {
        ["Character", "Companion", "Familiar"].forEach(creature => {
            if (this.toChange.find(view => view.creature == creature && view.target == "all")) {
                this.toChange == this.toChange.filter(view => view.creature != creature)
                this.set_ViewChanged({target:"all", creature:creature});
            } else {
                let unique: string[] = this.toChange.filter(view => view.creature == creature).map(view => JSON.stringify(view))
                unique = Array.from(new Set(unique));
                unique.map(view => JSON.parse(view)).forEach(view => {
                    this.set_ViewChanged(view);
                });
                this.toChange = this.toChange.filter(view => view.creature != creature);
            }
        })
    }

    set_ViewChanged(view: {creature: string, target: string}) {
        this.viewChanged.next(view);
    }

    set_Changed(target: string = "all") {
        target = target || "all";
        this.changed.next(target);
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

    toggleMenu(menu: string = "", parameter: string = "") {
        switch (menu) {
            case "character":
                this.characterMenuState = (this.characterMenuState == 'out') ? 'in' : 'out';
                this.companionMenuState = 'out';
                this.familiarMenuState = 'out';
                this.itemsMenuState = 'out';
                this.spellMenuState = 'out';
                this.spelllibraryMenuState = 'out';
                this.conditionsMenuState = 'out';
                if (this.characterMenuState == 'in') {
                    this.set_Changed("charactersheet");
                }
                break;
            case "companion":
                this.characterMenuState = 'out';
                this.companionMenuState = (this.companionMenuState == 'out') ? 'in' : 'out';
                this.familiarMenuState = 'out';
                this.itemsMenuState = 'out';
                this.spellMenuState = 'out';
                this.spelllibraryMenuState = 'out';
                this.conditionsMenuState = 'out';
                if (this.companionMenuState == 'in') {
                    this.set_Changed("Companion");
                }
                break;
            case "familiar":
                this.characterMenuState = 'out';
                this.companionMenuState = 'out';
                this.familiarMenuState = (this.familiarMenuState == 'out') ? 'in' : 'out';
                this.itemsMenuState = 'out';
                this.spellMenuState = 'out';
                this.spelllibraryMenuState = 'out';
                this.conditionsMenuState = 'out';
                if (this.familiarMenuState == 'in') {
                    this.set_Changed("Familiar");
                }
                break;
            case "items":
                this.characterMenuState = 'out';
                this.companionMenuState = 'out';
                this.familiarMenuState = 'out';
                this.itemsMenuState = (this.itemsMenuState == 'out') ? 'in' : 'out';
                this.spellMenuState = 'out';
                this.spelllibraryMenuState = 'out';
                this.conditionsMenuState = 'out';
                if (this.itemsMenuState == 'in') {
                    this.set_Changed("items");
                }
                break;
            case "spells":
                this.characterMenuState = 'out';
                this.companionMenuState = 'out';
                this.familiarMenuState = 'out';
                this.itemsMenuState = 'out';
                this.spellMenuState = (this.spellMenuState == 'out') ? 'in' : 'out';
                this.spelllibraryMenuState = 'out';
                this.conditionsMenuState = 'out';
                if (this.spellMenuState == 'in') {
                    this.set_Changed("spells");
                }
                break;
            case "spelllibrary":
                this.characterMenuState = 'out';
                this.companionMenuState = 'out';
                this.familiarMenuState = 'out';
                this.itemsMenuState = 'out';
                this.spellMenuState = 'out';
                this.spelllibraryMenuState = (this.spelllibraryMenuState == 'out') ? 'in' : 'out';
                this.conditionsMenuState = 'out';
                if (this.spelllibraryMenuState == 'in') {
                    this.set_Changed("spelllibrary");
                }
                break;
            case "conditions":
                this.characterMenuState = 'out';
                this.companionMenuState = 'out';
                this.familiarMenuState = 'out';
                this.itemsMenuState = 'out';
                this.spellMenuState = 'out';
                this.spelllibraryMenuState = 'out';
                this.conditionsMenuState = (this.conditionsMenuState == 'out') ? 'in' : 'out';
                if (this.conditionsMenuState == 'in') {
                    this.set_Changed("conditions");
                }
                break;
        }
        this.set_Changed("top-bar");
    }

    get_CharacterMenuState() {
        return this.characterMenuState;
    }

    get_CompanionMenuState() {
        return this.companionMenuState;
    }

    get_FamiliarMenuState() {
        return this.familiarMenuState;
    }

    get_ItemsMenuState() {
        return this.itemsMenuState;
    }

    get_SpellMenuState() {
        return this.spellMenuState;
    }

    get_SpellLibraryMenuState() {
        return this.spelllibraryMenuState;
    }

    get_ConditionsMenuState() {
        return this.conditionsMenuState;
    }

    get_ItemsMenuTarget() {
        return this.itemsMenuTarget;
    }

    set_ItemsMenuTarget(target: string) {
        this.itemsMenuTarget = target;
        this.set_Changed("itemstore");
    }

    get_Level(number: number) {
        return this.get_Character().class.levels[number];
    }

    get_Creature(type: string) {
        switch (type) {
            case "Character":
                return this.get_Character();
            case "Companion":
                return this.get_Companion();
            case "Familiar":
                return this.get_Familiar();
            default:
                return new Character();
        }
    }

    get_Character() {
        if (!this.still_loading()) {
            return this.me;
        } else { return new Character() }
    }

    get_CompanionAvailable(minLevelNumber: number = 1, maxLevelNumber: number = this.get_Character().level) {
        //Return the number of feats taken this level that granted you an animal companion
        return this.get_Character().get_FeatsTaken(minLevelNumber, maxLevelNumber).filter(gain => this.get_FeatsAndFeatures(gain.name)[0]?.gainAnimalCompanion == 1).length
    }
    
    get_FamiliarAvailable() {
        return this.get_Character().get_FeatsTaken(1, this.get_Character().level).filter(gain => this.get_FeatsAndFeatures(gain.name)[0]?.gainFamiliar).length
    }

    get_Companion() {
        return this.get_Character().class.animalCompanion;
    }

    get_Familiar() {
        return this.get_Character().class.familiar;
    }

    get_Creatures() {
        if (!this.still_loading()) {
            let companionAvailable = this.get_CompanionAvailable();
            let familiarAvailable = this.get_FamiliarAvailable();
            if (companionAvailable && familiarAvailable) {
                return ([] as (Character|AnimalCompanion|Familiar)[]).concat(this.get_Character()).concat(this.get_Companion()).concat(this.get_Familiar());
            } else if (companionAvailable) {
                return ([] as (Character|AnimalCompanion|Familiar)[]).concat(this.get_Character()).concat(this.get_Companion());
            } else if (familiarAvailable) {
                return ([] as (Character|AnimalCompanion|Familiar)[]).concat(this.get_Character()).concat(this.get_Familiar());
            } else {
                return ([] as (Character|AnimalCompanion|Familiar)[]).concat(this.get_Character());
            }
        } else { return [new Character()] }
    }

    reset_Character(id: string = "") {
        this.loading = true;
        this.initialize(id);
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

    get_Deities(name: string = "") {
        return this.deitiesService.get_Deities(name);
    }

    get_Speeds(creature: Character|AnimalCompanion|Familiar, name: string = "") {
        return creature.speeds.filter(speed => speed.name == name || name == "");
    }

    update_LanguageList() {
        //This function is called by the effects service after generating effects, so that new languages aren't thrown out before the effects are generated.
        let character = this.get_Character();
        //Ensure that the language list is always as long as ancestry languages + INT + any relevant feats.
        if (character.class.name) {
            let ancestry: Ancestry = character.class.ancestry;
            let languages: number = character.class.languages.length || 0;
            let maxLanguages: number = ancestry?.baseLanguages || 0;
            let int = this.get_Abilities("Intelligence")[0]?.mod(character, this, this.effectsService)?.result;
            if (int > 0) {
                maxLanguages += int;
            }
            this.effectsService.get_AbsolutesOnThis(this.get_Character(), "Max Languages").forEach(effect => {
                maxLanguages = parseInt(effect.setValue);
            })
            this.effectsService.get_RelativesOnThis(this.get_Character(), "Max Languages").forEach(effect => {
                maxLanguages += parseInt(effect.value);
            })
            let oldLanguages = JSON.stringify(character.class.languages);
            character.class.languages = character.class.languages.sort().filter(language => language != "");
            languages = character.class.languages.length;
            if (languages > maxLanguages) {
                character.class.languages.splice(maxLanguages);
            } else {
                while (languages < maxLanguages) {
                    languages = character.class.languages.push("");
                }
            }
            //If the language list has changed, update the character sheet.
            if (oldLanguages != JSON.stringify(character.class.languages)) {
                this.set_ToChange("Character", "charactersheet");
            }
        }
    }

    change_Class($class: Class) {
        //Cleanup Heritage, Ancestry, Background and class skills
        this.me.class.on_ChangeHeritage(this);
        this.me.class.on_ChangeAncestry(this);
        this.me.class.on_ChangeBackground(this);
        this.me.class.on_ChangeClass(this);
        this.me.class = new Class();
        this.me.class = Object.assign(new Class(), JSON.parse(JSON.stringify($class)));
        this.me.class = this.reassign(this.me.class);
        this.me.class.on_NewClass(this, this.itemsService);
        this.get_Character().get_FeatsTaken(1, this.get_Character().level).map((gain: FeatTaken) => this.get_FeatsAndFeatures(gain.name)[0])
            .filter((feat: Feat) => feat?.onceEffects.length).forEach(feat => {
                feat.onceEffects.forEach(effect => {
                    this.process_OnceEffect(this.get_Character(), effect);
                })
            })
        this.set_Changed();
    }

    change_Ancestry(ancestry: Ancestry, itemsService: ItemsService) {
        this.change_Heritage(new Heritage());
        this.me.class.on_ChangeAncestry(this);
        this.me.class.ancestry = new Ancestry();
        this.me.class.ancestry = Object.assign(new Ancestry(), JSON.parse(JSON.stringify(ancestry)))
        this.me.class.ancestry = this.reassign(this.me.class.ancestry);
        this.me.class.on_NewAncestry(this, itemsService);
        this.set_Changed();
    }

    change_Deity(deity: Deity) {
        this.me.class.on_ChangeDeity(this, this.deitiesService, this.me.class.deity);
        this.me.class.deity = deity.name;
        this.me.class.on_NewDeity(this, this.deitiesService, this.me.class.deity);
        this.set_Changed();
    }

    change_Heritage(heritage: Heritage) {
        this.me.class.on_ChangeHeritage(this);
        this.me.class.heritage = new Heritage();
        this.me.class.heritage = Object.assign(new Heritage(), JSON.parse(JSON.stringify(heritage)))
        this.me.class.heritage = this.reassign(this.me.class.heritage);
        this.me.class.on_NewHeritage(this, this.itemsService);
        this.set_Changed();
    }

    change_Background(background: Background) {
        this.me.class.on_ChangeBackground(this);
        this.me.class.background = new Background();
        this.me.class.background = Object.assign(new Background(), JSON.parse(JSON.stringify(background)));
        this.me.class.background = this.reassign(this.me.class.background);
        this.me.class.on_NewBackground(this);
        this.set_Changed();
    }

    get_Items() {
        return this.itemsService.get_Items();
    }

    get_Inventories(creature: Character|AnimalCompanion|Familiar) {
        if (!this.still_loading()) {
            return creature.inventories;
        } else { return [new ItemCollection()] }
    }

    get_Specializations(group: string = "") {
        return this.itemsService.get_Specializations(group);
    }

    get_InvestedItems(creature: Character|AnimalCompanion|Familiar) {
        return creature.inventories[0].allEquipment().filter(item => item.invested && item.traits.includes("Invested"));
    }

    create_AdvancedWeaponFeats(advancedWeapons: Weapon[]) {
        //This function depends on the feats and items being loaded, and it will wait forever for them!
        if (this.featsService.still_loading() || this.itemsService.still_loading()) {
            setTimeout(() => {
                this.create_AdvancedWeaponFeats(advancedWeapons);
            }, 500)
        } else {
            if (!advancedWeapons.length) {
                advancedWeapons = this.itemsService.get_ItemsOfType("weapons").filter(weapon => weapon.prof == "Advanced Weapons");
            }
            let advancedWeaponFeats = this.get_Feats().filter(feat => feat.advancedweaponbase);
            advancedWeapons.forEach(weapon => {
                advancedWeaponFeats.forEach(feat => {
                    if (!this.get_Feats().find(libraryFeat => libraryFeat.name == feat.name.replace('Advanced Weapon', weapon.name)) &&
                    !this.me.customFeats.find(customFeat => customFeat.name == feat.name.replace('Advanced Weapon', weapon.name))) {
                        let newLength = this.add_CustomFeat(feat);
                        let newFeat = this.get_Character().customFeats[newLength - 1];
                        newFeat.name = newFeat.name.replace("Advanced Weapon", weapon.name);
                        newFeat.hide = false;
                        newFeat.advancedweaponbase = false;
                        newFeat.subType = newFeat.subType.replace("Advanced Weapon", weapon.name);
                        newFeat.desc = newFeat.desc.replace("Advanced Weapon", weapon.name);
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

    grant_InventoryItem(creature: Character|AnimalCompanion, inventory: ItemCollection, item: Item, resetRunes: boolean = true, changeAfter: boolean = true, equipAfter: boolean = true, amount: number = 1, newId: boolean = true) {
        this.set_ToChange(creature.type, "inventory");
        let newInventoryItem = this.itemsService.initialize_Item(item, false, newId);
        //Assign the library's item id as the new item's refId. This allows us to read the default information from the library later.
        if (!newInventoryItem.refId) {
            newInventoryItem.refId = item.id;
        }
        let returnedInventoryItem;
        //Check if this item already exists in the inventory, and if it is stackable.
        let existingItems = inventory[item.type].filter((existing: Item) =>
            existing.name == newInventoryItem.name && newInventoryItem.can_Stack()
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
            let newInventoryLength = inventory[item.type].push(newInventoryItem);
            let createdInventoryItem = inventory[item.type][newInventoryLength - 1];
            if (createdInventoryItem.amount && amount > 1) {
                createdInventoryItem.amount = amount;
            }
            if (equipAfter) {
                this.onEquip(creature, inventory, createdInventoryItem, true, false);
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
        if (returnedInventoryItem["gainInventory"]) {
            returnedInventoryItem["gainInventory"].forEach((gain: InventoryGain) => {
                let newLength = creature.inventories.push(new ItemCollection());
                let newInventory = creature.inventories[newLength - 1];
                newInventory.itemId = returnedInventoryItem.id;
                newInventory.bulkLimit = gain.bulkLimit;
                newInventory.bulkReduction = gain.bulkReduction;
            })
        }
        //Add all Items that you get from being granted this one
        if (returnedInventoryItem.gainItems && returnedInventoryItem.gainItems.length) {
            returnedInventoryItem.gainItems.filter(gainItem => gainItem.on == "grant").forEach(gainItem => {
                let newItem: Item = this.get_Items()[gainItem.type].filter(libraryItem => libraryItem.name == gainItem.name)[0];
                if (newItem.can_Stack()) {
                    this.grant_InventoryItem(creature, inventory, newItem, true, false, false, gainItem.amount);
                } else {
                    let equip = true;
                    //Don't equip the new item if it's a shield or armor and this one is too - only one shield or armor can be equipped
                    if ((returnedInventoryItem.type == "armors" || returnedInventoryItem.type == "shields") && newItem.type == returnedInventoryItem.type) {
                        equip = false;
                    }
                    let grantedItem = this.grant_InventoryItem(creature, inventory, newItem, true, false, equip);
                    gainItem.id = grantedItem.id;
                    if (grantedItem.get_Name) {
                        grantedItem.grantedBy = "(Granted by " + returnedInventoryItem.name + ")";
                    };
                }
            });
        }
        if (changeAfter) {
            this.process_ToChange();
        }
        return returnedInventoryItem;
    }

    drop_InventoryItem(creature: Character|AnimalCompanion, inventory: ItemCollection, item: Item, changeAfter: boolean = true, equipBasicItems: boolean = true, including: boolean = true, amount: number = 1) {
        this.set_ToChange(creature.type, "inventory");
        if (amount < item.amount) {
            item.amount -= amount;
        } else {
            if (item["equipped"]) {
                this.onEquip(creature, inventory, item as Equipment, false, false);
            } else if (item["invested"]) {
                this.onInvest(creature, inventory, item as Equipment, false, false);
            }
            if (item["propertyRunes"]) {
                item["propertyRunes"].filter((rune: Rune) => rune.loreChoices.length).forEach((rune: Rune) => {
                    this.remove_RuneLore(rune);
                })
            }
            if (item["appliedOils"]) {
                item["appliedOils"].filter((oil: Oil) => oil.runeEffect.loreChoices.length).forEach((oil: Oil) => {
                    this.remove_RuneLore(oil.runeEffect);
                })
            }
            if (item["activities"]) {
                item["activities"].forEach(activity => {
                    if (activity.active) {
                        this.activitiesService.activate_Activity(creature, "", this, this.timeService, this.itemsService, this.spellsService, activity, activity, false);
                    }
                })
            }
            if (item["gainActivities"]) {
                item["gainActivities"].forEach(gain => {
                    if (gain.active) {
                        this.activitiesService.activate_Activity(creature, "", this, this.timeService, this.itemsService, this.spellsService, gain, this.activitiesService.get_Activities(gain.name)[0], false);
                    }
                })
            }
            if (item["gainInventory"]) {
                creature.inventories = creature.inventories.filter(inventory => inventory.itemId != item.id);
            }
            if (including && item["gainItems"] && item["gainItems"].length) {
                item["gainItems"].filter((gainItem: ItemGain) => gainItem.on == "grant").forEach(gainItem => {
                    this.lose_GainedItem(creature, gainItem);
                });
            }
            inventory[item.type] = inventory[item.type].filter((any_item: Item) => any_item !== item);
            if (equipBasicItems) {
                this.equip_BasicItems(creature);
            }
        }
        if (changeAfter) {
            this.process_ToChange()
        }
    }

    add_RuneLore(rune: Rune) {
        //Go through all the loreChoices (usually only one)
        rune.loreChoices.forEach(choice => {
            //Check if only one (=this) item's rune has this lore (and therefore no other item has already created it on the character), and if so, create it.
            if (this.get_Character().inventories[0].allEquipment()
                .filter(item => item.propertyRunes
                    .filter(propertyRune => propertyRune.loreChoices
                        .filter(otherchoice => otherchoice.loreName == choice.loreName)
                        .length)
                    .length)
                .length + 
                this.get_Character().inventories[0].allEquipment()
                .filter(item => item.oilsApplied
                    .filter(oil => oil.runeEffect && oil.runeEffect.loreChoices
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
            if (this.get_Character().inventories[0].allEquipment()
                .filter(item => item.propertyRunes
                    .filter(propertyRune => propertyRune.loreChoices
                        .filter(otherchoice => otherchoice.loreName == choice.loreName)
                        .length)
                    .length)
                .length + 
                this.get_Character().inventories[0].allEquipment()
                .filter(item => item.oilsApplied
                    .filter(oil => oil.runeEffect && oil.runeEffect.loreChoices
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

    onEquip(creature: Character|AnimalCompanion, inventory: ItemCollection, item: Equipment, equipped: boolean = true, changeAfter: boolean = true, equipBasicItems: boolean = true) {
        if ((creature.type == "Character" && !item.traits.includes("Companion")) || (creature.type == "Companion" && item.traits.includes("Companion")) || item.name == "Unarmored") {
            item.equipped = equipped;
            this.set_ToChange(creature.type, "inventory");
            if (item.equipped) {
                if (item.type == "weapons" || item.type == "ammunition") {
                    this.set_ToChange(creature.type, "attacks");
                }
                if (item.type == "armors" || item.type == "shields") {
                    let allOfType = inventory[item.type];
                    allOfType.forEach(typeItem => {
                        this.onEquip(creature, inventory, typeItem, false, false, false);
                    });
                    item.equipped = true;
                    this.set_ToChange(creature.type, "defense");
                }
                //If you get an Activity from an item that doesn't need to be invested, immediately invest it in secret so the Activity is gained
                if (item.gainActivities && !item.traits.includes("Invested")) {
                    this.onInvest(creature, inventory, item, true, false);
                }
                //Add all Items that you get from equipping this one
                if (item.gainItems && item.gainItems.length) {
                    item.gainItems.filter((gainItem: ItemGain) => gainItem.on == "equip").forEach(gainItem => {
                        let newItem: Item = this.itemsService.get_Items()[gainItem.type].filter((libraryItem: Item) => libraryItem.name == gainItem.name)[0]
                        if (newItem.can_Stack()) {
                            this.grant_InventoryItem(creature, inventory, newItem, false, false, false, gainItem.amount);
                        } else {
                            let equip = true;
                            //Don't equip the new item if it's a shield or armor and this one is too - only one shield or armor can be equipped
                            if ((item.type == "armors" || item.type == "shields") && newItem.type == item.type) {
                                equip = false;
                            }
                            let grantedItem = this.grant_InventoryItem(creature, inventory, newItem, false, false, equip);
                            gainItem.id = grantedItem.id;
                            if (grantedItem.get_Name) {
                                grantedItem.grantedBy = "(Granted by " + item.name + ")"
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
                    this.onInvest(creature, inventory, item, false, false);
                }
                if (item["gainItems"] && item["gainItems"].length) {
                    item["gainItems"].filter((gainItem: ItemGain) => gainItem.on == "equip").forEach(gainItem => {
                        this.lose_GainedItem(creature, gainItem);
                    });
                }
            }
            if (changeAfter) {
                this.process_ToChange();
            }
        }
    }

    lose_GainedItem(creature: Character|AnimalCompanion, gainedItem: ItemGain) {
        if (this.itemsService.get_CleanItems()[gainedItem.type].concat(...creature.inventories.map(inventory => inventory[gainedItem.type])).filter((item: Item) => item.name == gainedItem.name)[0].can_Stack()) {
            let amountToDrop = gainedItem.amount || 1;
            creature.inventories.forEach(inventory => {
                let items: Item[] = inventory[gainedItem.type].filter((libraryItem: Item) => libraryItem.name == gainedItem.name);
                items.forEach(item => {
                    if (amountToDrop) {
                        if (item.amount < amountToDrop) {
                            this.drop_InventoryItem(creature, inventory, item, false, false, true, gainedItem.amount - amountToDrop);
                            amountToDrop -= gainedItem.amount;
                        } else {
                            this.drop_InventoryItem(creature, inventory, item, false, false, true, gainedItem.amount);
                            amountToDrop = 0;
                        }
                    }
                });
            });
        } else {
            creature.inventories.forEach(inventory => {
                let items: Item[] = inventory[gainedItem.type].filter((libraryItem: Item) => libraryItem.id == gainedItem.id);
                items.forEach(item => {
                    this.drop_InventoryItem(creature, inventory, item, false, false, true);
                });
            });
            gainedItem.id = "";
        }
    }

    onInvest(creature: Character|AnimalCompanion, inventory: ItemCollection, item: Equipment, invested: boolean = true, changeAfter: boolean = true) {
        item.invested = invested;
        this.set_ToChange(creature.type, "inventory");
        if (item.invested) {
            if (!item.equipped) {
                this.onEquip(creature, inventory, item, true, false);
            }
        } else {
            item.gainActivities.forEach((gainActivity: ActivityGain) => {
                this.activitiesService.activate_Activity(creature, "", this, this.timeService, this.itemsService, this.spellsService, gainActivity, this.activitiesService.get_Activities(gainActivity.name)[0], false);
            });
        }
        if (changeAfter) {
            this.process_ToChange();
        }
    }

    on_ConsumableUse(creature: Character|AnimalCompanion, item: Consumable) {
        item.amount--
        this.itemsService.process_Consumable(creature, this, this.itemsService, this.timeService, this.spellsService, item);
        this.set_ToChange(creature.type, "inventory");
    }

    grant_BasicItems() {
        //This function depends on the items being loaded, and it will wait forever for them!
        if (this.itemsService.still_loading()) {
            setTimeout(() => {
                this.grant_BasicItems();
            }, 500)
        } else {
            this.basicItems = [];
            let newBasicWeapon: Weapon = Object.assign(new Weapon(), this.itemsService.get_ItemsOfType("weapons", "Fist")[0]);
            this.basicItems.push(newBasicWeapon);
            let newBasicArmor: Armor;
            newBasicArmor = Object.assign(new Armor(), this.itemsService.get_ItemsOfType("armors", "Unarmored")[0]);
            this.basicItems.push(newBasicArmor);
            this.equip_BasicItems(this.get_Character(), false)
            this.equip_BasicItems(this.get_Companion(), false)
        }
    }

    equip_BasicItems(creature: Character|AnimalCompanion, changeAfter: boolean = true) {
        if (!this.still_loading() && this.basicItems.length) {
            if (!creature.inventories[0].weapons.length && creature.type == "Character") {
                this.grant_InventoryItem(creature, creature.inventories[0], this.basicItems[0], true, false, false);
            }
            if (!creature.inventories[0].armors.length) {
                this.grant_InventoryItem(creature, creature.inventories[0], this.basicItems[1], true, false, false);
            }
            if (!creature.inventories[0].weapons.filter(weapon => weapon.equipped == true).length) {
                if (creature.inventories[0].weapons.length) {
                    this.onEquip(creature, creature.inventories[0], creature.inventories[0].weapons[0], true, changeAfter);
                }
            }
            if (!creature.inventories[0].armors.filter(armor => armor.equipped == true).length) {
                this.onEquip(creature, creature.inventories[0], creature.inventories[0].armors[0], true, changeAfter);
            }
        }
    }

    add_CustomSkill(skillName: string, type: string, abilityName: string) {
        this.me.customSkills.push(new Skill(abilityName, skillName, type));
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

    get_AppliedConditions(creature: Character|AnimalCompanion|Familiar, name: string = "", source: string = "") {
        //Returns ConditionGain[] with apply=true/false for each
        return this.conditionsService.get_AppliedConditions(creature, this, creature.conditions).filter(condition =>
            (condition.name == name || name == "") &&
            (condition.source == source || source == "")
        );
    }

    add_Condition(creature: Character|AnimalCompanion|Familiar, conditionGain: ConditionGain, reload: boolean = true) {
        let originalCondition = this.get_Conditions(conditionGain.name)[0];
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
                let addCondition = Object.assign(new ConditionGain, JSON.parse(JSON.stringify(extraCondition)));
                addCondition.source = newConditionGain.name;
                addCondition.apply = true;
                this.add_Condition(creature, addCondition, false)
            })
            this.set_ToChange(creature.type, "effects");
            if (reload) {
                this.process_ToChange();
            }
            return newLength;
        }
    }

    remove_Condition(creature: Character|AnimalCompanion|Familiar, conditionGain: ConditionGain, reload: boolean = true, increaseWounded: boolean = true) {
        let oldConditionGain = creature.conditions.filter($condition => $condition.name == conditionGain.name && $condition.value == conditionGain.value && $condition.source == conditionGain.source);
        let originalCondition = this.get_Conditions(conditionGain.name)[0];
        if (oldConditionGain.length) {
            originalCondition.gainConditions.forEach(extraCondition => {
                let addCondition = Object.assign(new ConditionGain, JSON.parse(JSON.stringify(extraCondition)));
                addCondition.source = oldConditionGain[0].name;
                this.remove_Condition(creature, addCondition, false, increaseWounded)
            })
            creature.conditions.splice(creature.conditions.indexOf(oldConditionGain[0]), 1)
            this.conditionsService.process_Condition(creature, this, this.effectsService, conditionGain, this.conditionsService.get_Conditions(conditionGain.name)[0], false, increaseWounded);
            this.set_ToChange(creature.type, "effects");
            if (reload) {
                this.process_ToChange();
            }
        }
        
    }

    process_OnceEffect(creature: Character|AnimalCompanion|Familiar, effectGain: EffectGain, conditionValue: number = 0, conditionHeightened: number = 0) {
        let value = 0;
        try {
            //we eval the effect value by sending this effect gain to get_SimpleEffects() and receive the resulting effect.
            let effects = this.effectsService.get_SimpleEffects(this.get_Character(), this, { effects: [effectGain], value: conditionValue, heightened: conditionHeightened });
            if (effects.length) {
                let effect = effects[0];
                if (effect && effect.value && effect.value != "0" && (parseInt(effect.value) || parseFloat(effect.value))) {
                    if (parseFloat(effect.value) == parseInt(effect.value)) {
                        value = parseInt(effect.value);
                    }
                }
            } else {
                value = 0;
            }
        } catch (error) {
            value = 0;
        }
        switch (effectGain.affected) {
            case "Focus Points":
                //Give the focus point some time. If a feat expands the focus pool and gives a focus point, the pool is not expanded yet at this point of processing.
                (creature as Character).class.focusPoints += value;
                this.set_ToChange(creature.type, "spellbook");
                break;
            case "Temporary HP":
                creature.health.temporaryHP += value;
                this.set_ToChange(creature.type, "health");
                break;
            case "HP":
                if (value > 0) {
                    creature.health.heal(creature, this, this.effectsService, value, true)
                } else if (value < 0) {
                    creature.health.takeDamage(creature, this, this.effectsService, -value, false)
                }
                this.set_ToChange(creature.type, "health");
                break;
            case "Languages":
                let languages = (creature as Character).class.languages;
                if (languages.filter(language => language == effectGain.value).length == 0) {
                    languages.push(effectGain.value);
                }
                this.set_ToChange(creature.type, "general");
                this.set_ToChange(creature.type, "charactersheet");
                break;
        }
    }

    have_Trait(object: any, traitName: string) {
        return this.traitsService.have_Trait(this, object, traitName);
    }

    get_Abilities(name: string = "") {
        return this.abilitiesService.get_Abilities(name)
    }

    get_Skills(creature: Character|AnimalCompanion|Familiar, name: string = "", type: string = "") {
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

    get_Health(creature: Character|AnimalCompanion|Familiar) {
        return creature.health;
    }

    get_AnimalCompanionLevels() {
        return this.animalCompanionsService.get_CompanionLevels();
    }

    process_Feat(creature: Character|Familiar, featName: string, choice: FeatChoice, level: Level, taken: boolean) {
        this.featsService.process_Feat(creature, this, featName, choice, level, taken);
    }

    get_FeatsShowingOn(objectName: string) {
        let returnedFeats = []
        this.me.get_FeatsTaken(0, this.me.level, "", "").map(feat => this.get_FeatsAndFeatures(feat.name)[0]).forEach(feat => {
            feat?.showon.split(",").forEach(showon => {
                if (showon == objectName || showon.substr(1) == objectName || (objectName.includes("Lore") && (showon == "Lore" || showon.substr(1) == "Lore"))) {
                    returnedFeats.push(feat);
                }
            })
        });
        return returnedFeats;
    }

    get_CompanionShowingOn(objectName: string) {
        let returnedObjects = []
        //Get showon elements from Companion Ancestry and Specialization
        this.get_Companion().class.ancestry.showon.split(",").forEach(showon => {
            if (showon == objectName || showon.substr(1) == objectName) {
                returnedObjects.push(this.get_Companion().class.ancestry.showon);
            }
        });
        this.get_Companion().class.specializations.forEach(spec => {
            spec.showon.split(",").forEach(showon => {
                if (showon == objectName || showon.substr(1) == objectName) {
                    returnedObjects.push(spec);
                }
            });
        })
        return returnedObjects;
    }

    get_FamiliarShowingOn(objectName: string) {
        let returnedAbilities = []
        //Get showon elements from Familiar Abilities
        this.get_Familiar().abilities.feats.map(gain => this.familiarsService.get_FamiliarAbilities(gain.name)[0]).filter(feat => feat.showon).forEach(feat => {
            feat?.showon.split(",").forEach(showon => {
                if (showon == objectName || showon.substr(1) == objectName || (objectName.includes("Lore") && (showon == "Lore" || showon.substr(1) == "Lore"))) {
                    returnedAbilities.push(feat);
                }
            })
        })
        return returnedAbilities;
    }

    get_ConditionsShowingOn(creature: Character|AnimalCompanion|Familiar, objectName: string) {
        let conditions = this.get_AppliedConditions(creature).filter(condition => condition.apply);
        if (objectName.includes("Lore")) {
            objectName = "Lore";
        }
        let returnedConditions = [];
        if (conditions.length) {
            conditions.forEach(condition => {
                let originalCondition: Condition = this.get_Conditions(condition.name)[0];
                originalCondition?.showon.split(",").forEach(showon => {
                    if (showon == objectName || showon.substr(1) == objectName || (objectName == "Lore" && showon.includes(objectName))) {
                        returnedConditions.push(originalCondition);
                    }
                });
            });
        }
        return returnedConditions;
    }

    get_OwnedActivities(creature: Character|AnimalCompanion|Familiar, levelNumber: number = creature.level) {
        let activities: (ActivityGain | ItemActivity)[] = []
        if (!this.still_loading()) {
            if (creature.type == "Character") {
                activities.push(...(creature as Character).class.activities.filter(gain => gain.level <= levelNumber));
            }
            if (creature.type == "Companion" && creature.class.ancestry.name) {
                activities.push(...(creature as AnimalCompanion).class.ancestry.activities.filter(gain => gain.level <= levelNumber));
            }
            this.get_AppliedConditions(creature).filter(gain => gain.apply).forEach(gain => {
                activities.push(...this.get_Conditions(gain.name)[0]?.gainActivities)
            });
            creature.inventories[0].allEquipment()
                .filter(item => 
                    item.equipped &&
                    (item.can_Invest() ? item.invested : true)
                ).forEach((item: Equipment) => {
                    if (item.gainActivities.length) {
                        activities.push(...item.gainActivities);
                    }
                    //DO NOT get resonant activities at this point
                    if (item.activities.length) {
                        activities.push(...item.activities.filter(activity => !activity.resonant));
                    }
                    //Get activities from runes
                    if (item.propertyRunes) {
                        item.propertyRunes.filter(rune => rune.activities.length).forEach(rune => {
                            activities.push(...rune.activities);
                        });
                    }
                    //Get activities from Oils emulating runes
                    if (item.oilsApplied) {
                        item.oilsApplied.filter(oil => oil.runeEffect && oil.runeEffect.activities).forEach(oil => {
                            activities.push(...oil.runeEffect.activities);
                        });
                    }
                    //Get activities from slotted Aeon Stones, including resonant activities
                    if ((item as WornItem).aeonStones) {
                        (item as WornItem).aeonStones.filter(stone => stone.activities.length).forEach(stone => {
                            activities.push(...stone.activities);
                        })
                    }
                })
        }
        return activities;
    }

    get_ActivitiesShowingOn(creature: Character|AnimalCompanion|Familiar, objectName: string) {
        let activityGains = this.get_OwnedActivities(creature).filter(gain => gain.active);
        let returnedActivities: Activity[] = [];
        activityGains.forEach(gain => {
            this.activitiesService.get_Activities(gain.name).forEach(activity => {
                activity?.showon.split(",").forEach(showon => {
                    if (showon == objectName || showon.substr(1) == objectName || (objectName == "Lore" && showon.includes(objectName))) {
                        returnedActivities.push(activity);
                    }
                });
            });
        });
        return returnedActivities;
    }

    get_ItemsShowingOn(creature: Character|AnimalCompanion|Familiar, objectName: string) {
        let returnedItems: Item[] = [];
        function get_Hint(item: Equipment|Oil|WornItem) {
            item.showon.split(",").forEach(showon => {
                if (showon == objectName || showon.substr(1) == objectName || (objectName == "Lore" && showon.includes(objectName))) {
                    returnedItems.push(item);
                }
            });
        }
        creature.inventories.forEach(inventory => {
            inventory.allEquipment().filter(item => (item.equippable ? item.equipped : true) && (item.can_Invest() ? item.invested : true)).forEach(item => {
                get_Hint(item);
                item.oilsApplied.forEach(oil => {
                    get_Hint(oil);
                });
                if ((item as WornItem).aeonStones) {
                    (item as WornItem).aeonStones.forEach(stone => {
                        get_Hint(stone);
                    });
                }
            });
        });
        return returnedItems;
    }

    get_MaxFocusPoints() {
        let focusPoints: number = 0;
        this.effectsService.get_AbsolutesOnThis(this.get_Character(), "Focus Pool").forEach(effect => {
            focusPoints = parseInt(effect.setValue);
        })
        this.effectsService.get_RelativesOnThis(this.get_Character(), "Focus Pool").forEach(effect => {
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
            this.me.class.animalCompanion = this.reassign(this.me.class.animalCompanion);
            this.me.class.animalCompanion.class.reset_levels(this);
            this.me.class.animalCompanion.set_Level(this);
            this.equip_BasicItems(this.me.class.animalCompanion);
        }
    }

    cleanup_Familiar() {
        this.get_Familiar().abilities.feats.forEach(gain => {
            this.get_Character().take_Feat(this.get_Familiar(), this, gain.name, false, this.get_Familiar().abilities, undefined);
        })
    }

    initialize_Familiar() {
        if (this.me.class.familiar) {
            this.me.class.familiar = Object.assign(new Familiar(), this.me.class.familiar);
            this.me.class.familiar = this.reassign(this.me.class.familiar);
        }
    }

    initialize(id: string) {
        this.set_Changed("top-bar");
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
        this.animalCompanionsService.initialize();
        this.familiarsService.initialize();
        this.savegameService.initialize(this);
        if (id) {
            this.me = new Character();
            this.load_CharacterFromDB(id)
            .subscribe((results: string[]) => {
                this.loader = results;
                this.finish_loading()
            }, (error) => {
                console.log('Error loading character from database: ' + error.message);
            });
        } else {
            this.me = new Character();
            this.finish_loading();
        }
    }

    load_CharacterFromDB(id: string): Observable<string[]> {
        return this.savegameService.load_CharacterFromDB(id);
    }
    
    delete_Character(savegame: Savegame) {
        this.savegameService.delete_CharacterFromDB(savegame).subscribe((results) => {
            console.log("Deleted "+(savegame.name || "character")+" from database.");
            this.savegameService.initialize(this);
        }, (error) => {
            console.log('Error deleting from database: ' + error.message);
        });
    }
    
    reassign(object: any) {
        return this.savegameService.reassign(object);
    }

    finish_loading() {
        if (this.loader) {
            this.me = Object.assign(new Character(), JSON.parse(JSON.stringify(this.loader)));
            this.loader = [];
            this.finalize_Character();
        }
    }

    finalize_Character() {
        if (this.itemsService.still_loading()) {
            setTimeout(() => {
                this.finalize_Character();
            }, 500)
        } else {
            //Use this.me here instead of this.get_Character() because we're still_loading()
            this.me = this.savegameService.load_Character(this.me, this.itemsService, this.classesService, this.historyService, this.animalCompanionsService)
            if (this.loading) { this.loading = false; }
            this.grant_BasicItems();
            this.characterChanged$ = this.changed.asObservable();
            this.viewChanged$ = this.viewChanged.asObservable();
            //this.set_Changed();
            this.trigger_FinalChange();
        }
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

    save_Character() {
        this.savegameService.save_Character(this.get_Character(), this.itemsService, this.classesService, this.historyService, this.animalCompanionsService).subscribe((result) => {
            if (result["lastErrorObject"] && result["lastErrorObject"].updatedExisting) {
                console.log("Saved "+(this.get_Character().name || "character")+" to database.");
            } else {
                console.log("Created "+(this.get_Character().name || "character")+" on database.");
            }
            this.set_Changed("charactersheet");
            this.savegameService.initialize(this);
        }, (error) => {
            console.log('Error saving to database: ' + error.message);
        });
        
    }

}