import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, Input } from '@angular/core';
import { Weapon } from '../Weapon';
import { TraitsService } from '../traits.service';
import { CharacterService } from '../character.service';
import { EffectsService } from '../effects.service';
import { WeaponRune } from '../WeaponRune';
import { Character } from '../Character';
import { AnimalCompanion } from '../AnimalCompanion';
import { Ammunition } from '../Ammunition';
import { ItemCollection } from '../ItemCollection';
import { Talisman } from '../Talisman';
import { AlchemicalBomb } from '../AlchemicalBomb';
import { Consumable } from '../Consumable';
import { Snare } from '../Snare';
import { SpellGain } from '../SpellGain';
import { AlchemicalPoison } from '../AlchemicalPoison';
import { OtherConsumableBomb } from '../OtherConsumableBomb';
import { Equipment } from '../Equipment';
import { ConditionsService } from '../conditions.service';
import { ConditionGain } from '../ConditionGain';
import { NgbPopoverConfig, NgbTooltipConfig } from '@ng-bootstrap/ng-bootstrap';
import { WeaponMaterial } from '../WeaponMaterial';

@Component({
    selector: 'app-attacks',
    templateUrl: './attacks.component.html',
    styleUrls: ['./attacks.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AttacksComponent implements OnInit {

    @Input()
    public creature: string = "Character";
    @Input()
    public sheetSide: string = "left";
    public onlyAttacks: string[] = [];
    public forbiddenAttacks: string[] = [];
    public showRestricted: boolean = false;
    private showItem: string = "";
    private showList: string = "";

    constructor(
        private changeDetector: ChangeDetectorRef,
        private traitsService: TraitsService,
        public characterService: CharacterService,
        public effectsService: EffectsService,
        public conditionsService: ConditionsService,
        popoverConfig: NgbPopoverConfig,
        tooltipConfig: NgbTooltipConfig
    ) {
        popoverConfig.autoClose = "outside";
        popoverConfig.container = "body";
        //For touch compatibility, this openDelay prevents the popover from closing immediately on tap because a tap counts as hover and then click;
        popoverConfig.openDelay = 50;
        popoverConfig.placement = "auto";
        popoverConfig.popoverClass = "list-item sublist";
        popoverConfig.triggers = "click";
        tooltipConfig.container = "body";
        //For touch compatibility, this openDelay prevents the tooltip from closing immediately on tap because a tap counts as hover and then click;
        tooltipConfig.openDelay = 100;
        tooltipConfig.triggers = "hover:click";
    }

    minimize() {
        this.characterService.get_Character().settings.attacksMinimized = !this.characterService.get_Character().settings.attacksMinimized;
    }

    get_Minimized() {
        switch (this.creature) {
            case "Character":
                return this.characterService.get_Character().settings.attacksMinimized;
            case "Companion":
                return this.characterService.get_Character().settings.companionMinimized;
        }
    }

    still_loading() {
        return this.characterService.still_loading()
    }

    get_Creature(type: string = this.creature) {
        return this.characterService.get_Creature(type) as Character | AnimalCompanion;
    }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    toggle_List(name: string) {
        if (this.showList == name) {
            this.showList = "";
        } else {
            this.showList = name;
        }
    }

    get_ShowList() {
        return this.showList;
    }

    toggle_Item(id: string) {
        if (this.showItem == id) {
            this.showItem = "";
        } else {
            this.showItem = id;
        }
    }

    get_ShowItem() {
        return this.showItem;
    }

    get_CriticalHints(weapon: Weapon) {
        let hints: string[] = [];
        if (weapon.criticalHint) {
            hints.push(weapon.criticalHint);
        }
        weapon.material.forEach(material => {
            if ((material as WeaponMaterial).criticalHint) {
                hints.push((material as WeaponMaterial).criticalHint);
            }
        })
        return hints;
    }

    get_CritSpecialization(weapon: Weapon, range: string) {
        return weapon.get_CritSpecialization(this.get_Creature(), this.characterService, range);
    }

    get_AttackRestrictions() {
        this.onlyAttacks = [];
        this.forbiddenAttacks = [];
        this.characterService.get_AppliedConditions(this.get_Creature()).filter(gain => gain.apply).forEach(gain => {
            let condition = this.characterService.get_Conditions(gain.name)[0];
            this.onlyAttacks.push(
                ...condition?.attackRestrictions
                    .filter(restriction => !restriction.excluding && (!restriction.conditionChoiceFilter || restriction.conditionChoiceFilter == gain.choice))
                    .map(restriction => restriction.name)
            )
            this.forbiddenAttacks.push(
                ...condition?.attackRestrictions
                    .filter(restriction => restriction.excluding && (!restriction.conditionChoiceFilter || restriction.conditionChoiceFilter == gain.choice))
                    .map(restriction => restriction.name)
            )
        });
    }

    get_IsAllowed(weapon: Weapon) {
        return !(this.onlyAttacks.length && !this.onlyAttacks.includes(weapon.name)) && !this.forbiddenAttacks.includes(weapon.name);
    }

    get_EquippedWeapons() {
        this.get_AttackRestrictions();
        return this.get_Creature().inventories[0].weapons.filter(weapon => weapon.equipped && weapon.equippable && !weapon.broken)
            .concat(...this.get_Creature().inventories.map(inv => inv.alchemicalbombs))
            .concat(...this.get_Creature().inventories.map(inv => inv.otherconsumablesbombs))
            .sort(function (a, b) {
                if (a.name > b.name) {
                    return 1
                }
                if (a.name < b.name) {
                    return -1
                }
                return 0;
            })
            .sort(function (a, b) {
                if (a.type < b.type) {
                    return 1
                }
                if (a.type > b.type) {
                    return -1
                }
                return 0;
            })
    }

    get_TalismanTitle(talisman: Talisman) {
        return (talisman.trigger ? "Trigger: " + talisman.trigger + "\n\n" : "") + talisman.desc;
    }

    get_PoisonTitle(poison: AlchemicalPoison) {
        return poison.desc;
    }

    get_TwoHandedAllowed(weapon: Weapon) {
        return (this.traitsService.have_Trait(this.characterService, weapon, "Two-Hand"));
    }

    on_EquipmentChange(item: Equipment) {
        this.characterService.set_EquipmentViewChanges(this.get_Creature(), item);
        this.characterService.process_ToChange();
    }

    on_TalismanUse(weapon: Weapon, talisman: Talisman, index: number) {
        this.characterService.set_ToChange(this.creature, "attacks");
        this.characterService.on_ConsumableUse(this.get_Creature(), talisman);
        weapon.talismans.splice(index, 1)
        this.characterService.process_ToChange();
    }

    on_PoisonUse(weapon: Weapon, poison: AlchemicalPoison) {
        this.characterService.set_ToChange(this.creature, "attacks");
        this.characterService.on_ConsumableUse(this.get_Creature(), poison);
        weapon.poisonsApplied.length = 0;
        this.characterService.process_ToChange();
    }

    get_AmmoTypes() {
        let types: string[] = [];
        this.get_EquippedWeapons().forEach(weapon => {
            if (weapon.ammunition && !types.includes(weapon.ammunition)) {
                types.push(weapon.ammunition);
            }
        });
        return types;
    }

    get_Ammo(type: string) {
        //Return all ammo from all inventories that has this type in its group
        //We need the inventory for using up items and the name just for sorting
        let ammoList: { item: Ammunition, name: string, inventory: ItemCollection }[] = [];
        this.get_Creature().inventories.forEach(inv => {
            inv.ammunition.filter(ammo => ammo.ammunition == type || ammo.ammunition == "Any").forEach(ammo => {
                ammoList.push({ item: ammo, name: ammo.get_Name(), inventory: inv })
            })
        });
        return ammoList.sort((a, b) => {
            if (a.name > b.name) {
                return 1;
            }
            if (a.name < b.name) {
                return -1;
            }
            return 0;
        });;
    }

    get_Snares() {
        let snares: { item: Snare, name: string, inventory: ItemCollection }[] = [];
        this.get_Creature().inventories.forEach(inv => {
            inv.snares.forEach(snare => {
                snares.push({ item: snare, name: snare.get_Name(), inventory: inv })
            })
        });
        return snares.sort((a, b) => {
            if (a.name > b.name) {
                return 1;
            }
            if (a.name < b.name) {
                return -1;
            }
            return 0;
        });;
    }

    get_Spells(name: string = "", type: string = "", tradition: string = "") {
        return this.characterService.spellsService.get_Spells(name, type, tradition);
    }

    on_ConsumableUse(item: Ammunition | AlchemicalBomb | OtherConsumableBomb, inv: ItemCollection) {
        if (item.storedSpells.length) {
            let spellName = item.storedSpells[0]?.spells[0]?.name || "";
            let spellChoice = item.storedSpells[0];
            if (spellChoice && spellName) {
                let spell = this.get_Spells(item.storedSpells[0]?.spells[0]?.name)[0];
                if (spell) {
                    let tempGain: SpellGain = new SpellGain();
                    let target: string = "";
                    if (spell.target == 'self') {
                        target = "Character";
                    }
                    this.characterService.spellsService.process_Spell(this.get_Creature('Character'), target, this.characterService, this.characterService.itemsService, this.characterService.conditionsService, null, tempGain, spell, spellChoice.level, true, true, false);
                }
                spellChoice.spells.shift();
            }
        }
        this.characterService.on_ConsumableUse(this.get_Creature(), item as Consumable);
        if (item.can_Stack()) {
            this.characterService.set_ToChange(this.creature, "attacks");
            this.characterService.process_ToChange();
        } else {
            this.characterService.drop_InventoryItem(this.get_Creature(), inv, item, true);
        }

    }

    get_Skills(name: string = "", type: string = "") {
        return this.characterService.get_Skills(this.get_Creature(), name, type);
    }

    get_Traits(traitName: string = "") {
        return this.traitsService.get_Traits(traitName);
    }

    get_HintRunes(weapon: Weapon, range: string) {
        //Return all runes and rune-emulating oil effects that have a hint to show
        let runes: WeaponRune[] = [];
        let runeSource = weapon.get_RuneSource(this.get_Creature(), range);
        runes.push(...runeSource[1].propertyRunes.filter((rune: WeaponRune) => rune.hints.length) as WeaponRune[]);
        runes.push(...weapon.oilsApplied.filter(oil => oil.runeEffect && oil.runeEffect.hints.length).map(oil => oil.runeEffect));
        if (runeSource[1].bladeAlly) {
            runes.push(...runeSource[1].bladeAllyRunes.filter((rune: WeaponRune) => rune.hints.length) as WeaponRune[]);
        }
        return runes;
    }

    get_Runes(weapon: Weapon, range: string) {
        //Return all runes and rune-emulating oil effects
        let runes: WeaponRune[] = [];
        let runeSource = weapon.get_RuneSource(this.get_Creature(), range);
        runes.push(...weapon.get_RuneSource(this.get_Creature(), range)[1].propertyRunes as WeaponRune[]);
        runes.push(...weapon.oilsApplied.filter(oil => oil.runeEffect).map(oil => oil.runeEffect));
        if (runeSource[1].bladeAlly) {
            runes.push(...runeSource[1].bladeAllyRunes as WeaponRune[]);
        }
        return runes;
    }

    get_HandwrapsOfMightyBlows(weapon: Weapon) {
        if (weapon.traits.includes("Unarmed")) {
            let handwraps = this.get_Creature().inventories[0].wornitems.find(wornItem => wornItem.isHandwrapsOfMightyBlows && wornItem.invested);
            if (handwraps) {
                return [handwraps];
            } else {
                return [];
            }
        } else {
            return [];
        }
    }

    get_GrievousData(weapon: Weapon, rune: WeaponRune) {
        let data = rune.data.filter(data => data.name == weapon.group);
        if (data.length) {
            return data[0].value;
        }
    }

    get_SpecialShowon(weapon: Weapon, range: string) {
        //Under certain circumstances, some Feats apply to Weapons independently of their name.
        //Return names that get_FeatsShowingOn should run on
        let specialNames: string[] = []
        if (weapon.traits.includes("Monk") && this.characterService.get_Feats("Monastic Weaponry")[0].have(this.get_Creature(), this.characterService)) {
            specialNames.push("Unarmed Attacks");
        }
        let creature = this.get_Creature();
        specialNames.push(weapon.get_Proficiency(creature, this.characterService, creature.level));
        specialNames.push(...weapon.get_Traits(this.characterService, creature));
        specialNames.push(range)
        specialNames.push(weapon.weaponBase)
        return specialNames;
    }

    get_Attacks(weapon: Weapon) {
        return []
            .concat((weapon.melee ? [weapon.attack(this.get_Creature(), this.characterService, this.effectsService, 'melee')] : []))
            .concat(((weapon.ranged || weapon.traits.find(trait => trait.includes("Thrown"))) ? [weapon.attack(this.get_Creature(), this.characterService, this.effectsService, 'ranged')] : []));
    }

    get_Damage(weapon: Weapon, range: string) {
        return weapon.damage(this.get_Creature(), this.characterService, this.effectsService, range);
    }

    get_FlurryAllowed() {
        let creature = this.get_Creature();
        let character = this.characterService.get_Character();
        this.conditionsService.get_AppliedConditions(creature, this.characterService, creature.conditions, true).filter(gain => gain.name == "Hunt Prey").length
        if (creature.type == "Character" || (creature.type == "Companion" && character.get_FeatsTaken(1, character.level, "Animal Companion (Ranger)").length)) {
            return (
                (
                    character.get_FeatsTaken(1, character.level, "Flurry").length &&
                    this.conditionsService.get_AppliedConditions(character, this.characterService, character.conditions, true).filter(gain => gain.name == "Hunt Prey").length
                ) ||
                this.conditionsService.get_AppliedConditions(character, this.characterService, character.conditions, true).filter(gain => gain.name == "Hunt Prey: Flurry").length
            )
        } else {
            return this.conditionsService.get_AppliedConditions(character, this.characterService, character.conditions, true).filter(gain => gain.name == "Hunt Prey: Flurry").length;
        }
    }

    get_MultipleAttackPenalty() {
        let creature = this.get_Creature();
        let conditions: ConditionGain[] = this.conditionsService.get_AppliedConditions(creature, this.characterService, creature.conditions, true)
            .filter(gain => ["Multiple Attack Penalty", "Multiple Attack Penalty (Flurry)"].includes(gain.name) && gain.source == "Quick Status");
        if (conditions.some(gain => gain.name == "Multiple Attack Penalty (Flurry)" && gain.choice == "Third Attack")) {
            return "3f";
        }
        if (conditions.some(gain => gain.name == "Multiple Attack Penalty" && gain.choice == "Third Attack")) {
            return "3";
        }
        if (conditions.some(gain => gain.name == "Multiple Attack Penalty (Flurry)" && gain.choice == "Second Attack")) {
            return "2f";
        }
        if (conditions.some(gain => gain.name == "Multiple Attack Penalty" && gain.choice == "Second Attack")) {
            return "2";
        }
        return "1";
    }

    set_MultipleAttackPenalty(map: "1" | "2" | "3" | "2f" | "3f") {
        let creature = this.get_Creature();
        let conditions: ConditionGain[] = this.conditionsService.get_AppliedConditions(creature, this.characterService, creature.conditions, true)
            .filter(gain => ["Multiple Attack Penalty", "Multiple Attack Penalty (Flurry)"].includes(gain.name) && gain.source == "Quick Status");
        let map2 = conditions.find(gain => gain.name == "Multiple Attack Penalty" && gain.choice == "Second Attack");
        let map3 = conditions.find(gain => gain.name == "Multiple Attack Penalty" && gain.choice == "Third Attack");
        let map2f = conditions.find(gain => gain.name == "Multiple Attack Penalty (Flurry)" && gain.choice == "Second Attack");
        let map3f = conditions.find(gain => gain.name == "Multiple Attack Penalty (Flurry)" && gain.choice == "Third Attack");
        let mapName: string = "";
        let mapChoice: string = "";
        switch (map) {
            case "2":
                if (!map2) {
                    mapName = "Multiple Attack Penalty";
                    mapChoice = "Second Attack";
                }
                break;
            case "3":
                if (!map3) {
                    mapName = "Multiple Attack Penalty";
                    mapChoice = "Third Attack";
                }
                break;
            case "2f":
                if (!map2f) {
                    mapName = "Multiple Attack Penalty (Flurry)";
                    mapChoice = "Second Attack";
                }
                break;
            case "3f":
                if (!map3f) {
                    mapName = "Multiple Attack Penalty (Flurry)";
                    mapChoice = "Third Attack";
                }
                break;
        }
        if (map2 && map != "2") {
            this.characterService.remove_Condition(creature, map2, false);
        }
        if (map3 && map != "3") {
            this.characterService.remove_Condition(creature, map3, false);
        }
        if (map2f && map != "2f") {
            this.characterService.remove_Condition(creature, map2f, false);
        }
        if (map3f && map != "3f") {
            this.characterService.remove_Condition(creature, map3f, false);
        }
        if (mapName) {
            let newCondition: ConditionGain = Object.assign(new ConditionGain(), { name: mapName, choice: mapChoice, source: "Quick Status", duration: 5, locked: true })
            this.characterService.add_Condition(creature, newCondition, false);
        }
        this.characterService.process_ToChange();
    }

    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.characterService.get_Changed()
                .subscribe((target) => {
                    if (["attacks", "all", this.creature.toLowerCase()].includes(target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                    }
                });
            this.characterService.get_ViewChanged()
                .subscribe((view) => {
                    if (view.creature.toLowerCase() == this.creature.toLowerCase() && ["attacks", "all"].includes(view.target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                    }
                });
            return true;
        }
    }

    ngOnInit() {
        this.finish_Loading();
    }

}
