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
import { async } from '@angular/core/testing';

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

    constructor(
        private http: HttpClient,
        private abilitiesService: AbilitiesService,
        private skillsService: SkillsService,
        private classesService: ClassesService,
        private featsService: FeatsService,
        private traitsService: TraitsService,
        private historyService: HistoryService
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

    toggleCharacterMenu(position: string = "") {
        if (position) {
            this.itemsMenuState = position;
        } else {
            this.itemsMenuState = (this.itemsMenuState == 'out') ? 'in' : 'out';
        }
    }

    get_characterMenuState() {
        return this.itemsMenuState;
    }

    get_Level(number: number) {
        return this.get_Character().class.levels[number];
    }

    get_Character() {
        if (!this.still_loading()) {
            return this.me;
        } else { return new Character() }
    }

    get_Classes(name: string) {
        return this.classesService.get_Classes(name);
    }

    get_Ancestries(name: string) {
        this.historyService.get_Ancestries(name)
    }

    changeClass($class: Class) {
        this.me.class.on_ChangeHeritage(this);
        this.me.class.on_ChangeAncestry(this);
        this.me.class.on_ChangeBackground(this);
        this.me.class = new Class();
        this.me.class = Object.assign(new Class(), JSON.parse(JSON.stringify($class)));
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

    create_AdvancedWeaponFeats(advancedWeapons: Weapon[]) {
        //This function depends on the feats being loaded, and it will wait forever for them!
        if(this.featsService.still_loading()) {
            setTimeout(() => {
                this.create_AdvancedWeaponFeats(advancedWeapons);
            }, 2000)
        } else {
            let advancedWeaponFeats = this.get_Feats().filter(feat => feat.advancedweaponbase);
            advancedWeapons.forEach(weapon => {
                advancedWeaponFeats.forEach(feat => {
                    if (this.me.customFeats.filter(customFeat => customFeat.name == feat.name.replace('Advanced Weapon', weapon.name)).length == 0) {
                        let regex = /Advanced Weapon/gi;
                        let newLength = this.add_CustomFeat(feat);
                        let newFeat = this.get_Character().customFeats[newLength -1];
                        newFeat.name = newFeat.name.replace(regex, weapon.name);
                        newFeat.specialreqdesc = newFeat.specialreqdesc.replace(regex, weapon.name);
                        newFeat.specialreq = newFeat.specialreq.replace(regex, weapon.name);
                        newFeat.hide = false;
                    }
                })
            })
            this.set_Changed();
        }
    }

    grant_InventoryItem(item: Item) {
        let newInventoryItem;
        switch (item.type) {
            case "weapon":
                newInventoryItem = Object.assign(new Weapon(), item);
                break;
            case "armor":
                newInventoryItem = Object.assign(new Armor(), item);
                break;
            case "shield":
                newInventoryItem = Object.assign(new Shield(), item);
                break;
        }
        newInventoryItem.equip = true;
        let newInventoryLength = this.me.inventory[item.type].push(newInventoryItem);
        this.onEquipChange(this.me.inventory[item.type][newInventoryLength-1]);
        this.set_Changed();
    }

    drop_InventoryItem(item: Item) {
        this.me.inventory[item.type] = this.me.inventory[item.type].filter(any_item => any_item !== item);
        this.equip_BasicItems();
        this.set_Changed();
    }

    onEquipChange(item: Item) {
        if (item.equip) {
            if (item.type == "armor"||item.type == "shield") {
                let allOfType = this.get_InventoryItems()[item.type];
                allOfType.forEach(typeItem => {
                    typeItem.equip = false;
                });
                item.equip = true;
            }
        } else {
            //If this is called by a checkbox, it finishes before the checkbox model finalizes - so if the unequipped item is the basic item, it will still end up unequipped.
            //We get around this by setting a miniscule timeout and letting the model finalize before equipping basic items.
            setTimeout(() => {
                this.equip_BasicItems();
                this.set_Changed();
            });
            //If you are unequipping a shield, you should also be lowering it and losing cover
            if (item.type == "shield") {
                item["takingCover"] = false;
                item["raised"] = false;
            }
            //Same with currently parrying weapons
            if (item.type == "weapon") {
                item["parrying"] = false;
            }
            //Also armor, even though cover is independent from armor (but we are tracking cover on the armor and we don't want it to change between equipment changes)
            if (item.type == "armor") {
                item["cover"] = 0;
            }
        }
        this.set_Changed();
    }

    grant_BasicItems(weapon: Weapon, armor: Armor) {
        this.basicItems = [];
        let newBasicWeapon:Weapon;
        newBasicWeapon = Object.assign(new Weapon(), weapon);
        this.basicItems.push(newBasicWeapon);
        let newBasicArmor:Armor;
        newBasicArmor = Object.assign(new Armor(), armor);
        this.basicItems.push(newBasicArmor);
        this.equip_BasicItems()
        this.set_Changed();
    }
    
    equip_BasicItems() {
        if (!this.still_loading() && this.basicItems.length) {
            if (!this.get_InventoryItems().weapon.length) {
                this.grant_InventoryItem(this.basicItems[0]);
            }
            if (!this.get_InventoryItems().armor.length) {
                this.grant_InventoryItem(this.basicItems[1]);
            }
            if (!this.get_InventoryItems().weapon.filter(weapon => weapon.equip == true).length) {
                this.get_InventoryItems().weapon[0].equip = true;
            }
            if (!this.get_InventoryItems().armor.filter(armor => armor.equip == true).length) {
                this.get_InventoryItems().armor[0].equip = true;
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
        let newLength = this.me.customFeats.push(Object.assign(new Feat(), oldFeat));
        this.set_Changed();
        return newLength;
    }

    remove_CustomFeat(oldFeat: Feat) {
        this.me.customFeats = this.me.customFeats.filter(skill => skill !== oldFeat);
        this.set_Changed();
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
                let returnedFeat = this.get_Feats(feat.name)[0];
                if (returnedFeat.showon.indexOf(objectName) > -1) {
                    returnedFeats.push(returnedFeat);
                }
            });
        }
        return returnedFeats;
    }

    initialize(charName: string) {
        this.traitsService.initialize();
        this.featsService.initialize();
        this.historyService.initialize();
        this.classesService.initialize();
        this.loading = true;
        this.load_Character(charName)
            .subscribe((results:string[]) => {
                this.loader = results;
                this.finish_loading()
            });
    }

    load_Character(charName: string): Observable<string[]>{
        return this.http.get<string[]>('/assets/'+charName+'.json');
    }

    finish_loading() {
        if (this.loader) {
            this.me = Object.assign(new Character(), JSON.parse(JSON.stringify(this.loader)));

            //We have loaded the entire character from the file, but everything is object Object.
            //Let's recast all the typed objects:
            this.me.customSkills = this.me.customSkills.map(skill => Object.assign(new Skill(), skill));
            if (this.me.class) {
                this.me.class = Object.assign(new Class(), this.me.class);
                this.me.class.levels = this.me.class.levels.map(level => Object.assign(new Level(), level));
            } else {
                this.me.class = new Class();
            }
            if (this.me.health) {
                this.me.health = Object.assign(new Health(), this.me.health);
            }
            if (this.me.customFeats) {
                this.me.customFeats = this.me.customFeats.map(feat => Object.assign(new Feat(), feat));
            }
            if (this.me.inventory) {
                this.me.inventory = Object.assign(new ItemCollection(), this.me.inventory);
                this.me.inventory.weapon = this.me.inventory.weapon.map(weapon => Object.assign(new Weapon(), weapon));
                this.me.inventory.armor = this.me.inventory.armor.map(armor => Object.assign(new Armor(), armor));
                this.me.inventory.shield = this.me.inventory.shield.map(shield => Object.assign(new Weapon(), shield));
            } else {
                this.me.inventory = new ItemCollection();
            }
            if (this.me.class.ancestry) {
                this.me.class.ancestry = Object.assign(new Ancestry(), this.me.class.ancestry);
            }
            if (this.me.class.heritage) {
                this.me.class.heritage = Object.assign(new Heritage(), this.me.class.heritage);
            }
            if (this.me.class.background) {
                this.me.class.background = Object.assign(new Background(), this.me.class.background);
            }

            this.loader = [];
        }
        if (this.loading) {this.loading = false;}
        this.equip_BasicItems();
        this.characterChanged$ = this.changed.asObservable();
        this.set_Changed();
    }

    print() {
        console.log(JSON.stringify(this.me));
    }

}