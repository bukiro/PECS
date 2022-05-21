import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input, OnDestroy } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { EffectsService } from 'src/app/services/effects.service';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { TimeService } from 'src/app/services/time.service';
import { ItemsService } from 'src/app/services/items.service';
import { SpellsService } from 'src/app/services/spells.service';
import { ConditionsService } from 'src/app/services/conditions.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { Subscription } from 'rxjs';
import { Character } from 'src/app/classes/Character';
import { InputValidationService } from 'src/app/services/inputValidation.service';

@Component({
    selector: 'app-health',
    templateUrl: './health.component.html',
    styleUrls: ['./health.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HealthComponent implements OnInit, OnDestroy {

    @Input()
    creature = 'Character';
    @Input()
    public showMinimizeButton = true;
    @Input()
    public sheetSide = 'left';

    public damageSliderMax = 1;

    public damage = 0;
    public nonlethal = false;
    public setTempHP = 0;
    public selectedTempHP: { amount: number; source: string; sourceId: string };
    public Math = Math;

    private changeSubscription: Subscription;
    private viewChangeSubscription: Subscription;

    constructor(
        private readonly changeDetector: ChangeDetectorRef,
        private readonly timeService: TimeService,
        private readonly itemsService: ItemsService,
        private readonly spellsService: SpellsService,
        public characterService: CharacterService,
        private readonly refreshService: RefreshService,
        public effectsService: EffectsService,
        private readonly conditionsService: ConditionsService,
    ) { }

    minimize() {
        this.characterService.character().settings.healthMinimized = !this.characterService.character().settings.healthMinimized;
    }

    get_Minimized() {
        switch (this.creature) {
            case 'Character':
                return this.characterService.character().settings.healthMinimized;
            case 'Companion':
                return this.characterService.character().settings.companionMinimized;
            case 'Familiar':
                return this.characterService.character().settings.familiarMinimized;
        }
    }

    public still_loading(): boolean {
        return this.characterService.stillLoading;
    }

    get_Creature() {
        return this.characterService.creatureFromType(this.creature);
    }

    get_Character() {
        return this.characterService.character();
    }

    get_ManualMode() {
        return this.characterService.isManualMode();
    }

    trackByIndex(index: number): number {
        return index;
    }

    get_Waiting(duration: number): string {
        return this.timeService.getWaitingDescription(duration, { characterService: this.characterService, conditionsService: this.conditionsService }, { includeResting: true });
    }

    public positiveNumbersOnly(event: KeyboardEvent): boolean {
        return InputValidationService.positiveNumbersOnly(event);
    }

    rest() {
        this.timeService.rest(this.characterService, this.conditionsService, this.itemsService, this.spellsService);
    }

    die(reason: string) {
        if (!this.characterService.currentCreatureConditions(this.get_Creature(), 'Dead').length) {
            this.characterService.addCondition(this.get_Creature(), Object.assign(new ConditionGain(), { name: 'Dead', source: reason }), {}, { noReload: true });
            this.characterService.currentCreatureConditions(this.get_Creature(), 'Doomed').forEach(gain => {
                this.characterService.removeCondition(this.get_Creature(), gain, false);
            });
        }
    }

    get_Health() {
        return this.characterService.creatureHealth(this.get_Creature());
    }

    calculate_Health() {
        const calculatedHealth = this.get_Health().calculate(this.get_Creature(), this.characterService, this.effectsService);

        //Don't do anything about your dying status in manual mode.
        if (!this.characterService.isManualMode()) {
            if (calculatedHealth.dying >= calculatedHealth.maxDying) {
                if (this.characterService.currentCreatureConditions(this.get_Creature(), 'Doomed').length) {
                    this.die('Doomed');
                } else {
                    this.die('Dying value too high');
                }
            }
        }

        this.damageSliderMax = (calculatedHealth.maxHP.result + (this.get_Health().temporaryHP[0]?.amount || 0)) || 1;

        return calculatedHealth;
    }

    on_ManualDyingChange(amount: number) {
        this.get_Health().manualDying += amount;
    }

    on_ManualWoundedChange(amount: number) {
        this.get_Health().manualWounded += amount;
    }

    on_DyingSave(success, maxDying: number) {
        if (success) {
            //Reduce all dying conditions by 1
            //Conditions with Value 0 get cleaned up in the conditions Service
            //Wounded is added automatically when Dying is removed
            this.characterService.currentCreatureConditions(this.get_Creature(), 'Dying').forEach(gain => {
                gain.value = Math.max(gain.value - 1, 0);
            });
        } else {
            this.characterService.currentCreatureConditions(this.get_Creature(), 'Dying').forEach(gain => {
                gain.value = Math.min(gain.value + 1, maxDying);
            });

            if (this.get_Health().dying(this.get_Creature(), this.characterService) >= maxDying) {
                this.die('Failed Dying Save');
            }
        }

        this.refreshService.set_ToChange(this.creature, 'effects');
        this.refreshService.process_ToChange();
    }

    on_HeroPointRecover() {
        this.characterService.currentCreatureConditions(this.get_Creature(), 'Dying').forEach(gain => {
            this.characterService.removeCondition(this.get_Creature(), gain, false, false, false);
        });
        this.get_Character().heroPoints = 0;
        this.refreshService.set_ToChange(this.creature, 'effects');
        this.refreshService.set_ToChange(this.creature, 'general');
        this.refreshService.process_ToChange();
    }

    on_HealWounded() {
        this.characterService.currentCreatureConditions(this.get_Creature(), 'Wounded').forEach(gain => {
            this.characterService.removeCondition(this.get_Creature(), gain, false);
        });
        this.refreshService.set_ToChange(this.creature, 'effects');
        this.refreshService.process_ToChange();
    }

    get_NumbToDeath() {
        if (this.get_Creature() instanceof Character) {
            return this.characterService.characterFeatsTaken(0, this.get_Character().level, { featName: 'Numb to Death' }).length;
        } else {
            return 0;
        }
    }

    on_Heal(dying: number) {
        this.get_Health().heal(this.get_Creature(), this.characterService, this.effectsService, this.damage, true, true, dying);
        this.refreshService.set_ToChange(this.creature, 'health');
        this.refreshService.set_ToChange(this.creature, 'effects');
        this.refreshService.process_ToChange();
    }

    on_NumbToDeath(dying: number) {
        this.get_Health().heal(this.get_Creature(), this.characterService, this.effectsService, this.get_Character().level, true, false, dying);
        this.refreshService.set_ToChange(this.creature, 'health');
        this.refreshService.process_ToChange();
    }

    on_TakeDamage(wounded: number, dying: number) {
        this.get_Health().takeDamage(this.get_Creature(), this.characterService, this.effectsService, this.damage, this.nonlethal, wounded, dying);
        this.refreshService.set_ToChange(this.creature, 'health');
        this.refreshService.set_ToChange(this.creature, 'effects');
        this.refreshService.process_ToChange();
    }

    set_TempHP(amount: number) {
        this.get_Health().temporaryHP[0] = { amount, source: 'Manual', sourceId: '' };
        this.get_Health().temporaryHP.length = 1;
        this.refreshService.set_ToChange(this.creature, 'health');
        this.refreshService.set_ToChange(this.creature, 'effects');
        this.refreshService.process_ToChange();
    }

    on_TempHPSelected(tempSet: { amount: number; source: string; sourceId: string }) {
        this.get_Health().temporaryHP[0] = tempSet;
        this.get_Health().temporaryHP.length = 1;
        this.refreshService.set_ToChange(this.creature, 'health');
        this.refreshService.set_ToChange(this.creature, 'effects');
        //Update Health and Time because having multiple temporary HP keeps you from ticking time and resting.
        this.refreshService.set_ToChange('Character', 'health');
        this.refreshService.set_ToChange('Character', 'time');
        this.refreshService.process_ToChange();
    }

    get_Resistances() {
        //There should be no absolutes in resistances. If there are, they will be treated as relatives here.
        const effects = this.effectsService.get_Effects(this.creature).all.filter(effect =>
            effect.creature == this.get_Creature().id && (effect.target.toLowerCase().includes('resistance') ||
                effect.target.toLowerCase().includes('hardness')) && effect.apply && !effect.ignored);
        const resistances: Array<{ target: string; value: number; source: string }> = [];

        //Build a list of all resistances other than "Resistances" and add up their respective value.
        effects.filter(effect => effect.target.toLowerCase() != 'resistances').forEach(effect => {
            const value = parseInt(effect.value, 10) || parseInt(effect.setValue, 10);
            const resistance = resistances.find(res => res.target == effect.target);

            if (resistance) {
                resistance.value += value;
                resistance.source += `\n${ effect.source }: ${ value }`;
            } else {
                resistances.push({ target: effect.target, value, source: `${ effect.source }: ${ value }` });
            }
        });
        //Globally apply any effects on "Resistances".
        effects.filter(effect => effect.target.toLowerCase() == 'resistances').forEach(effect => {
            const value = parseInt(effect.value, 10) || parseInt(effect.setValue, 10);

            resistances.forEach(resistance => {
                resistance.value += value;
                resistance.source += `\n${ effect.source }: ${ value }`;
            });
        });
        resistances.forEach((res: { target: string; value: number; source: string }) => {
            if (res.value < 0) {
                res.target = res.target.toLowerCase().replace('resistance', 'weakness');
            }

            res.target = res.target.split(' ').map(word => word[0].toUpperCase() + word.substr(1).toLowerCase())
                .join(' ');
        });

        return resistances;
    }

    get_Immunities() {
        const effects = this.effectsService.get_Effects(this.creature).all.filter(effect =>
            effect.creature == this.get_Creature().id && (effect.target.toLowerCase().includes('immunity')));
        const immunities: Array<{ target: string; source: string }> = [];

        effects.forEach(effect => {
            if (!immunities.some(immunity => immunity.target == effect.target)) {
                immunities.push({ target: effect.target, source: effect.source });
            }
        });
        immunities.forEach(immunity => {
            immunity.target = immunity.target.split(' ').map(word => word[0].toUpperCase() + word.substring(1).toLowerCase())
                .join(' ');
        });

        return immunities;
    }

    get_AbsolutesOnThis(name: string) {
        return this.effectsService.get_AbsolutesOnThis(this.get_Creature(), name);
    }

    show_BonusesOnThis(name: string) {
        return this.effectsService.show_BonusesOnThis(this.get_Creature(), name);
    }

    show_PenaltiesOnThis(name: string) {
        return this.effectsService.show_PenaltiesOnThis(this.get_Creature(), name);
    }

    public ngOnInit(): void {
        this.changeSubscription = this.refreshService.get_Changed
            .subscribe(target => {
                if (['health', 'all', this.creature.toLowerCase()].includes(target.toLowerCase())) {
                    this.changeDetector.detectChanges();
                }
            });
        this.viewChangeSubscription = this.refreshService.get_ViewChanged
            .subscribe(view => {
                if (view.creature.toLowerCase() == this.creature.toLowerCase() && ['health', 'all'].includes(view.target.toLowerCase())) {
                    this.changeDetector.detectChanges();
                }
            });
    }

    ngOnDestroy() {
        this.changeSubscription?.unsubscribe();
        this.viewChangeSubscription?.unsubscribe();
    }

}
