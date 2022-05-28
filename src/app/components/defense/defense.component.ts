import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input, OnDestroy } from '@angular/core';
import { DefenseService } from 'src/app/services/defense.service';
import { TraitsService } from 'src/app/services/traits.service';
import { Armor } from 'src/app/classes/Armor';
import { EffectsService } from 'src/app/services/effects.service';
import { CharacterService } from 'src/app/services/character.service';
import { AbilitiesDataService } from 'src/app/core/services/data/abilities-data.service';
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
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DefenseComponent implements OnInit, OnDestroy {

    @Input()
    creature = 'Character';
    @Input()
    public sheetSide = 'left';
    public shieldDamage = 0;

    private changeSubscription: Subscription;
    private viewChangeSubscription: Subscription;

    constructor(
        private readonly changeDetector: ChangeDetectorRef,
        public characterService: CharacterService,
        private readonly refreshService: RefreshService,
        private readonly defenseService: DefenseService,
        private readonly traitsService: TraitsService,
        private readonly conditionsService: ConditionsService,
        public effectsService: EffectsService,
        public abilitiesService: AbilitiesDataService,
        public toastService: ToastService,
    ) { }

    public minimize(): void {
        this.characterService.character.settings.defenseMinimized = !this.characterService.character.settings.defenseMinimized;
    }

    public get_Minimized(): boolean {
        switch (this.creature) {
            case 'Character':
                return this.characterService.character.settings.defenseMinimized;
            case 'Companion':
                return this.characterService.character.settings.companionMinimized;
            case 'Familiar':
                return this.characterService.character.settings.familiarMinimized;
        }
    }

    public trackByIndex(index: number): number {
        return index;
    }

    public get_ArmorSpecialization(armor: Armor | WornItem): Array<Specialization> {
        if (armor instanceof Armor) {
            return armor.armorSpecializations(this.get_Creature(), this.characterService);
        }

        //No armor specializations for bracers of armor.
        return [];
    }

    private get_Character(): Character {
        return this.characterService.character;
    }

    private get_Creature(): Creature {
        return this.characterService.creatureFromType(this.creature);
    }

    private get_AC(): AC {
        return this.defenseService.armorClass();
    }

    public positiveNumbersOnly(event: KeyboardEvent): boolean {
        return InputValidationService.positiveNumbersOnly(event);
    }

    public get_CalculatedAC(): CalculatedAC {
        return this.get_AC().calculate(this.get_Creature(), this.characterService, this.defenseService, this.effectsService);
    }

    public get_Cover(): number {
        const creature = this.get_Creature();
        const conditions: Array<ConditionGain> = this.conditionsService.currentCreatureConditions(creature, this.characterService, creature.conditions, true)
            .filter(gain => gain.name == 'Cover' && gain.source == 'Quick Status');

        if (conditions.some(gain => gain.name == 'Cover' && gain.choice == 'Greater')) {
            return 4;
        }

        if (conditions.some(gain => gain.name == 'Cover' && gain.choice == 'Standard')) {
            return 2;
        }

        if (conditions.some(gain => gain.name == 'Cover' && gain.choice == 'Lesser')) {
            return 1;
        }

        return 0;
    }

    public set_Cover(cover: number, shield: Shield = null): void {
        this.get_AC().setCover(this.get_Creature(), cover, shield, this.characterService, this.conditionsService);
    }

    public raise_Shield(raised = false, shield: Shield): void {
        if (shield) {
            shield.raised = raised;

            if (!raised && shield.takingCover) {
                this.set_Cover(0, shield);
            }

            this.set_DefenseChanged();
        }
    }

    public get_FlatFooted(): ConditionGain {
        const creature = this.get_Creature();

        return this.conditionsService.currentCreatureConditions(creature, this.characterService, creature.conditions, true)
            .find(gain => gain.name == 'Flat-Footed' && gain.source == 'Quick Status');
    }

    public set_FlatFooted(active: boolean): void {
        const creature = this.get_Creature();
        const flatFooted = this.get_FlatFooted();

        if (active) {
            if (!flatFooted) {
                const newCondition: ConditionGain = Object.assign(new ConditionGain(), { name: 'Flat-Footed', source: 'Quick Status', duration: -1, locked: true });

                this.characterService.addCondition(creature, newCondition, {}, { noReload: true });
            }
        } else {
            if (flatFooted) {
                this.characterService.removeCondition(creature, flatFooted, false);
            }
        }

        this.refreshService.processPreparedChanges();
    }

    public get_Hidden(): ConditionGain {
        const creature = this.get_Creature();

        return this.conditionsService.currentCreatureConditions(creature, this.characterService, creature.conditions, true)
            .find(gain => gain.name == 'Hidden' && gain.source == 'Quick Status');
    }

    public set_Hidden(active: boolean): void {
        const creature = this.get_Creature();
        const hidden = this.get_Hidden();

        if (active) {
            if (!hidden) {
                const newCondition: ConditionGain = Object.assign(new ConditionGain(), { name: 'Hidden', source: 'Quick Status', duration: -1, locked: true });

                this.characterService.addCondition(creature, newCondition, {}, { noReload: true });
            }
        } else {
            if (hidden) {
                this.characterService.removeCondition(creature, hidden, false);
            }
        }

        this.refreshService.processPreparedChanges();
    }

    public get_EquippedArmor(): Array<Armor | WornItem> {
        return []
            .concat(this.defenseService.equippedCreatureArmor(this.get_Creature()))
            .concat(this.defenseService.equippedCreatureBracersOfArmor(this.get_Creature()));
    }

    public get_HintRunes(armor: Armor | WornItem): Array<ArmorRune> {
        //Return all runes and rune-emulating oil effects that have a hint to show
        const runes: Array<ArmorRune> = [];

        runes.push(...armor.propertyRunes.filter((rune: ArmorRune) => rune.hints.length) as Array<ArmorRune>);

        return runes;
    }

    public get_HeightenedHint(hint: Hint): string {
        return hint.heightenedText(hint.desc, this.get_Character().level);
    }

    public get_EquippedShield(): Array<Shield> {
        return this.defenseService.equippedCreatureShield(this.get_Creature());
    }

    public on_ShieldHPChange(shield: Shield, amount: number): void {
        shield.damage += amount;

        if (shield.currentHitPoints() < shield.effectiveBrokenThreshold()) {
            shield.broken = true;
            this.characterService.equipItem(this.get_Creature() as Character | AnimalCompanion, this.get_Creature().inventories[0], shield, false, false, true);
            this.toastService.show('Your shield broke and was unequipped.');
        } else {
            shield.broken = false;
        }

        this.refreshService.prepareDetailToChange(this.creature, 'inventory');
        this.refreshService.prepareDetailToChange(this.creature, 'defense');
        this.refreshService.processPreparedChanges();
    }

    public get_Skills(type: string): Array<Skill> {
        return this.characterService.skills(this.get_Creature(), '', { type })
            .sort((a, b) => (a.name == b.name) ? 0 : ((a.name > b.name) ? 1 : -1));
    }

    public get_Traits(traitName = ''): Array<Trait> {
        return this.traitsService.traits(traitName);
    }

    public get_HaveMatchingTalismanCord(item: Armor | Shield | WornItem, talisman: Talisman): boolean {
        return item.talismanCords.some(cord => cord.isCompatibleWithTalisman(talisman));
    }

    public on_TalismanUse(item: Armor | Shield | WornItem, talisman: Talisman, index: number, preserve = false): void {
        this.refreshService.prepareDetailToChange(this.creature, 'defense');
        this.characterService.useConsumable(this.get_Creature() as Character | AnimalCompanion, talisman, preserve);

        if (!preserve) {
            item.talismans.splice(index, 1);
        }

        this.refreshService.processPreparedChanges();
    }

    public get_SpecialShowon(item: Armor | Shield | WornItem, savingThrows = false): Array<string> {
        //Under certain circumstances, some Feats apply to Armnor, Shield or Saving Throws independently of their name.
        //Return names that get_FeatsShowingOn should run on.
        const specialNames: Array<string> = [];

        if (item instanceof Shield) {
            //Shields with Emblazon Armament get tagged as "Emblazon Armament Shield".
            if (item instanceof Shield && item.$emblazonArmament) {
                item.emblazonArmament.forEach(ea => {
                    if (ea.type == 'emblazonArmament') {
                        specialNames.push('Emblazon Armament Shield');
                    }
                });
            }

            //Shields with Emblazon Energy get tagged as "Emblazon Energy Shield <Choice>".
            if (item instanceof Shield && item.$emblazonEnergy) {
                item.emblazonArmament.forEach(ea => {
                    if (ea.type == 'emblazonEnergy') {
                        specialNames.push(`Emblazon Energy Shield ${ ea.choice }`);
                    }
                });
            }

            //Shields with Emblazon Antimagic get tagged as "Emblazon Antimagic Shield".
            if (item instanceof Shield && item.$emblazonAntimagic) {
                item.emblazonArmament.forEach(ea => {
                    if (ea.type == 'emblazonAntimagic') {
                        specialNames.push('Emblazon Antimagic Shield');
                    }
                });
            }
        }

        //Return the same name for Saving Throws if the shield applies.
        if (savingThrows) {
            this.get_EquippedShield().forEach(shield => {
                if (shield.$emblazonEnergy) {
                    shield.emblazonArmament.filter(ea => ea.type == 'emblazonEnergy').forEach(ea => {
                        specialNames.push(`Emblazon Energy Shield ${ ea.choice }`);
                    });
                }

                if (shield.$emblazonAntimagic) {
                    shield.emblazonArmament.filter(ea => ea.type == 'emblazonAntimagic').forEach(() => {
                        specialNames.push('Emblazon Antimagic Shield');
                    });
                }
            });
        }

        return specialNames;
    }

    private set_DefenseChanged(): void {
        this.refreshService.prepareDetailToChange(this.creature, 'effects');
        this.refreshService.processPreparedChanges();
    }

    public get stillLoading(): boolean {
        return this.characterService.stillLoading;
    }

    public ngOnInit(): void {
        this.changeSubscription = this.refreshService.componentChanged$
            .subscribe(target => {
                if (['defense', 'all', this.creature.toLowerCase()].includes(target.toLowerCase())) {
                    this.changeDetector.detectChanges();
                }
            });
        this.viewChangeSubscription = this.refreshService.detailChanged$
            .subscribe(view => {
                if (view.creature.toLowerCase() == this.creature.toLowerCase() && ['defense', 'all'].includes(view.target.toLowerCase())) {
                    this.changeDetector.detectChanges();
                }
            });
    }

    public ngOnDestroy(): void {
        this.changeSubscription?.unsubscribe();
        this.viewChangeSubscription?.unsubscribe();
    }

}
