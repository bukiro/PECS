import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input, OnDestroy } from '@angular/core';
import { CreatureEquipmentService } from 'src/libs/shared/services/creature-equipment/creature-equipment.service';
import { TraitsDataService } from 'src/libs/shared/services/data/traits-data.service';
import { Armor } from 'src/app/classes/Armor';
import { CreatureService } from 'src/libs/shared/services/character/character.service';
import { Character } from 'src/app/classes/Character';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { Talisman } from 'src/app/classes/Talisman';
import { Shield } from 'src/app/classes/Shield';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { Hint } from 'src/app/classes/Hint';
import { ArmorRune } from 'src/app/classes/ArmorRune';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { Subscription } from 'rxjs';
import { WornItem } from 'src/app/classes/WornItem';
import { Trait } from 'src/app/classes/Trait';
import { Skill } from 'src/app/classes/Skill';
import { Creature } from 'src/app/classes/Creature';
import { Specialization } from 'src/app/classes/Specialization';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { SortAlphaNum } from 'src/libs/shared/util/sortUtils';
import { ArmorClassService, CalculatedAC, CoverTypes } from '../../../shared/services/armor-class/armor-class.service';
import { ArmorPropertiesService } from 'src/libs/shared/services/armor-properties/armor-properties.service';
import { CreatureConditionsService } from 'src/libs/shared/services/creature-conditions/creature-conditions.service';
import { ItemActivationService } from 'src/libs/shared/services/item-activation/item-activation.service';
import { SkillsDataService } from 'src/libs/shared/services/data/skills-data.service';
import { ToastService } from 'src/libs/toasts/services/toast/toast.service';
import { InputValidationService } from 'src/libs/shared/services/input-validation/input-validation.service';
import { BaseClass } from 'src/libs/shared/util/mixins/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';

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
export class DefenseComponent extends TrackByMixin(BaseClass) implements OnInit, OnDestroy {

    @Input()
    public forceMinimized?: boolean;

    @Input()
    public creature: CreatureTypes = CreatureTypes.Character;

    public shieldDamage = 0;

    private _changeSubscription?: Subscription;
    private _viewChangeSubscription?: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _refreshService: RefreshService,
        private readonly _creatureEquipmentService: CreatureEquipmentService,
        private readonly _traitsDataService: TraitsDataService,
        private readonly _toastService: ToastService,
        private readonly _armorClassService: ArmorClassService,
        private readonly _armorPropertiesService: ArmorPropertiesService,
        private readonly _creatureConditionsService: CreatureConditionsService,
        private readonly _itemActivationService: ItemActivationService,
        private readonly _skillsDataService: SkillsDataService,
    ) {
        super();
    }

    public get isMinimized(): boolean {
        if (this.forceMinimized) {
            return true;
        }

        switch (this.creature) {
            case CreatureTypes.AnimalCompanion:
                return CreatureService.character.settings.companionMinimized;
            case CreatureTypes.Familiar:
                return CreatureService.character.settings.familiarMinimized;
            default:
                return CreatureService.character.settings.defenseMinimized;
        }
    }

    private get _character(): Character {
        return CreatureService.character;
    }

    private get _currentCreature(): Creature {
        return CreatureService.creatureFromType(this.creature);
    }

    public minimize(): void {
        CreatureService.character.settings.defenseMinimized = !CreatureService.character.settings.defenseMinimized;
    }

    public armorSpecialization(armor: Armor | WornItem): Array<Specialization> {
        if (armor.isArmor()) {
            return this._armorPropertiesService.armorSpecializations(armor, this._currentCreature);
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
        return this._armorClassService.calculate(this._currentCreature);
    }

    public onSetCover(cover: number, shield?: Shield): void {
        this._armorClassService.setCover(this._currentCreature, cover, shield);
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

                this._creatureConditionsService.addCondition(creature, newCondition, {}, { noReload: true });
            }
        } else {
            if (flatFooted) {
                this._creatureConditionsService.removeCondition(creature, flatFooted, false);
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

                this._creatureConditionsService.addCondition(creature, newCondition, {}, { noReload: true });
            }
        } else {
            if (hidden) {
                this._creatureConditionsService.removeCondition(creature, hidden, false);
            }
        }

        this._refreshService.processPreparedChanges();
    }

    public equippedArmor(): Array<Armor | WornItem> {
        return new Array<Armor | WornItem>()
            .concat(this._creatureEquipmentService.equippedCreatureArmor(this._currentCreature))
            .concat(this._creatureEquipmentService.equippedCreatureBracersOfArmor(this._currentCreature));
    }

    public hintShowingRunes(armor: Armor | WornItem): Array<ArmorRune> {
        //Return all runes and rune-emulating oil effects that have a hint to show
        const runes: Array<ArmorRune> = [];

        if (armor.isArmor()) {
            runes.push(...armor.propertyRunes.filter(rune => rune.hints.length));
        }

        return runes;
    }

    public heightenedHintText(hint: Hint): string {
        return hint.heightenedText(hint.desc, this._character.level);
    }

    public equippedShield(): Array<Shield> {
        return this._creatureEquipmentService.equippedCreatureShield(this._currentCreature);
    }

    public onChangeShieldHP(shield: Shield, amount: number): void {
        shield.damage += amount;

        if (shield.currentHitPoints() < shield.effectiveBrokenThreshold()) {
            shield.broken = true;
            this._creatureEquipmentService.equipItem(
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
        return this._skillsDataService.skills(this._currentCreature.customSkills, '', { type })
            .sort((a, b) => SortAlphaNum(a.name, b.name));
    }

    public traitFromName(traitName: string): Trait {
        return this._traitsDataService.traitFromName(traitName);
    }

    public hasMatchingTalismanCord(item: Armor | Shield | WornItem, talisman: Talisman): boolean {
        return item.talismanCords.some(cord => cord.isCompatibleWithTalisman(talisman));
    }

    public onTalismanUse(item: Armor | Shield | WornItem, talisman: Talisman, index: number, preserve = false): void {
        this._refreshService.prepareDetailToChange(this.creature, 'defense');
        this._itemActivationService.useConsumable(this._currentCreature as Character | AnimalCompanion, talisman, preserve);

        if (!preserve) {
            item.talismans.splice(index, 1);
        }

        this._refreshService.processPreparedChanges();
    }

    public specialShowOnNames(item?: Armor | Shield | WornItem, savingThrows = false): Array<string> {
        //Under certain circumstances, some Feats apply to Armnor, Shield or Saving Throws independently of their name.
        //Return names that get_FeatsShowingOn should run on.
        const specialNames: Array<string> = [];

        if (item?.isShield()) {
            //Shields with Emblazon Armament get tagged as "Emblazon Armament Shield".
            if (item.$emblazonArmament) {
                item.emblazonArmament.forEach(ea => {
                    if (ea.type === 'emblazonArmament') {
                        specialNames.push('Emblazon Armament Shield');
                    }
                });
            }

            //Shields with Emblazon Energy get tagged as "Emblazon Energy Shield <Choice>".
            if (item.$emblazonEnergy) {
                item.emblazonArmament.forEach(ea => {
                    if (ea.type === 'emblazonEnergy') {
                        specialNames.push(`Emblazon Energy Shield ${ ea.choice }`);
                    }
                });
            }

            //Shields with Emblazon Antimagic get tagged as "Emblazon Antimagic Shield".
            if (item.$emblazonAntimagic) {
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
            this._creatureConditionsService.currentCreatureConditions(
                creature,
                { name: 'Cover', source: 'Quick Status' },
                { readonly: true },
            );

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
        return this._creatureConditionsService.currentCreatureConditions(
            this._currentCreature,
            { name: 'Hidden', source: 'Quick Status' },
            { readonly: true },
        )[0];
    }

    private _currentFlatFooted(): ConditionGain {
        return this._creatureConditionsService.currentCreatureConditions(
            this._currentCreature,
            { name: 'Flat-Footed', source: 'Quick Status' },
            { readonly: true },
        )[0];
    }

}
