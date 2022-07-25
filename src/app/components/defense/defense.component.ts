import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input, OnDestroy } from '@angular/core';
import { DefenseService } from 'src/app/services/defense.service';
import { TraitsService } from 'src/app/services/traits.service';
import { Armor } from 'src/app/classes/Armor';
import { EffectsService } from 'src/app/services/effects.service';
import { CharacterService } from 'src/app/services/character.service';
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
import { AC, CalculatedAC, CoverTypes } from 'src/app/classes/AC';
import { Creature } from 'src/app/classes/Creature';
import { Specialization } from 'src/app/classes/Specialization';
import { InputValidationService } from 'src/app/services/inputValidation.service';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { Trackers } from 'src/libs/shared/util/trackers';
import { SortAlphaNum } from 'src/libs/shared/util/sortUtils';

interface ComponentParameters {
    calculatedAC: CalculatedAC;
    cover: number;
    flatFooted: ConditionGain;
    hidden: ConditionGain;
}

@Component({
    selector: 'app-defense',
    templateUrl: './defense.component.html',
    styleUrls: ['./defense.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DefenseComponent implements OnInit, OnDestroy {

    @Input()
    public creature: CreatureTypes = CreatureTypes.Character;

    public shieldDamage = 0;

    private _changeSubscription: Subscription;
    private _viewChangeSubscription: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _characterService: CharacterService,
        private readonly _refreshService: RefreshService,
        private readonly _defenseService: DefenseService,
        private readonly _traitsService: TraitsService,
        private readonly _conditionsService: ConditionsService,
        private readonly _effectsService: EffectsService,
        private readonly _toastService: ToastService,
        public trackers: Trackers,
    ) { }

    public get stillLoading(): boolean {
        return this._characterService.stillLoading;
    }

    public get isMinimized(): boolean {
        switch (this.creature) {
            case CreatureTypes.AnimalCompanion:
                return this._characterService.character.settings.companionMinimized;
            case CreatureTypes.Familiar:
                return this._characterService.character.settings.familiarMinimized;
            default:
                return this._characterService.character.settings.defenseMinimized;
        }
    }

    private get _character(): Character {
        return this._characterService.character;
    }

    private get _currentCreature(): Creature {
        return this._characterService.creatureFromType(this.creature);
    }

    private get _armorClass(): AC {
        return this._defenseService.armorClass;
    }

    public minimize(): void {
        this._characterService.character.settings.defenseMinimized = !this._characterService.character.settings.defenseMinimized;
    }

    public armorSpecialization(armor: Armor | WornItem): Array<Specialization> {
        if (armor instanceof Armor) {
            return armor.armorSpecializations(this._currentCreature, this._characterService);
        }

        //No armor specializations for bracers of armor.
        return [];
    }

    public positiveNumbersOnly(event: KeyboardEvent): boolean {
        return InputValidationService.positiveNumbersOnly(event);
    }

    public componentParameters(): ComponentParameters {
        return {
            calculatedAC: this.calculatedAC(),
            cover: this._currentCover(),
            flatFooted: this._currentFlatFooted(),
            hidden: this._currentHidden(),
        };
    }

    public calculatedAC(): CalculatedAC {
        return this._armorClass.calculate(this._currentCreature, this._characterService, this._defenseService, this._effectsService);
    }

    public onSetCover(cover: number, shield: Shield = null): void {
        this._armorClass.setCover(this._currentCreature, cover, shield, this._characterService, this._conditionsService);
    }

    public onRaiseShield(raised = false, shield: Shield): void {
        if (shield) {
            shield.raised = raised;

            if (!raised && shield.takingCover) {
                this.onSetCover(0, shield);
            }

            this._setDefenseChanged();
        }
    }

    public onSetFlatFooted(active: boolean): void {
        const creature = this._currentCreature;
        const flatFooted = this._currentFlatFooted();

        if (active) {
            if (!flatFooted) {
                const newCondition: ConditionGain =
                    Object.assign(new ConditionGain(), { name: 'Flat-Footed', source: 'Quick Status', duration: -1, locked: true });

                this._characterService.addCondition(creature, newCondition, {}, { noReload: true });
            }
        } else {
            if (flatFooted) {
                this._characterService.removeCondition(creature, flatFooted, false);
            }
        }

        this._refreshService.processPreparedChanges();
    }

    public onSetHidden(active: boolean): void {
        const creature = this._currentCreature;
        const hidden = this._currentHidden();

        if (active) {
            if (!hidden) {
                const newCondition: ConditionGain =
                    Object.assign(new ConditionGain(), { name: 'Hidden', source: 'Quick Status', duration: -1, locked: true });

                this._characterService.addCondition(creature, newCondition, {}, { noReload: true });
            }
        } else {
            if (hidden) {
                this._characterService.removeCondition(creature, hidden, false);
            }
        }

        this._refreshService.processPreparedChanges();
    }

    public equippedArmor(): Array<Armor | WornItem> {
        return []
            .concat(this._defenseService.equippedCreatureArmor(this._currentCreature))
            .concat(this._defenseService.equippedCreatureBracersOfArmor(this._currentCreature));
    }

    public hintShowingRunes(armor: Armor | WornItem): Array<ArmorRune> {
        //Return all runes and rune-emulating oil effects that have a hint to show
        const runes: Array<ArmorRune> = [];

        runes.push(...armor.propertyRunes.filter((rune: ArmorRune) => rune.hints.length) as Array<ArmorRune>);

        return runes;
    }

    public heightenedHintText(hint: Hint): string {
        return hint.heightenedText(hint.desc, this._character.level);
    }

    public equippedShield(): Array<Shield> {
        return this._defenseService.equippedCreatureShield(this._currentCreature);
    }

    public onChangeShieldHP(shield: Shield, amount: number): void {
        shield.damage += amount;

        if (shield.currentHitPoints() < shield.effectiveBrokenThreshold()) {
            shield.broken = true;
            this._characterService.equipItem(
                this._currentCreature as Character | AnimalCompanion,
                this._currentCreature.inventories[0],
                shield,
                false,
                false,
                true,
            );
            this._toastService.show('Your shield broke and was unequipped.');
        } else {
            shield.broken = false;
        }

        this._refreshService.prepareDetailToChange(this.creature, 'inventory');
        this._refreshService.prepareDetailToChange(this.creature, 'defense');
        this._refreshService.processPreparedChanges();
    }

    public skillsOfType(type: string): Array<Skill> {
        return this._characterService.skills(this._currentCreature, '', { type })
            .sort((a, b) => SortAlphaNum(a.name, b.name));
    }

    public traitFromName(traitName: string): Trait {
        return this._traitsService.traitFromName(traitName);
    }

    public hasMatchingTalismanCord(item: Armor | Shield | WornItem, talisman: Talisman): boolean {
        return item.talismanCords.some(cord => cord.isCompatibleWithTalisman(talisman));
    }

    public onTalismanUse(item: Armor | Shield | WornItem, talisman: Talisman, index: number, preserve = false): void {
        this._refreshService.prepareDetailToChange(this.creature, 'defense');
        this._characterService.useConsumable(this._currentCreature as Character | AnimalCompanion, talisman, preserve);

        if (!preserve) {
            item.talismans.splice(index, 1);
        }

        this._refreshService.processPreparedChanges();
    }

    public specialShowOnNames(item: Armor | Shield | WornItem, savingThrows = false): Array<string> {
        //Under certain circumstances, some Feats apply to Armnor, Shield or Saving Throws independently of their name.
        //Return names that get_FeatsShowingOn should run on.
        const specialNames: Array<string> = [];

        if (item instanceof Shield) {
            //Shields with Emblazon Armament get tagged as "Emblazon Armament Shield".
            if (item instanceof Shield && item.$emblazonArmament) {
                item.emblazonArmament.forEach(ea => {
                    if (ea.type === 'emblazonArmament') {
                        specialNames.push('Emblazon Armament Shield');
                    }
                });
            }

            //Shields with Emblazon Energy get tagged as "Emblazon Energy Shield <Choice>".
            if (item instanceof Shield && item.$emblazonEnergy) {
                item.emblazonArmament.forEach(ea => {
                    if (ea.type === 'emblazonEnergy') {
                        specialNames.push(`Emblazon Energy Shield ${ ea.choice }`);
                    }
                });
            }

            //Shields with Emblazon Antimagic get tagged as "Emblazon Antimagic Shield".
            if (item instanceof Shield && item.$emblazonAntimagic) {
                item.emblazonArmament.forEach(ea => {
                    if (ea.type === 'emblazonAntimagic') {
                        specialNames.push('Emblazon Antimagic Shield');
                    }
                });
            }
        }

        //Return the same name for Saving Throws if the shield applies.
        if (savingThrows) {
            this.equippedShield().forEach(shield => {
                if (shield.$emblazonEnergy) {
                    shield.emblazonArmament.filter(ea => ea.type === 'emblazonEnergy').forEach(ea => {
                        specialNames.push(`Emblazon Energy Shield ${ ea.choice }`);
                    });
                }

                if (shield.$emblazonAntimagic) {
                    shield.emblazonArmament.filter(ea => ea.type === 'emblazonAntimagic').forEach(() => {
                        specialNames.push('Emblazon Antimagic Shield');
                    });
                }
            });
        }

        return specialNames;
    }

    public ngOnInit(): void {
        this._changeSubscription = this._refreshService.componentChanged$
            .subscribe(target => {
                if (['defense', 'all', this.creature.toLowerCase()].includes(target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                if (view.creature.toLowerCase() === this.creature.toLowerCase() && ['defense', 'all'].includes(view.target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

    private _setDefenseChanged(): void {
        this._refreshService.prepareDetailToChange(this.creature, 'effects');
        this._refreshService.processPreparedChanges();
    }

    private _currentCover(): number {
        const creature = this._currentCreature;
        const conditions: Array<ConditionGain> =
            this._characterService.currentCreatureConditions(creature, 'Cover', 'Quick Status', true);

        if (conditions.some(gain => gain.choice === 'Greater')) {
            return CoverTypes.GreaterCover;
        }

        if (conditions.some(gain => gain.choice === 'Standard')) {
            return CoverTypes.Cover;
        }

        if (conditions.some(gain => gain.choice === 'Lesser')) {
            return CoverTypes.LesserCover;
        }

        return CoverTypes.NoCover;
    }

    private _currentHidden(): ConditionGain {
        return this._characterService.currentCreatureConditions(this._currentCreature, 'Hidden', 'Quick Status', true)[0];
    }

    private _currentFlatFooted(): ConditionGain {
        return this._characterService.currentCreatureConditions(this._currentCreature, 'Flat-Footed', 'Quick Status', true)[0];
    }

}
