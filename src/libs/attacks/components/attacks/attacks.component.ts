/* eslint-disable complexity */
import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { Observable, switchMap, distinctUntilChanged, shareReplay, combineLatest, map, of } from 'rxjs';
import { AttackRestriction } from 'src/app/classes/attacks/attack-restriction';
import { Specialization } from 'src/app/classes/attacks/specialization';
import { ConditionGain } from 'src/app/classes/conditions/condition-gain';
import { AnimalCompanion } from 'src/app/classes/creatures/animal-companion/animal-companion';
import { Character } from 'src/app/classes/creatures/character/character';
import { Creature } from 'src/app/classes/creatures/creature';
import { Trait } from 'src/app/classes/hints/trait';
import { AlchemicalBomb } from 'src/app/classes/items/alchemical-bomb';
import { AlchemicalPoison } from 'src/app/classes/items/alchemical-poison';
import { Ammunition } from 'src/app/classes/items/ammunition';
import { Consumable } from 'src/app/classes/items/consumable';
import { ItemCollection } from 'src/app/classes/items/item-collection';
import { Oil } from 'src/app/classes/items/oil';
import { OtherConsumableBomb } from 'src/app/classes/items/other-consumable-bomb';
import { Snare } from 'src/app/classes/items/snare';
import { Talisman } from 'src/app/classes/items/talisman';
import { Weapon } from 'src/app/classes/items/weapon';
import { WeaponRune } from 'src/app/classes/items/weapon-rune';
import { WornItem } from 'src/app/classes/items/worn-item';
import { Skill } from 'src/app/classes/skills/skill';
import { SpellGain } from 'src/app/classes/spells/spell-gain';
import { CreatureTypes } from 'src/libs/shared/definitions/creature-types';
import { EmblazonArmamentTypes } from 'src/libs/shared/definitions/emblazon-armament-types';
import { TimePeriods } from 'src/libs/shared/definitions/time-periods';
import { SpellTargetSelection } from 'src/libs/shared/definitions/types/spell-target-selection';
import { SpellProcessingService } from 'src/libs/shared/processing/services/spell-processing/spell-processing.service';
import { CharacterDeitiesService } from 'src/libs/shared/services/character-deities/character-deities.service';
import { CharacterFeatsService } from 'src/libs/shared/services/character-feats/character-feats.service';
import { CharacterFlatteningService } from 'src/libs/shared/services/character-flattening/character-flattening.service';
import { CreatureConditionsService } from 'src/libs/shared/services/creature-conditions/creature-conditions.service';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { SkillsDataService } from 'src/libs/shared/services/data/skills-data.service';
import { SpellsDataService } from 'src/libs/shared/services/data/spells-data.service';
import { TraitsDataService } from 'src/libs/shared/services/data/traits-data.service';
import { InventoryService } from 'src/libs/shared/services/inventory/inventory.service';
import { ItemActivationService } from 'src/libs/shared/services/item-activation/item-activation.service';
import { RecastService } from 'src/libs/shared/services/recast/recast.service';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';
import { WeaponPropertiesService } from 'src/libs/shared/services/weapon-properties/weapon-properties.service';
import { BaseCreatureElementComponent } from 'src/libs/shared/util/components/base-creature-element/base-creature-element.component';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { emptySafeCombineLatest, propMap$ } from 'src/libs/shared/util/observable-utils';
import { sortAlphaNum } from 'src/libs/shared/util/sort-utils';
import { stringsIncludeCaseInsensitive, stringEqualsCaseInsensitive } from 'src/libs/shared/util/string-utils';
import { AttacksService, AttackResult } from '../../services/attacks/attacks.service';
import { DamageService, DamageResult } from '../../services/damage/damage.service';
import { attackRuneSource$ } from '../../util/attack-rune-rource';
import { Hint } from 'src/app/classes/hints/hint';
import { SkillComponent } from 'src/libs/shared/skill/components/skill/skill.component';
import { GridIconComponent } from 'src/libs/shared/ui/grid-icon/components/grid-icon/grid-icon.component';
import { DescriptionComponent } from 'src/libs/shared/ui/description/components/description/description.component';
import { ItemComponent } from 'src/libs/shared/item/components/item/item.component';
import { HintComponent } from 'src/libs/shared/tags/components/hint/hint.component';
import { TraitComponent } from 'src/libs/shared/ui/trait/components/trait/trait.component';
import { QuickdiceComponent } from 'src/libs/shared/quickdice/components/quickdice/quickdice.component';
import { ActionIconsComponent } from 'src/libs/shared/ui/action-icons/components/action-icons/action-icons.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TagsComponent } from 'src/libs/shared/tags/components/tags/tags.component';
import { NgbPopover, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { ObjectEffectsComponent } from 'src/libs/shared/object-effects/components/object-effects/object-effects.component';
import { CharacterSheetCardComponent } from 'src/libs/shared/ui/character-sheet-card/character-sheet-card.component';
import { CreatureConditionRemovalService } from 'src/libs/shared/services/creature-conditions/creature-condition-removal.service';
import { AppliedCreatureConditionsService } from 'src/libs/shared/services/creature-conditions/applied-creature-conditions.service';
import { flattenArrayLists } from 'src/libs/shared/util/array-utils';
import { isEqualPrimitiveArray, isEqualSerializableArray } from 'src/libs/shared/util/compare-utils';
import { isDefined } from 'src/libs/shared/util/type-guard-utils';

interface WeaponParameters {
    weapon: Weapon | AlchemicalBomb | OtherConsumableBomb;
    asBomb?: AlchemicalBomb | OtherConsumableBomb;
    isAllowed: boolean;
}

interface AttackRestrictions {
    onlyAttacks: Array<AttackRestriction>;
    forbiddenAttacks: Array<AttackRestriction>;
}

@Component({
    selector: 'app-attacks',
    templateUrl: './attacks.component.html',
    styleUrls: ['./attacks.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,

        NgbPopover,
        NgbTooltip,

        CharacterSheetCardComponent,
        ObjectEffectsComponent,
        TagsComponent,
        ActionIconsComponent,
        QuickdiceComponent,
        TraitComponent,
        HintComponent,
        ItemComponent,
        DescriptionComponent,
        GridIconComponent,
        SkillComponent,
    ],
})
export class AttacksComponent extends TrackByMixin(BaseCreatureElementComponent) {

    public showRestricted = false;

    public isMinimized$: Observable<boolean>;
    public isInventoryTileMode$: Observable<boolean>;
    public isManualMode$: Observable<boolean>;

    public attackRestrictions$: Observable<AttackRestrictions>;
    public equippedWeaponsParameters$: Observable<Array<WeaponParameters>>;

    private _showItem = '';
    private _showList = '';

    constructor(
        private readonly _traitsDataService: TraitsDataService,
        private readonly _appliedCreatureConditionsService: AppliedCreatureConditionsService,
        private readonly _creatureConditionsService: CreatureConditionsService,
        private readonly _creatureConditionRemovalService: CreatureConditionRemovalService,
        private readonly _attacksService: AttacksService,
        private readonly _damageService: DamageService,
        private readonly _weaponPropertiesService: WeaponPropertiesService,
        private readonly _spellsDataService: SpellsDataService,
        private readonly _spellProcessingService: SpellProcessingService,
        private readonly _characterDeitiesService: CharacterDeitiesService,
        private readonly _inventoryService: InventoryService,
        private readonly _characterFeatsService: CharacterFeatsService,
        private readonly _itemActivationService: ItemActivationService,
        private readonly _skillsDataService: SkillsDataService,
    ) {
        super();

        this.isMinimized$ = this.creature$
            .pipe(
                switchMap(creature => {
                    switch (creature.type) {
                        case CreatureTypes.AnimalCompanion:
                            return propMap$(SettingsService.settings$, 'companionMinimized$');
                        default:
                            return propMap$(SettingsService.settings$, 'attacksMinimized$');
                    }
                }),
                distinctUntilChanged(),
            );

        this.isInventoryTileMode$ = propMap$(SettingsService.settings$, 'inventoryTileMode$')
            .pipe(
                distinctUntilChanged(),
                shareReplay({ refCount: true, bufferSize: 1 }),
            );

        this.isManualMode$ = propMap$(SettingsService.settings$, 'manualMode$')
            .pipe(
                distinctUntilChanged(),
                shareReplay({ refCount: true, bufferSize: 1 }),
            );

        this.attackRestrictions$ = this._attackRestrictions$()
            .pipe(
                distinctUntilChanged((previous, current) =>
                    isEqualSerializableArray(current.forbiddenAttacks, previous.forbiddenAttacks)
                    && isEqualSerializableArray(current.onlyAttacks, previous.onlyAttacks),
                ),
                shareReplay({ refCount: true, bufferSize: 1 }),
            );

        this.equippedWeaponsParameters$ = this._equippedWeaponsParameters$()
            .pipe(
                shareReplay({ refCount: true, bufferSize: 1 }),
            );
    }

    public get creature(): Character | AnimalCompanion {
        if (super.creature.isCharacter() || super.creature.isAnimalCompanion()) {
            return super.creature;
        }

        return CreatureService.character;
    }

    @Input()
    public set creature(creature: Character | AnimalCompanion) {
        this._updateCreature(creature);
    }

    public get shouldShowMinimizeButton(): boolean {
        return this.creature.isCharacter();
    }

    private get _character(): Character {
        return CreatureService.character;
    }

    public toggleMinimized(minimized: boolean): void {
        SettingsService.settings.attacksMinimized = minimized;
    }

    public toggleShownList(name: string): void {
        this._showList = this._showList === name ? '' : name;
    }

    public shownList(): string {
        return this._showList;
    }

    public toggleShownItem(id = ''): void {
        this._showItem = this._showItem === id ? '' : id;
    }

    public shownItem(): string {
        return this._showItem;
    }

    public heightenedHintText(hint: Hint): string {
        return hint.heightenedText(hint.desc, this._character.level);
    }

    public criticalHints(weapon: Weapon): Array<string> {
        const hints: Array<string> = [];

        if (weapon.criticalHint) {
            hints.push(weapon.criticalHint);
        }

        weapon.weaponMaterial.forEach(material => {
            if (material.criticalHint) {
                hints.push(material.criticalHint);
            }
        });

        return hints;
    }

    public criticalSpecialization$(weapon: Weapon, range: string): Observable<Array<Specialization>> {
        return this._damageService.critSpecialization$(weapon, this.creature, range);
    }

    public hasMatchingTalismanCord(weapon: Weapon, talisman: Talisman): boolean {
        return weapon.talismanCords.some(cord => cord.isCompatibleWithTalisman(talisman));
    }

    public poisonTitle(poison: AlchemicalPoison): string {
        return poison.desc;
    }

    public onTalismanUse(weapon: Weapon, talisman: Talisman, index: number, preserve = false): void {
        this._itemActivationService.useConsumable(this.creature, talisman, preserve);

        if (!preserve) {
            weapon.talismans.splice(index, 1);
        }
    }

    public onPoisonUse(weapon: Weapon, poison: AlchemicalPoison): void {
        this._itemActivationService.useConsumable(this.creature, poison);
        weapon.poisonsApplied.length = 0;
    }

    public ammoTypes$(): Observable<Array<string>> {
        return this.equippedWeaponsParameters$
            .pipe(
                map(equippedWeaponsParameters =>
                    Array.from(new Set(
                        equippedWeaponsParameters
                            .map(({ weapon: { ammunition } }) => ammunition)
                            .filter(isDefined),
                    )),
                ),
                distinctUntilChanged(isEqualPrimitiveArray),
            );
    }

    public availableAmmo$(type: string): Observable<Array<{ item: Ammunition; name: string; inventory: ItemCollection }>> {
        //Return all ammo from all inventories that has this type in its group
        //We need the inventory for using up items and the name just for sorting
        return this.creature.inventories.values$
            .pipe(
                switchMap(inventories => emptySafeCombineLatest(
                    inventories
                        .map(inventory =>
                            inventory.ammunition.values$
                                .pipe(
                                    switchMap(ammunition => emptySafeCombineLatest(
                                        ammunition
                                            .filter(ammo => [type, 'Any'].includes(ammo.ammunition))
                                            .map(ammo =>
                                                ammo.effectiveName$()
                                                    .pipe(
                                                        map(name => ({
                                                            item: ammo,
                                                            name,
                                                            inventory,
                                                        })),
                                                    ),
                                            ),
                                    ),

                                    ),
                                ),
                        ),

                )),
                map(ammoLists =>
                    new Array<{ item: Ammunition; name: string; inventory: ItemCollection }>()
                        .concat(...ammoLists)
                        .sort((a, b) => sortAlphaNum(a.name, b.name)),
                ),
            );
    }

    public availableSnares$(): Observable<Array<{ item: Snare; name: string; inventory: ItemCollection }>> {
        return this.creature.inventories.values$
            .pipe(
                switchMap(inventories => emptySafeCombineLatest(
                    inventories
                        .map(inventory =>
                            inventory.snares.values$
                                .pipe(
                                    switchMap(snares => emptySafeCombineLatest(
                                        snares
                                            .map(snare =>
                                                snare.effectiveName$()
                                                    .pipe(
                                                        map(name => ({
                                                            item: snare,
                                                            name,
                                                            inventory,
                                                        })),
                                                    ),
                                            ),
                                    ),

                                    ),
                                ),
                        ),

                )),
                map(ammoLists =>
                    new Array<{ item: Snare; name: string; inventory: ItemCollection }>()
                        .concat(...ammoLists)
                        .sort((a, b) => sortAlphaNum(a.name, b.name)),
                ),
            );
    }

    public onConsumableUse(
        item: Ammunition | AlchemicalBomb | OtherConsumableBomb | Snare,
        inv?: ItemCollection,
    ): void {
        if (item.storedSpells.length) {
            const spellName = item.storedSpells[0]?.spells[0]?.name || '';
            const spellChoice = item.storedSpells[0];

            if (spellChoice && spellName) {
                const spell = this._spellsDataService.spellFromName(spellName);

                if (spell) {
                    const tempGain: SpellGain = new SpellGain();
                    let target: SpellTargetSelection = '';

                    if (spell.target === 'self') {
                        target = CreatureTypes.Character;
                    }

                    this._spellProcessingService.processSpell(
                        spell,
                        true,
                        { creature: this._character, target, gain: tempGain, level: spellChoice.level },
                        { manual: true },
                    );
                }

                spellChoice.spells.shift();
            }
        }

        this._itemActivationService.useConsumable(this.creature, item as Consumable);

        if (!item.canStack() && inv) {
            this._inventoryService.dropInventoryItem(this.creature, inv, item, true);
        }
    }

    public skillsOfType(type: string): Array<Skill> {
        return this._skillsDataService.skills(this.creature.customSkills, '', { type });
    }

    public traitFromName(traitName: string): Trait {
        return this._traitsDataService.traitFromName(traitName);
    }

    public hintShowingRunes$(weapon: Weapon, range: string): Observable<Array<WeaponRune>> {
        //Return all runes and rune-emulating effects that have a hint to show.
        return this.runesOfWeapon$(weapon, range)
            .pipe(
                map(weaponRunes =>
                    weaponRunes.filter(rune => rune.hints.length),
                ),
            );
    }

    public runesOfWeapon$(weapon: Weapon, range: string): Observable<Array<WeaponRune>> {
        //Return all runes and rune-emulating oil effects.
        return attackRuneSource$(weapon, this.creature, range)
            .pipe(
                switchMap(runeSource => combineLatest([
                    runeSource.forPropertyRunes.weaponRunes$,
                    runeSource.forPropertyRunes.bladeAlly$
                        .pipe(
                            switchMap(bladeAlly =>
                                bladeAlly
                                    ? runeSource.forPropertyRunes.bladeAllyRunes.values$
                                    : of([]),
                            ),
                        ),
                    // Add runes emulated by Oils
                    weapon.oilsApplied.values$
                        .pipe(
                            map(oilsApplied =>
                                oilsApplied
                                    .filter((oil): oil is Oil & { runeEffect: WeaponRune } => !!oil.runeEffect),
                            ),
                        ),
                ])),
                map(([propertyRunes, bladeAllyRunes, oilsAppliedWithRunes]) =>
                    new Array<WeaponRune>()
                        .concat(
                            propertyRunes,
                            bladeAllyRunes,
                            oilsAppliedWithRunes.map(oil => oil.runeEffect),
                        ),
                ),
            );
    }

    public applyingHandwrapsOfMightyBlows(weapon: Weapon): WornItem | undefined {
        if (weapon.traits.includes('Unarmed')) {
            return this.creature.mainInventory.wornitems
                .find(wornItem => wornItem.isHandwrapsOfMightyBlows && wornItem.invested);
        } else {
            return undefined;
        }
    }

    public matchingGrievousRuneData(weapon: Weapon, rune: WeaponRune): string | undefined {
        return rune.data.find(data => data.name === weapon.group)?.value as string || undefined;
    }

    public specialShowOnNames$(weapon: Weapon, range: string): Observable<Array<string>> {
        //Under certain circumstances, some Feats apply to Weapons independently of their name.
        //Return a list of names that those feats apply to.
        const namesSources: Array<Observable<Array<string | null>>> = [];
        const specialNames: Array<string> = [];

        //Monks with Monastic Weaponry can apply Unarmed effects to Monk weapons.
        if (
            weapon.traits.includes('Monk') &&
            this.creature.isCharacter()
        ) {
            namesSources.push(
                this._characterFeatsService.characterHasFeatAtLevel$('Monastic Weaponry')
                    .pipe(
                        map(hasFeat =>
                            hasFeat
                                ? ['Unarmed Attacks']
                                : [],
                        ),
                    ),
            );
        }

        //Deity's favored weapons get tagged as "Favored Weapon".
        namesSources.push(
            this._weaponPropertiesService.isFavoredWeapon$(weapon, this._character)
                .pipe(
                    map(isFavoredWeapon =>
                        isFavoredWeapon
                            ? ['Favored Weapon']
                            : [],
                    ),
                ),
        );

        //Weapons with Emblazon Armament get tagged as "Emblazon Armament Weapon".
        namesSources.push(
            weapon.effectiveEmblazonArmament$
                .pipe(
                    map(emblazonArmament =>
                        emblazonArmament?.type === EmblazonArmamentTypes.EmblazonArmament
                            ? ['Emblazon Armament Weapon']
                            : [],
                    ),
                ),
        );

        //Weapons with Emblazon Energy get tagged as "Emblazon Energy Weapon <Choice>".
        namesSources.push(
            weapon.effectiveEmblazonArmament$
                .pipe(
                    map(emblazonArmament =>
                        emblazonArmament?.type === EmblazonArmamentTypes.EmblazonEnergy
                            ? [`Emblazon Energy Weapon ${ emblazonArmament.choice }`]
                            : [],
                    ),
                ),
        );

        //Weapons with Emblazon Antimagic get tagged as "Emblazon Antimagic Weapon".
        namesSources.push(
            weapon.effectiveEmblazonArmament$
                .pipe(
                    map(emblazonArmament =>
                        emblazonArmament?.type === EmblazonArmamentTypes.EmblazonAntimagic
                            ? ['Emblazon Antimagic Weapon']
                            : [],
                    ),
                ),
        );

        namesSources.push(
            this._weaponPropertiesService.effectiveProficiency$(weapon, { creature: this.creature })
                .pipe(
                    map(proficiency => [proficiency]),
                ),
        );

        namesSources.push(
            weapon.effectiveTraits$,
        );

        specialNames.push(range);
        specialNames.push(weapon.weaponBase);

        return emptySafeCombineLatest(namesSources)
            .pipe(
                map(namesLists => namesLists.map(list => list.filter((name): name is string => !!name))),
                map(namesLists =>
                    new Array<string>()
                        .concat(...namesLists)
                        .concat(specialNames),
                ),
            );
    }

    public attacksOfWeapon$(weapon: Weapon): Observable<Array<AttackResult>> {
        return combineLatest([
            weapon.melee
                ? this._attacksService.attack$(weapon, this.creature, 'melee')
                : of(undefined),
            weapon.shouldShowAsRanged$
                .pipe(
                    switchMap(shouldShowAsRanged =>
                        shouldShowAsRanged
                            ? this._attacksService.attack$(weapon, this.creature, 'ranged')
                            : of(undefined),
                    ),
                ),
        ])
            .pipe(
                map(results =>
                    results.filter((result): result is AttackResult => !!result),
                ),
            );
    }

    public damageOfWeapon$(weapon: Weapon, range: 'ranged' | 'melee'): Observable<DamageResult> {
        return this._damageService.damage$(weapon, this.creature, range);
    }

    public isFlurryAllowed$(): Observable<boolean> {
        const creature = this.creature;
        const character = CreatureService.character;

        const hasCondition$ = (conditionCreature: Creature, name: string): Observable<boolean> =>
            this._appliedCreatureConditionsService.appliedCreatureConditions$(conditionCreature, { name })
                .pipe(
                    map(conditions => !!conditions.length),
                );

        return combineLatest({
            hasHuntPrey: creature.isCharacter() ? hasCondition$(creature, 'Hunt Prey') : of(false),
            hasHuntPreyFlurry: hasCondition$(creature, 'Hunt Prey: Flurry'),
            characterHasHuntPrey: creature.isAnimalCompanion() ? hasCondition$(character, 'Hunt Prey') : of(false),
            characterHasHuntPreyFlurry: creature.isAnimalCompanion() ? hasCondition$(character, 'Hunt Prey: Flurry') : of(false),
        })
            .pipe(
                switchMap(({ hasHuntPrey, hasHuntPreyFlurry, characterHasHuntPrey, characterHasHuntPreyFlurry }) => {
                    // Characters can apply flurry if they have Hunt Prey active and own the Ranger Flurry feature.
                    if (hasHuntPrey) {
                        return this._characterFeatsService.characterHasFeatAtLevel$('Flurry');
                    }

                    // Any creature can apply flurry if they have the Hunt Prey: Flurry condition active.
                    if (hasHuntPreyFlurry) {
                        return of(true);
                    }

                    // Companions can apply flurry if the character has Hunt Prey active,
                    // owns the Ranger Flurry feature and the Ranger Animal Companion feat,
                    // which allows sharing the Hunter's Edge benefit with the companion.
                    if (characterHasHuntPrey) {
                        return combineLatest([
                            this._characterFeatsService.characterHasFeatAtLevel$('Flurry'),
                            this._characterFeatsService.characterHasFeatAtLevel$('Animal Companion (Ranger)'),
                        ])
                            .pipe(
                                map(([hasFlurry, hasRangerCompanion]) => !!hasFlurry && !!hasRangerCompanion),
                            );
                    }

                    // Companions can apply flurry if the character has the Hunt Prey: Flurry condition active
                    // and owns the Ranger Animal Companion feat,
                    // which allows sharing the Hunter's Edge benefit with the companion.
                    if (characterHasHuntPreyFlurry) {
                        return this._characterFeatsService.characterHasFeatAtLevel$('Animal Companion (Ranger)');
                    }

                    return of(false);
                }),
            );
    }

    public multipleAttackPenalty$(): Observable<string> {
        return propMap$(this.creature$, 'conditions', 'values$')
            .pipe(
                map(conditions => conditions.filter(gain =>
                    stringsIncludeCaseInsensitive(['Multiple Attack Penalty', 'Multiple Attack Penalty (Flurry)'], gain.name)
                    && stringEqualsCaseInsensitive(gain.source, 'Quick Status'),
                )),
                switchMap(conditions => emptySafeCombineLatest(
                    conditions.map(gain =>
                        gain.choice$
                            .pipe(map(choice => ({ gain, choice }))),
                    ),
                )),
                map(mapConditions => {
                    for (const { gain, choice } of mapConditions) {
                        if (stringEqualsCaseInsensitive(gain.name, 'Multiple Attack Penalty (Flurry)')) {
                            switch (choice) {
                                case 'Third Attack': return '3f';
                                case 'Second Attack': return '2f';
                                default: break;
                            }
                        }

                        if (stringEqualsCaseInsensitive(gain.name, 'Multiple Attack Penalty')) {
                            switch (choice) {
                                case 'Third Attack': return '3';
                                case 'Second Attack': return '2';
                                default: break;
                            }
                        }
                    }

                    return '1';
                }),
            );
    }

    public setMultipleAttackPenalty(mapValue: '1' | '2' | '3' | '2f' | '3f'): void {
        const creature = this.creature;
        const conditions: Array<ConditionGain> =
            this.creature.conditions
                .filter(gain =>
                    stringsIncludeCaseInsensitive(['Multiple Attack Penalty', 'Multiple Attack Penalty (Flurry)'], gain.name)
                    && stringEqualsCaseInsensitive(gain.source, 'Quick Status'),
                );
        const map2 = conditions.find(gain => gain.name === 'Multiple Attack Penalty' && gain.choice === 'Second Attack');
        const map3 = conditions.find(gain => gain.name === 'Multiple Attack Penalty' && gain.choice === 'Third Attack');
        const map2f = conditions.find(gain => gain.name === 'Multiple Attack Penalty (Flurry)' && gain.choice === 'Second Attack');
        const map3f = conditions.find(gain => gain.name === 'Multiple Attack Penalty (Flurry)' && gain.choice === 'Third Attack');
        let mapName = '';
        let mapChoice = '';

        switch (mapValue) {
            case '2':
                if (!map2) {
                    mapName = 'Multiple Attack Penalty';
                    mapChoice = 'Second Attack';
                }

                break;
            case '3':
                if (!map3) {
                    mapName = 'Multiple Attack Penalty';
                    mapChoice = 'Third Attack';
                }

                break;
            case '2f':
                if (!map2f) {
                    mapName = 'Multiple Attack Penalty (Flurry)';
                    mapChoice = 'Second Attack';
                }

                break;
            case '3f':
                if (!map3f) {
                    mapName = 'Multiple Attack Penalty (Flurry)';
                    mapChoice = 'Third Attack';
                }

                break;
            default: break;
        }

        if (map2 && mapValue !== '2') {
            this._creatureConditionRemovalService.removeSingleConditionGain(map2, creature);
        }

        if (map3 && mapValue !== '3') {
            this._creatureConditionRemovalService.removeSingleConditionGain(map3, creature);
        }

        if (map2f && mapValue !== '2f') {
            this._creatureConditionRemovalService.removeSingleConditionGain(map2f, creature);
        }

        if (map3f && mapValue !== '3f') {
            this._creatureConditionRemovalService.removeSingleConditionGain(map3f, creature);
        }

        if (mapName) {
            const newCondition =
                ConditionGain.from(
                    { name: mapName, choice: mapChoice, source: 'Quick Status', duration: TimePeriods.HalfTurn },
                    RecastService.recastFns,
                );

            this._creatureConditionsService.addCondition(creature, newCondition);
        }
    }

    public rangePenalty$(): Observable<string> {
        return propMap$(this.creature$, 'conditions', 'values$')
            .pipe(
                map(conditions => conditions.filter(gain =>
                    stringEqualsCaseInsensitive(gain.name, 'Range Penalty')
                    && stringEqualsCaseInsensitive(gain.source, 'Quick Status'),
                )),
                switchMap(conditions => emptySafeCombineLatest(
                    conditions.map(gain => gain.choice$),
                )),
                map(choices => {
                    for (const choice of choices) {
                        switch (choice) {
                            case 'Sixth Range Increment': return '6';
                            case 'Fifth Range Increment': return '5';
                            case 'Fourth Range Increment': return '4';
                            case 'Third Range Increment': return '3';
                            case 'Second Range Increment': return '2';
                            default: break;
                        }
                    }

                    return '1';
                }),
            );


    }

    public setRangePenalty(rap: '1' | '2' | '3' | '4' | '5' | '6'): void {
        const creature = this.creature;
        const conditions: Array<ConditionGain> =
            creature.conditions
                .filter(gain =>
                    stringEqualsCaseInsensitive(gain.name, 'Range Penalty')
                    && stringEqualsCaseInsensitive(gain.source, 'Quick Status'),
                );
        const rap2 = conditions.find(gain => gain.choice === 'Second Range Increment');
        const rap3 = conditions.find(gain => gain.choice === 'Third Range Increment');
        const rap4 = conditions.find(gain => gain.choice === 'Fourth Range Increment');
        const rap5 = conditions.find(gain => gain.choice === 'Fifth Range Increment');
        const rap6 = conditions.find(gain => gain.choice === 'Sixth Range Increment');
        let rapChoice = '';

        switch (rap) {
            case '2':
                if (!rap2) {
                    rapChoice = 'Second Range Increment';
                }

                break;
            case '3':
                if (!rap3) {
                    rapChoice = 'Third Range Increment';
                }

                break;
            case '4':
                if (!rap4) {
                    rapChoice = 'Fourth Range Increment';
                }

                break;
            case '5':
                if (!rap5) {
                    rapChoice = 'Fifth Range Increment';
                }

                break;
            case '6':
                if (!rap6) {
                    rapChoice = 'Sixth Range Increment';
                }

                break;
            default: break;
        }

        if (rap2 && rap !== '2') {
            this._creatureConditionRemovalService.removeSingleConditionGain(rap2, creature);
        }

        if (rap3 && rap !== '3') {
            this._creatureConditionRemovalService.removeSingleConditionGain(rap3, creature);
        }

        if (rap4 && rap !== '4') {
            this._creatureConditionRemovalService.removeSingleConditionGain(rap4, creature);
        }

        if (rap5 && rap !== '5') {
            this._creatureConditionRemovalService.removeSingleConditionGain(rap5, creature);
        }

        if (rap6 && rap !== '6') {
            this._creatureConditionRemovalService.removeSingleConditionGain(rap6, creature);
        }

        if (rapChoice) {
            const newCondition =
                ConditionGain.from(
                    { name: 'Range Penalty', choice: rapChoice, source: 'Quick Status', duration: TimePeriods.HalfTurn },
                    RecastService.recastFns,
                );

            this._creatureConditionsService.addCondition(creature, newCondition);
        }
    }

    public favoredWeapons$(): Observable<Array<string>> {
        if (!this.creature.isCharacter()) {
            return of([]);
        }

        return CharacterFlatteningService.characterClass$
            .pipe(
                switchMap(characterClass =>
                    characterClass.deityFocused
                        ? combineLatest([
                            this._characterDeitiesService.mainCharacterDeity$,
                            this._characterFeatsService.characterHasFeatAtLevel$('Favored Weapon (Syncretism)')
                                .pipe(
                                    switchMap(hasFavoredWeaponSyncretism =>
                                        hasFavoredWeaponSyncretism
                                            ? this._characterDeitiesService.syncretismDeity$()
                                            : of(null),
                                    ),
                                ),
                        ])
                        : of([]),

                ),
                map(deities =>
                    new Array<string>()
                        .concat(...deities.map(deity => deity?.favoredWeapon ?? [])),
                ),
            );
    }

    private _attackRestrictions$(): Observable<AttackRestrictions> {
        return this._appliedCreatureConditionsService.appliedCreatureConditions$(this.creature)
            .pipe(
                switchMap(conditions =>
                    emptySafeCombineLatest(
                        conditions.map(({ condition, gain }) =>
                            condition.appliedAttackRestrictions$(gain)
                                .pipe(distinctUntilChanged(isEqualSerializableArray)),
                        ),
                    ),
                ),
                map(flattenArrayLists),
                map(restrictions => ({
                    onlyAttacks: restrictions.filter(({ excluding }) => !excluding),
                    forbiddenAttacks: restrictions.filter(({ excluding }) => excluding),
                })),
            );
    }

    private _equippedWeaponsParameters$(): Observable<Array<WeaponParameters>> {
        return combineLatest({
            weapons: this.creature.mainInventory.equippedWeapons$,
            bombSets: this.creature.inventories.values$
                .pipe(
                    switchMap(inventories =>
                        combineLatest({
                            alchemicalBombs: emptySafeCombineLatest(
                                inventories.map(inventory => inventory.alchemicalbombs.values$),
                            ),
                            otherConsumablesBombs: emptySafeCombineLatest(
                                inventories.map(inventory => inventory.otherconsumablesbombs.values$),
                            ),
                        })),
                ),
        })
            .pipe(
                map(({ weapons, bombSets }) =>
                    weapons
                        .concat(
                            ...bombSets.alchemicalBombs,
                            ...bombSets.otherConsumablesBombs,
                        )
                        .sort((a, b) => (a.name === b.name) ? 0 : ((a.name > b.name) ? 1 : -1))
                        .sort((a, b) => (a.type === b.type) ? 0 : ((a.type < b.type) ? 1 : -1)),
                ),
                switchMap(weapons =>
                    emptySafeCombineLatest(
                        weapons.map(weapon => this._isWeaponAllowed$(weapon)
                            .pipe(
                                distinctUntilChanged(),
                                map(isAllowed => ({
                                    weapon,
                                    isAllowed,
                                    asBomb: this._weaponAsBomb(weapon),
                                })),
                            )),
                    ),
                ),
            );
    }

    private _weaponAsBomb(weapon: Weapon): AlchemicalBomb | OtherConsumableBomb | undefined {
        return weapon.isAlchemicalBomb() || weapon.isOtherConsumableBomb() ? weapon : undefined;
    }

    private _isWeaponAllowed$(weapon: Weapon): Observable<boolean> {
        const doesListMatchWeapon$ =
            (list: Array<AttackRestriction>): Observable<boolean> =>
                emptySafeCombineLatest(
                    list.map(restriction => {
                        if (restriction.name) {
                            return of(restriction.name === weapon.name);
                        } else if (restriction.special) {
                            switch (restriction.special) {
                                case 'Favored Weapon':
                                    return this._weaponPropertiesService.isFavoredWeapon$(weapon, this.creature);
                                default: break;
                            }
                        }

                        return of(false);
                    }),
                )
                    .pipe(
                        map(results => results.includes(true)),
                        distinctUntilChanged(),
                    );

        return this.attackRestrictions$
            .pipe(
                switchMap(({ onlyAttacks, forbiddenAttacks }) =>
                    combineLatest([
                        onlyAttacks.length ? doesListMatchWeapon$(onlyAttacks) : of(true),
                        doesListMatchWeapon$(forbiddenAttacks),
                    ]),
                ),
                map(([isAllowed, isForbidden]) => isAllowed && !isForbidden),
            );
    }

}
