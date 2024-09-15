import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { Observable, switchMap, distinctUntilChanged, shareReplay, of, map, combineLatest } from 'rxjs';
import { Specialization } from 'src/app/classes/attacks/specialization';
import { ConditionGain } from 'src/app/classes/conditions/condition-gain';
import { Character } from 'src/app/classes/creatures/character/character';
import { Creature } from 'src/app/classes/creatures/creature';
import { Hint } from 'src/app/classes/hints/hint';
import { Trait } from 'src/app/classes/hints/trait';
import { Armor } from 'src/app/classes/items/armor';
import { ArmorRune } from 'src/app/classes/items/armor-rune';
import { Shield } from 'src/app/classes/items/shield';
import { Talisman } from 'src/app/classes/items/talisman';
import { WornItem } from 'src/app/classes/items/worn-item';
import { Skill } from 'src/app/classes/skills/skill';
import { CreatureTypes } from 'src/libs/shared/definitions/creature-types';
import { EmblazonArmamentTypes } from 'src/libs/shared/definitions/emblazon-armament-types';
import { ACForDisplay, CoverTypes, ArmorClassService } from 'src/libs/shared/services/armor-class/armor-class.service';
import { ArmorPropertiesService } from 'src/libs/shared/services/armor-properties/armor-properties.service';
import { CreatureConditionsService } from 'src/libs/shared/services/creature-conditions/creature-conditions.service';
import { CreatureEquipmentService } from 'src/libs/shared/services/creature-equipment/creature-equipment.service';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { SkillsDataService } from 'src/libs/shared/services/data/skills-data.service';
import { TraitsDataService } from 'src/libs/shared/services/data/traits-data.service';
import { InputValidationService } from 'src/libs/shared/services/input-validation/input-validation.service';
import { ItemActivationService } from 'src/libs/shared/services/item-activation/item-activation.service';
import { RecastService } from 'src/libs/shared/services/recast/recast.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';
import { BaseCreatureElementComponent } from 'src/libs/shared/util/components/base-creature-element/base-creature-element.component';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { propMap$, emptySafeCombineLatest } from 'src/libs/shared/util/observable-utils';
import { sortAlphaNum } from 'src/libs/shared/util/sort-utils';
import { ToastService } from 'src/libs/toasts/services/toast/toast.service';
import { SkillComponent } from 'src/libs/shared/skill/components/skill/skill.component';
import { FormsModule } from '@angular/forms';
import { ItemComponent } from 'src/libs/shared/item/components/item/item.component';
import { ActionIconsComponent } from 'src/libs/shared/ui/action-icons/components/action-icons/action-icons.component';
import { QuickdiceComponent } from 'src/libs/shared/quickdice/components/quickdice/quickdice.component';
import { TraitComponent } from 'src/libs/shared/ui/trait/components/trait/trait.component';
import { TagsComponent } from 'src/libs/shared/tags/components/tags/tags.component';
import { NgbPopover, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { ObjectEffectsComponent } from 'src/libs/shared/object-effects/components/object-effects/object-effects.component';
import { CommonModule } from '@angular/common';
import { CharacterSheetCardComponent } from 'src/libs/shared/ui/character-sheet-card/character-sheet-card.component';
import { CreatureConditionRemovalService } from 'src/libs/shared/services/creature-conditions/creature-condition-removal.service';
import { isEqualPrimitiveObject } from 'src/libs/shared/util/compare-utils';
import { AppliedCreatureConditionsService } from 'src/libs/shared/services/creature-conditions/applied-creature-conditions.service';
import { filterConditions } from 'src/libs/shared/services/creature-conditions/condition-filter-utils';

interface ComponentParameters {
    ACSources: ACForDisplay;
    cover$: Observable<CoverTypes>;
    flatFooted$: Observable<ConditionGain | undefined>;
    hidden$: Observable<ConditionGain | undefined>;
}

interface ArmorParameters {
    armor: Armor | WornItem;
    specializations: Array<Specialization>;
}

@Component({
    selector: 'app-defense',
    templateUrl: './defense.component.html',
    styleUrls: ['./defense.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,

        NgbPopover,
        NgbTooltip,
        FormsModule,

        ObjectEffectsComponent,
        CharacterSheetCardComponent,
        TagsComponent,
        TraitComponent,
        QuickdiceComponent,
        ActionIconsComponent,
        ItemComponent,
        SkillComponent,
    ],
})
export class DefenseComponent extends TrackByMixin(BaseCreatureElementComponent) {

    public shieldDamage = 0;

    public isMinimized$: Observable<boolean>;
    public isTileMode$: Observable<boolean>;

    public componentParameters$: Observable<ComponentParameters>;
    public armorParameters$: Observable<Array<ArmorParameters>>;

    constructor(
        private readonly _refreshService: RefreshService,
        private readonly _creatureEquipmentService: CreatureEquipmentService,
        private readonly _traitsDataService: TraitsDataService,
        private readonly _toastService: ToastService,
        private readonly _armorClassService: ArmorClassService,
        private readonly _armorPropertiesService: ArmorPropertiesService,
        private readonly _appliedCreatureConditionsService: AppliedCreatureConditionsService,
        private readonly _creatureConditionsService: CreatureConditionsService,
        private readonly _creatureConditionRemovalService: CreatureConditionRemovalService,
        private readonly _itemActivationService: ItemActivationService,
        private readonly _skillsDataService: SkillsDataService,
    ) {
        super();

        this.isMinimized$ = this.creature$
            .pipe(
                switchMap(creature => SettingsService.settings$
                    .pipe(
                        switchMap(settings => {
                            switch (creature.type) {
                                case CreatureTypes.AnimalCompanion:
                                    return settings.companionMinimized$;
                                case CreatureTypes.Familiar:
                                    return settings.familiarMinimized$;
                                default:
                                    return settings.defenseMinimized$;
                            }
                        }),
                    ),
                ),
                distinctUntilChanged(),
            );

        this.isTileMode$ = propMap$(SettingsService.settings$, 'activitiesTileMode$')
            .pipe(
                distinctUntilChanged(),
                shareReplay({ refCount: true, bufferSize: 1 }),
            );

        this.componentParameters$ = this.calculatedAC$()
            .pipe(
                map(ACSources => ({
                    ACSources,
                    cover$: this._currentCover$(),
                    flatFooted$: this._currentFlatFooted$(),
                    hidden$: this._currentHidden$(),
                })),
            );

        this.armorParameters$ = this.creature$
            .pipe(
                switchMap(creature => combineLatest([
                    this._creatureEquipmentService.equippedCreatureArmor$(creature),
                    this._creatureEquipmentService.equippedCreatureBracersOfArmor$(creature),
                ])),
                map(([armor, bracers]) =>
                    new Array<Armor | WornItem>()
                        .concat(armor)
                        .concat(bracers),
                ),
                switchMap(armors => emptySafeCombineLatest(
                    armors
                        .map(armor =>
                            this._armorSpecializations$(armor)
                                .pipe(
                                    map(specializations => ({
                                        armor,
                                        specializations,
                                    })),
                                ),
                        ),
                )),
            );
    }

    public get creature(): Creature {
        return super.creature;
    }

    @Input()
    public set creature(creature: Creature) {
        this._updateCreature(creature);
    }

    public get shouldShowMinimizeButton(): boolean {
        return this.creature.isCharacter();
    }

    private get _character(): Character {
        return CreatureService.character;
    }

    public toggleMinimized(minimized: boolean): void {
        SettingsService.settings.defenseMinimized = minimized;
    }

    public positiveNumbersOnly(event: KeyboardEvent): boolean {
        return InputValidationService.positiveNumbersOnly(event);
    }

    public calculatedAC$(): Observable<ACForDisplay> {
        return this.creature$
            .pipe(
                map(creature =>
                    this._armorClassService.collectForDisplay(creature),
                ),
            );
    }

    public onSetCover(cover: number, shield?: Shield): void {
        this._armorClassService.setCover(this.creature, cover, shield);
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

    public toggleFlatFooted(currentFlatFooted: ConditionGain | undefined): void {
        const creature = this.creature;

        if (currentFlatFooted) {
            this._creatureConditionRemovalService.removeSingleConditionGain(currentFlatFooted, creature);
        } else {
            const newCondition =
                ConditionGain.from({ name: 'Flat-Footed', source: 'Quick Status', duration: -1 }, RecastService.recastFns);

            this._creatureConditionsService.addCondition(creature, newCondition, {}, { noReload: true });
        }

        this._refreshService.processPreparedChanges();
    }

    public toggleHidden(currentHidden: ConditionGain | undefined): void {
        const creature = this.creature;

        if (currentHidden) {
            this._creatureConditionRemovalService.removeSingleConditionGain(currentHidden, creature);
        } else {
            const newCondition: ConditionGain =
                ConditionGain.from({ name: 'Hidden', source: 'Quick Status', duration: -1 }, RecastService.recastFns);

            this._creatureConditionsService.addCondition(creature, newCondition, {}, { noReload: true });
        }

        this._refreshService.processPreparedChanges();
    }

    public hintShowingRunes(armor: Armor | WornItem): Array<ArmorRune> {
        //Return all runes and rune-emulating oil effects that have a hint to show
        const runes: Array<ArmorRune> = [];

        if (armor.isArmor()) {
            runes.push(...armor.armorRunes.filter(rune => rune.hints.length));
        }

        return runes;
    }

    public heightenedHintText(hint: Hint): string {
        return hint.heightenedText(hint.desc, this._character.level);
    }

    public equippedShield$(): Observable<Array<Shield>> {
        return this.creature$
            .pipe(
                switchMap(creature =>
                    this._creatureEquipmentService.equippedCreatureShield$(creature),
                ),
            );
    }

    public onChangeShieldHP(shield: Shield, amount: number): void {
        if (!this.creature.canEquipItems()) {
            return;
        }

        shield.damage += amount;

        if (shield.currentHitPoints$() < shield.effectiveBrokenThreshold$()) {
            shield.broken = true;
            this._creatureEquipmentService.equipItem(
                this.creature,
                this.creature.mainInventory,
                shield,
                false,
                false,
                true,
            );
            this._toastService.show('Your shield broke and was unequipped.');
        } else {
            shield.broken = false;
        }

        this._refreshService.prepareDetailToChange(this.creature.type, 'inventory');
        this._refreshService.prepareDetailToChange(this.creature.type, 'defense');
        this._refreshService.processPreparedChanges();
    }

    public skillsOfType$(type: string): Observable<Array<Skill>> {
        return this.creature$
            .pipe(
                map(creature =>
                    this._skillsDataService
                        .skills(creature.customSkills, '', { type })
                        .sort((a, b) => sortAlphaNum(a.name, b.name)),
                ),
            );
    }

    public traitFromName(traitName: string): Trait {
        return this._traitsDataService.traitFromName(traitName);
    }

    public hasMatchingTalismanCord(item: Armor | Shield | WornItem, talisman: Talisman): boolean {
        return item.talismanCords.some(cord => cord.isCompatibleWithTalisman(talisman));
    }

    public onTalismanUse(item: Armor | Shield | WornItem, talisman: Talisman, index: number, preserve = false): void {
        if (!this.creature.canEquipItems()) {
            return;
        }

        this._refreshService.prepareDetailToChange(this.creature.type, 'defense');
        this._itemActivationService.useConsumable(this.creature, talisman, preserve);

        if (!preserve) {
            item.talismans.splice(index, 1);
        }

        this._refreshService.processPreparedChanges();
    }

    public specialShowOnNamesShield$(item: Shield): Observable<Array<string>> {
        //Return names that get_FeatsShowingOn should run on for a shield.
        return item.effectiveEmblazonArmament$
            .pipe(
                distinctUntilChanged(isEqualPrimitiveObject),
                map(emblazonArmament => {
                    const specialNames: Array<string> = [];

                    //Shields with Emblazon Armament get tagged as "Emblazon Armament Shield".
                    if (emblazonArmament) {
                        if (item.emblazonArmament?.type === EmblazonArmamentTypes.EmblazonArmament) {
                            specialNames.push('Emblazon Armament Shield');
                        }
                    }

                    //Shields with Emblazon Energy get tagged as "Emblazon Energy Shield <Choice>".
                    if (emblazonArmament?.type === EmblazonArmamentTypes.EmblazonEnergy) {
                        specialNames.push(`Emblazon Energy Shield ${ emblazonArmament.choice }`);
                    }

                    //Shields with Emblazon Antimagic get tagged as "Emblazon Antimagic Shield".
                    if (emblazonArmament?.type === EmblazonArmamentTypes.EmblazonAntimagic) {
                        specialNames.push('Emblazon Antimagic Shield');
                    }

                    return specialNames;
                }),
            );
    }

    public specialShowOnNamesSavingThrows$(): Observable<Array<string>> {
        //Return names that get_FeatsShowingOn should run on for saving throws.
        return this.equippedShield$()
            .pipe(
                switchMap(shields => emptySafeCombineLatest(
                    shields.map(shield =>
                        shield.effectiveEmblazonArmament$,
                    ),
                )),
                map(shields => {
                    const specialNames: Array<string> = [];

                    shields.forEach(emblazonArmament => {
                        if (emblazonArmament?.type === EmblazonArmamentTypes.EmblazonEnergy) {
                            specialNames.push(`Emblazon Energy Shield ${ emblazonArmament.choice }`);
                        }

                        if (emblazonArmament?.type === EmblazonArmamentTypes.EmblazonAntimagic) {
                            specialNames.push('Emblazon Antimagic Shield');
                        }
                    });

                    return specialNames;
                }),
            );
    }

    private _armorSpecializations$(armor: Armor | WornItem): Observable<Array<Specialization>> {
        if (armor.isArmor()) {
            return this.creature$
                .pipe(
                    switchMap(creature =>
                        this._armorPropertiesService.armorSpecializations$(armor, creature),
                    ),
                );

        }

        //No armor specializations for bracers of armor.
        return of([]);
    }

    private _setDefenseChanged(): void {
        this._refreshService.prepareDetailToChange(this.creature.type, 'effects');
        this._refreshService.processPreparedChanges();
    }

    private _currentCover$(): Observable<CoverTypes> {
        return propMap$(this.creature$, 'conditions', 'values$')
            .pipe(
                map(conditions => {
                    const coverConditions = filterConditions(conditions, { name: 'cover', source: 'quick status' });

                    if (coverConditions.some(({ choice }) => choice === 'Greater')) {
                        return CoverTypes.GreaterCover;
                    }

                    if (coverConditions.some(({ choice }) => choice === 'Standard')) {
                        return CoverTypes.Cover;
                    }

                    if (coverConditions.some(({ choice }) => choice === 'Lesser')) {
                        return CoverTypes.LesserCover;
                    }

                    return CoverTypes.NoCover;
                }),
            );
    }

    private _currentHidden$(): Observable<ConditionGain | undefined> {
        return propMap$(this.creature$, 'conditions', 'values$')
            .pipe(
                map(conditions =>
                    filterConditions(conditions, { name: 'Hidden', source: 'Quick Status' })[0],
                ),
            );
    }

    private _currentFlatFooted$(): Observable<ConditionGain | undefined> {
        return propMap$(this.creature$, 'conditions', 'values$')
            .pipe(
                map(conditions =>
                    filterConditions(conditions, { name: 'Flat-Footed', source: 'Quick Status' })[0],
                ),
            );
    }

}
