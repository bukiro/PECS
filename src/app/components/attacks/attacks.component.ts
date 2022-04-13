import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, Input } from '@angular/core';
import { Weapon } from 'src/app/classes/Weapon';
import { TraitsService } from 'src/app/services/traits.service';
import { CharacterService } from 'src/app/services/character.service';
import { EffectsService } from 'src/app/services/effects.service';
import { WeaponRune } from 'src/app/classes/WeaponRune';
import { Character } from 'src/app/classes/Character';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { Ammunition } from 'src/app/classes/Ammunition';
import { ItemCollection } from 'src/app/classes/ItemCollection';
import { Talisman } from 'src/app/classes/Talisman';
import { AlchemicalBomb } from 'src/app/classes/AlchemicalBomb';
import { Consumable } from 'src/app/classes/Consumable';
import { Snare } from 'src/app/classes/Snare';
import { SpellGain } from 'src/app/classes/SpellGain';
import { AlchemicalPoison } from 'src/app/classes/AlchemicalPoison';
import { OtherConsumableBomb } from 'src/app/classes/OtherConsumableBomb';
import { Equipment } from 'src/app/classes/Equipment';
import { ConditionsService } from 'src/app/services/conditions.service';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { WeaponMaterial } from 'src/app/classes/WeaponMaterial';
import { Hint } from 'src/app/classes/Hint';
import { DeitiesService } from 'src/app/services/deities.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { Subscription } from 'rxjs';
import { ActivitiesService } from 'src/app/services/activities.service';
import { AttackRestriction } from 'src/app/classes/AttackRestriction';

interface WeaponParameters {
    weapon: Weapon | AlchemicalBomb | OtherConsumableBomb;
    asBomb: AlchemicalBomb | OtherConsumableBomb;
}

@Component({
    selector: 'app-attacks',
    templateUrl: './attacks.component.html',
    styleUrls: ['./attacks.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AttacksComponent implements OnInit, OnDestroy {

    @Input()
    public creature: string = "Character";
    @Input()
    public sheetSide: string = "left";
    public onlyAttacks: AttackRestriction[] = [];
    public forbiddenAttacks: AttackRestriction[] = [];
    public showRestricted: boolean = false;
    private showItem: string = "";
    private showList: string = "";

    constructor(
        private changeDetector: ChangeDetectorRef,
        private traitsService: TraitsService,
        private deitiesService: DeitiesService,
        public characterService: CharacterService,
        private refreshService: RefreshService,
        private activitiesService: ActivitiesService,
        public effectsService: EffectsService,
        public conditionsService: ConditionsService
    ) { }

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

    get_ManualMode() {
        return this.characterService.get_ManualMode();
    }

    still_loading() {
        return this.characterService.still_loading();
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    get_Creature(type: string = this.creature) {
        return this.characterService.get_Creature(type) as Character | AnimalCompanion;
    }

    get_InventoryTileMode() {
        return this.get_Character().settings.inventoryTileMode;
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

    toggle_Item(id: string = "") {
        if (this.showItem == id) {
            this.showItem = "";
        } else {
            this.showItem = id;
        }
    }

    get_ShowItem() {
        return this.showItem;
    }

    get_HeightenedHint(hint: Hint) {
        return hint.get_Heightened(hint.desc, this.get_Character().level);
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
                    .filter(restriction => !restriction.excluding && (!restriction.conditionChoiceFilter.length || restriction.conditionChoiceFilter.includes(gain.choice)))
            );
            this.forbiddenAttacks.push(
                ...condition?.attackRestrictions
                    .filter(restriction => restriction.excluding && (!restriction.conditionChoiceFilter.length || restriction.conditionChoiceFilter.includes(gain.choice)))
            );
        });
    }

    get_IsAllowed(weapon: Weapon) {
        const creature = this.get_Creature();
        const characterService = this.characterService;
        function doesListMatchWeapon(list: AttackRestriction[], weapon: Weapon) {
            return list.some(restriction => {
                if (restriction.name) {
                    return restriction.name == weapon.name;
                } else if (restriction.special) {
                    switch (restriction.special) {
                        case "Favored Weapon":
                            return weapon.get_IsFavoredWeapon(creature, characterService);
                    }
                }
            })
        }
        return (
            !(
                this.onlyAttacks.length && !doesListMatchWeapon(this.onlyAttacks, weapon)
            ) &&
            !doesListMatchWeapon(this.forbiddenAttacks, weapon)
        );
    }

    get_EquippedWeaponsParameters(): WeaponParameters[] {
        this.get_AttackRestrictions();
        return this.get_Creature().inventories[0].weapons.filter(weapon => weapon.equipped && weapon.equippable && !weapon.broken)
            .concat(...this.get_Creature().inventories.map(inv => inv.alchemicalbombs))
            .concat(...this.get_Creature().inventories.map(inv => inv.otherconsumablesbombs))
            .sort((a, b) => (a.name == b.name) ? 0 : ((a.name > b.name) ? 1 : -1))
            .sort((a, b) => (a.type == b.type) ? 0 : ((a.type < b.type) ? 1 : -1))
            .map(weapon => ({
                weapon: weapon,
                asBomb: this.weaponAsBomb(weapon),
            }));
    }

    get_TalismanTitle(talisman: Talisman, withCord: boolean = false) {
        return (talisman.trigger ? "Trigger: " + talisman.trigger + "\n\n" : "") + talisman.desc +
            (withCord ? "\n\nWhen you activate a talisman threaded through a cord with the same magic school trait that's also the cord's level or lower, attempt a DC 16 flat check. On a success, that talisman is not consumed and can be used again." : "");
    }

    get_HaveMatchingTalismanCord(weapon: Weapon, talisman: Talisman) {
        return weapon.talismanCords.some(cord => cord.get_CompatibleWithTalisman(talisman));
    }

    get_PoisonTitle(poison: AlchemicalPoison) {
        return poison.desc;
    }

    get_TwoHandedAllowed(weapon: Weapon) {
        return weapon._traits.some(trait => trait.toLowerCase().includes("two-handed"));
    }

    on_EquipmentChange(item: Equipment) {
        this.refreshService.set_ItemViewChanges(this.get_Creature(), item, { characterService: this.characterService, activitiesService: this.activitiesService });
        this.refreshService.process_ToChange();
    }

    on_TalismanUse(weapon: Weapon, talisman: Talisman, index: number, preserve: boolean = false) {
        this.refreshService.set_ToChange(this.creature, "attacks");
        this.characterService.on_ConsumableUse(this.get_Creature(), talisman, preserve);
        if (!preserve) {
            weapon.talismans.splice(index, 1);
        }
        this.refreshService.process_ToChange();
    }

    on_PoisonUse(weapon: Weapon, poison: AlchemicalPoison) {
        this.refreshService.set_ToChange(this.creature, "attacks");
        this.characterService.on_ConsumableUse(this.get_Creature(), poison);
        weapon.poisonsApplied.length = 0;
        this.refreshService.process_ToChange();
    }

    get_AmmoTypes(): string[] {
        return Array.from(new Set(
            this.get_EquippedWeaponsParameters()
                .map(weaponParameters => weaponParameters.weapon.ammunition)
                .filter(ammunition => !!ammunition)
        ));
    }

    public get_Ammo(type: string): { item: Ammunition, name: string, inventory: ItemCollection }[] {
        //Return all ammo from all inventories that has this type in its group
        //We need the inventory for using up items and the name just for sorting
        let ammoList: { item: Ammunition, name: string, inventory: ItemCollection }[] = [];
        this.get_Creature().inventories.forEach(inv => {
            inv.ammunition.filter(ammo => [type, "Any"].includes(ammo.ammunition)).forEach(ammo => {
                ammoList.push({ item: ammo, name: ammo.get_Name(), inventory: inv })
            })
        });
        return ammoList
            .sort((a, b) => (a.name == b.name) ? 0 : ((a.name > b.name) ? 1 : -1));
    }

    get_Snares() {
        let snares: { item: Snare, name: string, inventory: ItemCollection }[] = [];
        this.get_Creature().inventories.forEach(inv => {
            inv.snares.forEach(snare => {
                snares.push({ item: snare, name: snare.get_Name(), inventory: inv })
            })
        });
        return snares
            .sort((a, b) => (a.name == b.name) ? 0 : ((a.name > b.name) ? 1 : -1));
    }

    get_Spells(name: string = "", type: string = "", tradition: string = "") {
        return this.characterService.spellsService.get_Spells(name, type, tradition);
    }

    onConsumableUse(item: Ammunition | AlchemicalBomb | OtherConsumableBomb | Snare, inv: ItemCollection) {
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
                    this.characterService.spellsService.process_Spell(spell, true,
                        { characterService: this.characterService, itemsService: this.characterService.itemsService, conditionsService: this.characterService.conditionsService },
                        { creature: this.get_Character(), target: target, gain: tempGain, level: spellChoice.level },
                        { manual: true }
                    )
                }
                spellChoice.spells.shift();
            }
        }
        this.characterService.on_ConsumableUse(this.get_Creature(), item as Consumable);
        if (item.can_Stack()) {
            this.refreshService.set_ToChange(this.creature, "attacks");
            this.refreshService.process_ToChange();
        } else {
            this.characterService.drop_InventoryItem(this.get_Creature(), inv, item, true);
        }
    }

    public weaponAsBomb(weapon: Weapon): AlchemicalBomb | OtherConsumableBomb {
        return (weapon instanceof AlchemicalBomb || weapon instanceof OtherConsumableBomb) ? weapon : null;
    }

    get_Skills(name: string = "", type: string = "") {
        return this.characterService.get_Skills(this.get_Creature(), name, { type: type });
    }

    get_Traits(traitName: string = "") {
        return this.traitsService.get_Traits(traitName);
    }

    get_HintRunes(weapon: Weapon, range: string): WeaponRune[] {
        //Return all runes and rune-emulating effects that have a hint to show.
        let runeSource = weapon.get_RuneSource(this.get_Creature(), range);
        return (runeSource.propertyRunes.propertyRunes.filter(rune => rune.hints.length) as WeaponRune[])
            .concat(weapon.oilsApplied.filter(oil => oil.runeEffect && oil.runeEffect.hints.length).map(oil => oil.runeEffect))
            .concat(
                runeSource.propertyRunes.bladeAlly ?
                    runeSource.propertyRunes.bladeAllyRunes.filter(rune => rune.hints.length) as WeaponRune[] :
                    []
            )
    }

    get_Runes(weapon: Weapon, range: string) {
        //Return all runes and rune-emulating oil effects.
        let runes: WeaponRune[] = [];
        let runeSource = weapon.get_RuneSource(this.get_Creature(), range);
        runes.push(...weapon.get_RuneSource(this.get_Creature(), range).propertyRunes.propertyRunes as WeaponRune[]);
        runes.push(...weapon.oilsApplied.filter(oil => oil.runeEffect).map(oil => oil.runeEffect));
        if (runeSource.propertyRunes.bladeAlly) {
            runes.push(...runeSource.propertyRunes.bladeAllyRunes as WeaponRune[]);
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

    get_GrievousData(weapon: Weapon, rune: WeaponRune): string {
        let data = rune.data.find(data => data.name == weapon.group);
        return data?.value as string || null;
    }

    get_SpecialShowon(weapon: Weapon, range: string) {
        //Under certain circumstances, some Feats apply to Weapons independently of their name.
        //Return names that get_FeatsShowingOn should run on.
        let specialNames: string[] = []
        //Monks with Monastic Weaponry can apply Unarmed effects to Monk weapons.
        if (weapon.traits.includes("Monk") && this.characterService.get_Feats("Monastic Weaponry")[0].have(this.get_Creature(), this.characterService)) {
            specialNames.push("Unarmed Attacks");
        }
        //Deity's favored weapons get tagged as "Favored Weapon".
        if (weapon.get_IsFavoredWeapon(this.get_Character(), this.characterService)) {
            specialNames.push("Favored Weapon");
        }
        //Weapons with Emblazon Armament get tagged as "Emblazon Armament Weapon".
        if (weapon._emblazonArmament) {
            weapon.emblazonArmament.forEach(ea => {
                if (ea.type == "emblazonArmament") {
                    specialNames.push("Emblazon Armament Weapon");
                }
            })
        }
        //Weapons with Emblazon Energy get tagged as "Emblazon Energy Weapon <Choice>".
        if (weapon._emblazonEnergy) {
            weapon.emblazonArmament.forEach(ea => {
                if (ea.type == "emblazonEnergy") {
                    specialNames.push("Emblazon Energy Weapon " + ea.choice);
                }
            })
        }
        //Weapons with Emblazon Antimagic get tagged as "Emblazon Antimagic Weapon".
        if (weapon._emblazonAntimagic) {
            weapon.emblazonArmament.forEach(ea => {
                if (ea.type == "emblazonAntimagic") {
                    specialNames.push("Emblazon Antimagic Weapon");
                }
            })
        }

        let creature = this.get_Creature();
        specialNames.push(weapon.get_Proficiency(creature, this.characterService, creature.level));
        specialNames.push(...weapon._traits);
        specialNames.push(range);
        specialNames.push(weapon.weaponBase);
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
        if (creature === character || (creature instanceof AnimalCompanion && this.characterService.get_CharacterFeatsTaken(1, character.level, "Animal Companion (Ranger)").length)) {
            return (
                (
                    this.characterService.get_CharacterFeatsTaken(1, character.level, "Flurry").length &&
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
        for (let gain of conditions) {
            if (gain.name == "Multiple Attack Penalty (Flurry)") {
                switch (gain.choice) {
                    case "Third Attack": return "3f";
                    case "Second Attack": return "2f";
                }
            }
            if (gain.name == "Multiple Attack Penalty") {
                switch (gain.choice) {
                    case "Third Attack": return "3";
                    case "Second Attack": return "2";
                }
            }
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
            this.characterService.add_Condition(creature, newCondition, {}, { noReload: true });
        }
        this.refreshService.process_ToChange();
    }

    get_RangePenalty() {
        let creature = this.get_Creature();
        let conditions: ConditionGain[] = this.conditionsService.get_AppliedConditions(creature, this.characterService, creature.conditions, true)
            .filter(gain => gain.name == "Range Penalty" && gain.source == "Quick Status");
        for (let gain of conditions) {
            switch (gain.choice) {
                case "Sixth Range Increment": return "6";
                case "Fifth Range Increment": return "5";
                case "Fourth Range Increment": return "4";
                case "Third Range Increment": return "3";
                case "Second Range Increment": return "2";
            }
        }
        return "1";
    }

    set_RangePenalty(rap: "1" | "2" | "3" | "4" | "5" | "6") {
        let creature = this.get_Creature();
        let conditions: ConditionGain[] = this.conditionsService.get_AppliedConditions(creature, this.characterService, creature.conditions, true)
            .filter(gain => gain.name == "Range Penalty" && gain.source == "Quick Status");
        let rap2 = conditions.find(gain => gain.choice == "Second Range Increment");
        let rap3 = conditions.find(gain => gain.choice == "Third Range Increment");
        let rap4 = conditions.find(gain => gain.choice == "Fourth Range Increment");
        let rap5 = conditions.find(gain => gain.choice == "Fifth Range Increment");
        let rap6 = conditions.find(gain => gain.choice == "Sixth Range Increment");
        let rapChoice: string = "";
        switch (rap) {
            case "2":
                if (!rap2) {
                    rapChoice = "Second Range Increment";
                }
                break;
            case "3":
                if (!rap3) {
                    rapChoice = "Third Range Increment";
                }
                break;
            case "4":
                if (!rap4) {
                    rapChoice = "Fourth Range Increment";
                }
                break;
            case "5":
                if (!rap5) {
                    rapChoice = "Fifth Range Increment";
                }
                break;
            case "6":
                if (!rap6) {
                    rapChoice = "Sixth Range Increment";
                }
                break;
        }
        if (rap2 && rap != "2") {
            this.characterService.remove_Condition(creature, rap2, false);
        }
        if (rap3 && rap != "3") {
            this.characterService.remove_Condition(creature, rap3, false);
        }
        if (rap4 && rap != "4") {
            this.characterService.remove_Condition(creature, rap4, false);
        }
        if (rap5 && rap != "5") {
            this.characterService.remove_Condition(creature, rap5, false);
        }
        if (rap6 && rap != "6") {
            this.characterService.remove_Condition(creature, rap6, false);
        }
        if (rapChoice) {
            let newCondition: ConditionGain = Object.assign(new ConditionGain(), { name: "Range Penalty", choice: rapChoice, source: "Quick Status", duration: 5, locked: true })
            this.characterService.add_Condition(creature, newCondition, {}, { noReload: true });
        }
        this.refreshService.process_ToChange();
    }

    get_FavoredWeapons() {
        let creature = this.get_Creature();
        if (creature instanceof Character && creature.class?.deity && creature.class.deityFocused) {
            let deity = this.deitiesService.get_CharacterDeities(this.characterService, creature)[0];
            let favoredWeapons: string[] = [];
            if (deity && deity.favoredWeapon.length) {
                favoredWeapons.push(...deity.favoredWeapon);
            }
            if (this.characterService.get_CharacterFeatsTaken(1, creature.level, "Favored Weapon (Syncretism)").length) {
                favoredWeapons.push(...this.characterService.get_CharacterDeities(creature, "syncretism")[0]?.favoredWeapon || []);
            }
            return [favoredWeapons];
        }
        return [];
    }

    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.changeSubscription = this.refreshService.get_Changed
                .subscribe((target) => {
                    if (["attacks", "all", this.creature.toLowerCase()].includes(target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                    }
                });
            this.viewChangeSubscription = this.refreshService.get_ViewChanged
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

    private changeSubscription: Subscription;
    private viewChangeSubscription: Subscription;

    ngOnDestroy() {
        this.changeSubscription?.unsubscribe();
        this.viewChangeSubscription?.unsubscribe();
    }

}
