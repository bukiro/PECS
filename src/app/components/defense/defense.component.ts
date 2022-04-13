import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input, OnDestroy } from '@angular/core';
import { DefenseService } from 'src/app/services/defense.service';
import { TraitsService } from 'src/app/services/traits.service';
import { Armor } from 'src/app/classes/Armor';
import { EffectsService } from 'src/app/services/effects.service';
import { CharacterService } from 'src/app/services/character.service';
import { AbilitiesService } from 'src/app/services/abilities.service';
import { Character } from 'src/app/classes/Character';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { Talisman } from 'src/app/classes/Talisman';
import { Shield } from 'src/app/classes/Shield';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { ConditionsService } from 'src/app/services/conditions.service';
import { ToastService } from 'src/app/services/toast.service';
import { Hint } from 'src/app/classes/Hint';
import { ArmorRune } from 'src/app/classes/ArmorRune';
import { RefreshService } from 'src/app/services/refresh.service';
import { Subscription } from 'rxjs';
import { WornItem } from 'src/app/classes/WornItem';
import { Trait } from 'src/app/classes/Trait';
import { Skill } from 'src/app/classes/Skill';
import { AC, CalculatedAC } from 'src/app/classes/AC';
import { Creature } from 'src/app/classes/Creature';
import { Specialization } from 'src/app/classes/Specialization';
import { InputValidationService } from 'src/app/services/inputValidation.service';

@Component({
    selector: 'app-defense',
    templateUrl: './defense.component.html',
    styleUrls: ['./defense.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DefenseComponent implements OnInit, OnDestroy {

    @Input()
    creature: string = "Character";
    @Input()
    public sheetSide: string = "left";
    public shieldDamage: number = 0;

    constructor(
        private changeDetector: ChangeDetectorRef,
        public characterService: CharacterService,
        private refreshService: RefreshService,
        private defenseService: DefenseService,
        private traitsService: TraitsService,
        private conditionsService: ConditionsService,
        public effectsService: EffectsService,
        public abilitiesService: AbilitiesService,
        public toastService: ToastService
    ) { }

    public minimize(): void {
        this.characterService.get_Character().settings.defenseMinimized = !this.characterService.get_Character().settings.defenseMinimized;
    }

    public get_Minimized(): boolean {
        switch (this.creature) {
            case "Character":
                return this.characterService.get_Character().settings.defenseMinimized;
            case "Companion":
                return this.characterService.get_Character().settings.companionMinimized;
            case "Familiar":
                return this.characterService.get_Character().settings.familiarMinimized;
        }
    }

    public trackByIndex(index: number, obj: any): number {
        return index;
    }

    public get_ArmorSpecialization(armor: Armor | WornItem): Specialization[] {
        if (armor instanceof Armor) {
            return armor.get_ArmorSpecialization(this.get_Creature(), this.characterService);
        }
        //No armor specializations for bracers of armor.
        return []
    }

    private get_Character(): Character {
        return this.characterService.get_Character();
    }

    private get_Creature(): Creature {
        return this.characterService.get_Creature(this.creature);
    }

    private get_AC(): AC {
        return this.defenseService.get_AC();
    }

    public positiveNumbersOnly(event: KeyboardEvent): boolean {
        return InputValidationService.positiveNumbersOnly(event);
    }

    public get_CalculatedAC(): CalculatedAC {
        return this.get_AC().calculate(this.get_Creature(), this.characterService, this.defenseService, this.effectsService);
    }

    public get_Cover(): number {
        let creature = this.get_Creature();
        let conditions: ConditionGain[] = this.conditionsService.get_AppliedConditions(creature, this.characterService, creature.conditions, true)
            .filter(gain => gain.name == "Cover" && gain.source == "Quick Status");
        if (conditions.some(gain => gain.name == "Cover" && gain.choice == "Greater")) {
            return 4;
        }
        if (conditions.some(gain => gain.name == "Cover" && gain.choice == "Standard")) {
            return 2;
        }
        if (conditions.some(gain => gain.name == "Cover" && gain.choice == "Lesser")) {
            return 1;
        }
        return 0;
    }

    public set_Cover(cover: number, shield: Shield = null): void {
        this.get_AC().set_Cover(this.get_Creature(), cover, shield, this.characterService, this.conditionsService);
    }

    public raise_Shield(raised: boolean = false, shield: Shield): void {
        if (shield) {
            shield.raised = raised;
            if (!raised && shield.takingCover) {
                this.set_Cover(0, shield);
            }
            this.set_DefenseChanged();
        }
    }

    public get_FlatFooted(): ConditionGain {
        let creature = this.get_Creature();
        return this.conditionsService.get_AppliedConditions(creature, this.characterService, creature.conditions, true)
            .find(gain => gain.name == "Flat-Footed" && gain.source == "Quick Status");
    }

    public set_FlatFooted(active: boolean): void {
        let creature = this.get_Creature();
        let flatFooted = this.get_FlatFooted();
        if (active) {
            if (!flatFooted) {
                let newCondition: ConditionGain = Object.assign(new ConditionGain(), { name: "Flat-Footed", source: "Quick Status", duration: -1, locked: true })
                this.characterService.add_Condition(creature, newCondition, {}, { noReload: true });
            }
        } else {
            if (flatFooted) {
                this.characterService.remove_Condition(creature, flatFooted, false);
            }
        }
        this.refreshService.process_ToChange();
    }

    public get_Hidden(): ConditionGain {
        let creature = this.get_Creature();
        return this.conditionsService.get_AppliedConditions(creature, this.characterService, creature.conditions, true)
            .find(gain => gain.name == "Hidden" && gain.source == "Quick Status");
    }

    public set_Hidden(active: boolean): void {
        let creature = this.get_Creature();
        let hidden = this.get_Hidden();
        if (active) {
            if (!hidden) {
                let newCondition: ConditionGain = Object.assign(new ConditionGain(), { name: "Hidden", source: "Quick Status", duration: -1, locked: true })
                this.characterService.add_Condition(creature, newCondition, {}, { noReload: true });
            }
        } else {
            if (hidden) {
                this.characterService.remove_Condition(creature, hidden, false);
            }
        }
        this.refreshService.process_ToChange();
    }

    public get_EquippedArmor(): (Armor | WornItem)[] {
        return []
            .concat(this.defenseService.get_EquippedArmor(this.get_Creature()))
            .concat(this.defenseService.get_EquippedBracersOfArmor(this.get_Creature()));
    }

    public get_HintRunes(armor: Armor | WornItem): ArmorRune[] {
        //Return all runes and rune-emulating oil effects that have a hint to show
        let runes: ArmorRune[] = [];
        runes.push(...armor.propertyRunes.filter((rune: ArmorRune) => rune.hints.length) as ArmorRune[]);
        return runes;
    }

    public get_HeightenedHint(hint: Hint): string {
        return hint.get_Heightened(hint.desc, this.get_Character().level);
    }

    public get_EquippedShield(): Shield[] {
        return this.defenseService.get_EquippedShield(this.get_Creature());
    }

    public on_ShieldHPChange(shield: Shield, amount: number): void {
        shield.damage += amount;
        if (shield.get_HitPoints() < shield.get_BrokenThreshold()) {
            shield.broken = true;
            this.characterService.on_Equip(this.get_Creature() as Character | AnimalCompanion, this.get_Creature().inventories[0], shield, false, false, true)
            this.toastService.show("Your shield broke and was unequipped.")
        } else {
            shield.broken = false;
        }
        this.refreshService.set_ToChange(this.creature, "inventory");
        this.refreshService.set_ToChange(this.creature, "defense");
        this.refreshService.process_ToChange();
    }

    public get_Skills(type: string): Skill[] {
        return this.characterService.get_Skills(this.get_Creature(), "", { type: type })
            .sort((a, b) => (a.name == b.name) ? 0 : ((a.name > b.name) ? 1 : -1));
    }

    public get_Traits(traitName: string = ""): Trait[] {
        return this.traitsService.get_Traits(traitName);
    }

    public get_TalismanTitle(talisman: Talisman): string {
        return (talisman.trigger ? "Trigger: " + talisman.trigger + "\n\n" : "") + talisman.desc;
    }

    public get_HaveMatchingTalismanCord(item: Armor | Shield | WornItem, talisman: Talisman): boolean {
        return item.talismanCords.some(cord => cord.get_CompatibleWithTalisman(talisman));
    }

    public on_TalismanUse(item: Armor | Shield | WornItem, talisman: Talisman, index: number, preserve: boolean = false): void {
        this.refreshService.set_ToChange(this.creature, "defense");
        this.characterService.on_ConsumableUse(this.get_Creature() as Character | AnimalCompanion, talisman, preserve);
        if (!preserve) {
            item.talismans.splice(index, 1)
        }
        this.refreshService.process_ToChange();
    }

    public get_SpecialShowon(item: Armor | Shield | WornItem, savingThrows: boolean = false): string[] {
        //Under certain circumstances, some Feats apply to Armnor, Shield or Saving Throws independently of their name.
        //Return names that get_FeatsShowingOn should run on.
        let specialNames: string[] = []
        if (item instanceof Shield) {
            //Shields with Emblazon Armament get tagged as "Emblazon Armament Shield".
            if (item instanceof Shield && item._emblazonArmament) {
                item.emblazonArmament.forEach(ea => {
                    if (ea.type == "emblazonArmament") {
                        specialNames.push("Emblazon Armament Shield");
                    }
                })
            }
            //Shields with Emblazon Energy get tagged as "Emblazon Energy Shield <Choice>".
            if (item instanceof Shield && item._emblazonEnergy) {
                item.emblazonArmament.forEach(ea => {
                    if (ea.type == "emblazonEnergy") {
                        specialNames.push("Emblazon Energy Shield " + ea.choice);
                    }
                })
            }
            //Shields with Emblazon Antimagic get tagged as "Emblazon Antimagic Shield".
            if (item instanceof Shield && item._emblazonAntimagic) {
                item.emblazonArmament.forEach(ea => {
                    if (ea.type == "emblazonAntimagic") {
                        specialNames.push("Emblazon Antimagic Shield");
                    }
                })
            }
        }
        //Return the same name for Saving Throws if the shield applies.
        if (savingThrows) {
            this.get_EquippedShield().forEach(shield => {
                if (shield._emblazonEnergy) {
                    shield.emblazonArmament.filter(ea => ea.type == "emblazonEnergy").forEach(ea => {
                        specialNames.push("Emblazon Energy Shield " + ea.choice);
                    })
                }
                if (shield._emblazonAntimagic) {
                    shield.emblazonArmament.filter(ea => ea.type == "emblazonAntimagic").forEach(ea => {
                        specialNames.push("Emblazon Antimagic Shield");
                    })
                }
            })
        }
        return specialNames;
    }

    private set_DefenseChanged(): void {
        this.refreshService.set_ToChange(this.creature, "effects");
        this.refreshService.process_ToChange();
    }

    public still_loading(): boolean {
        return this.characterService.still_loading()
    }

    private finish_Loading(): boolean {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.changeSubscription = this.refreshService.get_Changed
                .subscribe((target) => {
                    if (["defense", "all", this.creature.toLowerCase()].includes(target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                    }
                });
            this.viewChangeSubscription = this.refreshService.get_ViewChanged
                .subscribe((view) => {
                    if (view.creature.toLowerCase() == this.creature.toLowerCase() && ["defense", "all"].includes(view.target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                    }
                });
            return true;
        }
    }

    public ngOnInit(): void {
        this.finish_Loading();
    }

    private changeSubscription: Subscription;
    private viewChangeSubscription: Subscription;

    public ngOnDestroy(): void {
        this.changeSubscription?.unsubscribe();
        this.viewChangeSubscription?.unsubscribe();
    }

}
