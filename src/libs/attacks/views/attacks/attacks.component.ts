/* eslint-disable complexity */
import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, Input } from '@angular/core';
import { Weapon } from 'src/app/classes/Weapon';
import { TraitsService } from 'src/app/services/traits.service';
import { CharacterService } from 'src/app/services/character.service';
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
import { ActivitiesDataService } from 'src/app/core/services/data/activities-data.service';
import { AttackRestriction } from 'src/app/classes/AttackRestriction';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { Specialization } from 'src/app/classes/Specialization';
import { SortAlphaNum } from 'src/libs/shared/util/sortUtils';
import { Skill } from 'src/app/classes/Skill';
import { Trait } from 'src/app/classes/Trait';
import { WornItem } from 'src/app/classes/WornItem';
import { TimePeriods } from 'src/libs/shared/definitions/timePeriods';
import { Trackers } from 'src/libs/shared/util/trackers';
import { SpellTargetSelection } from 'src/libs/shared/definitions/Types/spellTargetSelection';
import { AttackResult, AttacksService, DamageResult } from '../../services/attacks/attacks.service';
import { DamageService } from '../../services/damage/damage.service';
import { attackRuneSource } from '../../util/attackRuneSource';
import { WeaponPropertiesService } from 'src/libs/shared/services/weapon-properties/weapon-properties.service';

interface WeaponParameters {
    weapon: Weapon | AlchemicalBomb | OtherConsumableBomb;
    asBomb: AlchemicalBomb | OtherConsumableBomb;
    isAllowed: boolean;
}

@Component({
    selector: 'app-attacks',
    templateUrl: './attacks.component.html',
    styleUrls: ['./attacks.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttacksComponent implements OnInit, OnDestroy {

    @Input()
    public creature: CreatureTypes.Character | CreatureTypes.AnimalCompanion = CreatureTypes.Character;
    public onlyAttacks: Array<AttackRestriction> = [];
    public forbiddenAttacks: Array<AttackRestriction> = [];
    public showRestricted = false;
    private _showItem = '';
    private _showList = '';
    private _changeSubscription: Subscription;
    private _viewChangeSubscription: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _traitsService: TraitsService,
        private readonly _deitiesService: DeitiesService,
        private readonly _characterService: CharacterService,
        private readonly _refreshService: RefreshService,
        private readonly _activitiesDataService: ActivitiesDataService,
        private readonly _conditionsService: ConditionsService,
        private readonly _attacksService: AttacksService,
        private readonly _damageService: DamageService,
        private readonly _weaponPropertiesService: WeaponPropertiesService,
        public trackers: Trackers,
    ) { }

    public get isMinimized(): boolean {
        return this.creature === CreatureTypes.AnimalCompanion
            ? this._characterService.character.settings.companionMinimized
            : this._characterService.character.settings.attacksMinimized;
    }

    public get isManualMode(): boolean {
        return this._characterService.isManualMode;
    }

    public get stillLoading(): boolean {
        return this._characterService.stillLoading;
    }

    public get isInventoryTileMode(): boolean {
        return this._character.settings.inventoryTileMode;
    }

    private get _character(): Character {
        return this._characterService.character;
    }

    private get _currentCreature(): Character | AnimalCompanion {
        return this._characterService.creatureFromType(this.creature) as Character | AnimalCompanion;
    }

    public minimize(): void {
        this._characterService.character.settings.attacksMinimized = !this._characterService.character.settings.attacksMinimized;
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

        weapon.material.forEach(material => {
            if ((material as WeaponMaterial).criticalHint) {
                hints.push((material as WeaponMaterial).criticalHint);
            }
        });

        return hints;
    }

    public criticalSpecialization(weapon: Weapon, range: string): Array<Specialization> {
        return this._damageService.critSpecialization(weapon, this._currentCreature, range);
    }

    public equippedWeaponsParameters(): Array<WeaponParameters> {
        this._setAttackRestrictions();

        return ([] as Array<Weapon>)
            .concat(this._currentCreature.inventories[0].weapons.filter(weapon => weapon.equipped && weapon.equippable && !weapon.broken))
            .concat(...this._currentCreature.inventories.map(inv => inv.alchemicalbombs))
            .concat(...this._currentCreature.inventories.map(inv => inv.otherconsumablesbombs))
            .sort((a, b) => (a.name === b.name) ? 0 : ((a.name > b.name) ? 1 : -1))
            .sort((a, b) => (a.type === b.type) ? 0 : ((a.type < b.type) ? 1 : -1))
            .map(weapon => ({
                weapon,
                asBomb: this._weaponAsBomb(weapon),
                isAllowed: this._isWeaponAllowed(weapon),
            }));
    }

    public hasMatchingTalismanCord(weapon: Weapon, talisman: Talisman): boolean {
        return weapon.talismanCords.some(cord => cord.isCompatibleWithTalisman(talisman));
    }

    public poisonTitle(poison: AlchemicalPoison): string {
        return poison.desc;
    }

    public onTalismanUse(weapon: Weapon, talisman: Talisman, index: number, preserve = false): void {
        this._refreshService.prepareDetailToChange(this.creature, 'attacks');
        this._characterService.useConsumable(this._currentCreature, talisman, preserve);

        if (!preserve) {
            weapon.talismans.splice(index, 1);
        }

        this._refreshService.processPreparedChanges();
    }

    public onPoisonUse(weapon: Weapon, poison: AlchemicalPoison): void {
        this._refreshService.prepareDetailToChange(this.creature, 'attacks');
        this._characterService.useConsumable(this._currentCreature, poison);
        weapon.poisonsApplied.length = 0;
        this._refreshService.processPreparedChanges();
    }

    public ammoTypes(): Array<string> {
        return Array.from(new Set(
            this.equippedWeaponsParameters()
                .map(weaponParameters => weaponParameters.weapon.ammunition)
                .filter(ammunition => !!ammunition),
        ));
    }

    public availableAmmo(type: string): Array<{ item: Ammunition; name: string; inventory: ItemCollection }> {
        //Return all ammo from all inventories that has this type in its group
        //We need the inventory for using up items and the name just for sorting
        const ammoList: Array<{ item: Ammunition; name: string; inventory: ItemCollection }> = [];

        this._currentCreature.inventories.forEach(inv => {
            inv.ammunition.filter(ammo => [type, 'Any'].includes(ammo.ammunition)).forEach(ammo => {
                ammoList.push({ item: ammo, name: ammo.effectiveName(), inventory: inv });
            });
        });

        return ammoList.sort((a, b) => SortAlphaNum(a.name, b.name));
    }

    public availableSnares(): Array<{ item: Snare; name: string; inventory: ItemCollection }> {
        const snares: Array<{ item: Snare; name: string; inventory: ItemCollection }> = [];

        this._currentCreature.inventories.forEach(inv => {
            inv.snares.forEach(snare => {
                snares.push({ item: snare, name: snare.effectiveName(), inventory: inv });
            });
        });

        return snares.sort((a, b) => SortAlphaNum(a.name, b.name));
    }

    public onConsumableUse(
        item: Ammunition | AlchemicalBomb | OtherConsumableBomb | Snare,
        inv: ItemCollection,
    ): void {
        if (item.storedSpells.length) {
            const spellName = item.storedSpells[0]?.spells[0]?.name || '';
            const spellChoice = item.storedSpells[0];

            if (spellChoice && spellName) {
                const spell = this._characterService.spellsService.spellFromName(item.storedSpells[0]?.spells[0]?.name);

                if (spell) {
                    const tempGain: SpellGain = new SpellGain();
                    let target: SpellTargetSelection = '';

                    if (spell.target === 'self') {
                        target = CreatureTypes.Character;
                    }

                    this._characterService.spellsService.processSpell(
                        spell,
                        true,
                        {
                            characterService: this._characterService,
                            itemsService: this._characterService.itemsService,
                            conditionsService: this._characterService.conditionsService,
                        },
                        { creature: this._character, target, gain: tempGain, level: spellChoice.level },
                        { manual: true },
                    );
                }

                spellChoice.spells.shift();
            }
        }

        this._characterService.useConsumable(this._currentCreature, item as Consumable);

        if (item.canStack()) {
            this._refreshService.prepareDetailToChange(this.creature, 'attacks');
            this._refreshService.processPreparedChanges();
        } else {
            this._characterService.dropInventoryItem(this._currentCreature, inv, item, true);
        }
    }

    public skillsOfType(type: string): Array<Skill> {
        return this._characterService.skills(this._currentCreature, '', { type });
    }

    public traitFromName(traitName: string): Trait {
        return this._traitsService.traitFromName(traitName);
    }

    public hintShowingRunes(weapon: Weapon, range: string): Array<WeaponRune> {
        //Return all runes and rune-emulating effects that have a hint to show.
        const runeSource = attackRuneSource(weapon, this._currentCreature, range);

        return (runeSource.propertyRunes.propertyRunes.filter(rune => rune.hints.length) as Array<WeaponRune>)
            .concat(weapon.oilsApplied.filter(oil => oil.runeEffect && oil.runeEffect.hints.length).map(oil => oil.runeEffect))
            .concat(
                runeSource.propertyRunes.bladeAlly ?
                    runeSource.propertyRunes.bladeAllyRunes.filter(rune => rune.hints.length) as Array<WeaponRune> :
                    [],
            );
    }

    public runesOfWeapon(weapon: Weapon, range: string): Array<WeaponRune> {
        //Return all runes and rune-emulating oil effects.
        const runes: Array<WeaponRune> = [];
        const runeSource = attackRuneSource(weapon, this._currentCreature, range);

        runes.push(...runeSource.propertyRunes.propertyRunes as Array<WeaponRune>);
        runes.push(...weapon.oilsApplied.filter(oil => oil.runeEffect).map(oil => oil.runeEffect));

        if (runeSource.propertyRunes.bladeAlly) {
            runes.push(...runeSource.propertyRunes.bladeAllyRunes as Array<WeaponRune>);
        }

        return runes;
    }

    public applyingHandwrapsOfMightyBlows(weapon: Weapon): WornItem {
        if (weapon.traits.includes('Unarmed')) {
            return this._currentCreature.inventories[0].wornitems
                .find(wornItem => wornItem.isHandwrapsOfMightyBlows && wornItem.invested);
        } else {
            return null;
        }
    }

    public matchingGrievousRuneData(weapon: Weapon, rune: WeaponRune): string {
        return rune.data.find(data => data.name === weapon.group)?.value as string || null;
    }

    public specialShowOnNames(weapon: Weapon, range: string): Array<string> {
        //Under certain circumstances, some Feats apply to Weapons independently of their name.
        //Return names that get_FeatsShowingOn should run on.
        const specialNames: Array<string> = [];

        //Monks with Monastic Weaponry can apply Unarmed effects to Monk weapons.
        if (
            weapon.traits.includes('Monk') &&
            this.creature === CreatureTypes.Character &&
            this._characterService.characterFeatsTaken(0, this._character.level, { featName: 'Monastic Weaponry' })
        ) {
            specialNames.push('Unarmed Attacks');
        }

        //Deity's favored weapons get tagged as "Favored Weapon".
        if (this._weaponPropertiesService.isFavoredWeapon(weapon, this._character)) {
            specialNames.push('Favored Weapon');
        }

        //Weapons with Emblazon Armament get tagged as "Emblazon Armament Weapon".
        if (weapon.$emblazonArmament) {
            weapon.emblazonArmament.forEach(ea => {
                if (ea.type === 'emblazonArmament') {
                    specialNames.push('Emblazon Armament Weapon');
                }
            });
        }

        //Weapons with Emblazon Energy get tagged as "Emblazon Energy Weapon <Choice>".
        if (weapon.$emblazonEnergy) {
            weapon.emblazonArmament.forEach(ea => {
                if (ea.type === 'emblazonEnergy') {
                    specialNames.push(`Emblazon Energy Weapon ${ ea.choice }`);
                }
            });
        }

        //Weapons with Emblazon Antimagic get tagged as "Emblazon Antimagic Weapon".
        if (weapon.$emblazonAntimagic) {
            weapon.emblazonArmament.forEach(ea => {
                if (ea.type === 'emblazonAntimagic') {
                    specialNames.push('Emblazon Antimagic Weapon');
                }
            });
        }

        const creature = this._currentCreature;

        specialNames.push(weapon.effectiveProficiency(creature, this._characterService, creature.level));
        specialNames.push(...weapon.$traits);
        specialNames.push(range);
        specialNames.push(weapon.weaponBase);

        return specialNames;
    }

    public attacksOfWeapon(weapon: Weapon): Array<AttackResult> {
        return ([] as Array<AttackResult>)
            .concat(
                weapon.melee
                    ? [this._attacksService.attack(weapon, this._currentCreature, 'melee')]
                    : [],
            )
            .concat(
                (weapon.ranged || weapon.traits.find(trait => trait.includes('Thrown')))
                    ? [this._attacksService.attack(weapon, this._currentCreature, 'ranged')]
                    : [],
            );
    }

    public damageOfWeapon(weapon: Weapon, range: string): DamageResult {
        return this._damageService.damage(weapon, this._currentCreature, range);
    }

    public isFlurryAllowed(): boolean {
        const creature = this._currentCreature;
        const character = this._character;

        const hasCondition = (name: string): boolean => (
            this._characterService.creatureHasCondition(creature, name)
        );

        if (
            creature === character ||
            (
                creature instanceof AnimalCompanion &&
                this._characterService.characterHasFeat('Animal Companion (Ranger)')
            )
        ) {
            return (
                (
                    this._characterService.characterHasFeat('Flurry') &&
                    hasCondition('Hunt Prey')
                ) ||
                hasCondition('Hunt Prey: Flurry')
            );
        } else {
            return hasCondition('Hunt Prey: Flurry');
        }
    }

    public multipleAttackPenalty(): string {
        const creature = this._currentCreature;
        const conditions: Array<ConditionGain> =
            this._conditionsService
                .currentCreatureConditions(creature, this._characterService, creature.conditions, true)
                .filter(gain =>
                    ['Multiple Attack Penalty', 'Multiple Attack Penalty (Flurry)'].includes(gain.name) &&
                    gain.source === 'Quick Status',
                );

        for (const gain of conditions) {
            if (gain.name === 'Multiple Attack Penalty (Flurry)') {
                switch (gain.choice) {
                    case 'Third Attack': return '3f';
                    case 'Second Attack': return '2f';
                    default: break;
                }
            }

            if (gain.name === 'Multiple Attack Penalty') {
                switch (gain.choice) {
                    case 'Third Attack': return '3';
                    case 'Second Attack': return '2';
                    default: break;
                }
            }
        }

        return '1';
    }

    public setMultipleAttackPenalty(map: '1' | '2' | '3' | '2f' | '3f'): void {
        const creature = this._currentCreature;
        const conditions: Array<ConditionGain> =
            this._conditionsService
                .currentCreatureConditions(creature, this._characterService, creature.conditions, true)
                .filter(gain =>
                    ['Multiple Attack Penalty', 'Multiple Attack Penalty (Flurry)'].includes(gain.name) &&
                    gain.source === 'Quick Status',
                );
        const map2 = conditions.find(gain => gain.name === 'Multiple Attack Penalty' && gain.choice === 'Second Attack');
        const map3 = conditions.find(gain => gain.name === 'Multiple Attack Penalty' && gain.choice === 'Third Attack');
        const map2f = conditions.find(gain => gain.name === 'Multiple Attack Penalty (Flurry)' && gain.choice === 'Second Attack');
        const map3f = conditions.find(gain => gain.name === 'Multiple Attack Penalty (Flurry)' && gain.choice === 'Third Attack');
        let mapName = '';
        let mapChoice = '';

        switch (map) {
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

        if (map2 && map !== '2') {
            this._characterService.removeCondition(creature, map2, false);
        }

        if (map3 && map !== '3') {
            this._characterService.removeCondition(creature, map3, false);
        }

        if (map2f && map !== '2f') {
            this._characterService.removeCondition(creature, map2f, false);
        }

        if (map3f && map !== '3f') {
            this._characterService.removeCondition(creature, map3f, false);
        }

        if (mapName) {
            const newCondition: ConditionGain =
                Object.assign(
                    new ConditionGain(),
                    { name: mapName, choice: mapChoice, source: 'Quick Status', duration: TimePeriods.HalfTurn, locked: true },
                );

            this._characterService.addCondition(creature, newCondition, {}, { noReload: true });
        }

        this._refreshService.processPreparedChanges();
    }

    public rangePenalty(): string {
        const creature = this._currentCreature;
        const conditions: Array<ConditionGain> =
            this._conditionsService
                .currentCreatureConditions(creature, this._characterService, creature.conditions, true)
                .filter(gain => gain.name === 'Range Penalty' && gain.source === 'Quick Status');

        for (const gain of conditions) {
            switch (gain.choice) {
                case 'Sixth Range Increment': return '6';
                case 'Fifth Range Increment': return '5';
                case 'Fourth Range Increment': return '4';
                case 'Third Range Increment': return '3';
                case 'Second Range Increment': return '2';
                default: break;
            }
        }

        return '1';
    }

    public setRangePenalty(rap: '1' | '2' | '3' | '4' | '5' | '6'): void {
        const creature = this._currentCreature;
        const conditions: Array<ConditionGain> =
            this._conditionsService
                .currentCreatureConditions(creature, this._characterService, creature.conditions, true)
                .filter(gain => gain.name === 'Range Penalty' && gain.source === 'Quick Status');
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
            this._characterService.removeCondition(creature, rap2, false);
        }

        if (rap3 && rap !== '3') {
            this._characterService.removeCondition(creature, rap3, false);
        }

        if (rap4 && rap !== '4') {
            this._characterService.removeCondition(creature, rap4, false);
        }

        if (rap5 && rap !== '5') {
            this._characterService.removeCondition(creature, rap5, false);
        }

        if (rap6 && rap !== '6') {
            this._characterService.removeCondition(creature, rap6, false);
        }

        if (rapChoice) {
            const newCondition: ConditionGain =
                Object.assign(
                    new ConditionGain(),
                    { name: 'Range Penalty', choice: rapChoice, source: 'Quick Status', duration: TimePeriods.HalfTurn, locked: true },
                );

            this._characterService.addCondition(creature, newCondition, {}, { noReload: true });
        }

        this._refreshService.processPreparedChanges();
    }

    public favoredWeapons(): Array<string> {
        const creature = this._currentCreature;

        if (creature instanceof Character && creature.class?.deity && creature.class.deityFocused) {
            const deity = this._deitiesService.currentCharacterDeities(this._characterService, creature)[0];
            const favoredWeapons: Array<string> = [];

            if (deity && deity.favoredWeapon.length) {
                favoredWeapons.push(...deity.favoredWeapon);
            }

            if (this._characterService.characterFeatsTaken(1, creature.level, { featName: 'Favored Weapon (Syncretism)' }).length) {
                favoredWeapons.push(...this._characterService.currentCharacterDeities(creature, 'syncretism')[0]?.favoredWeapon || []);
            }

            return favoredWeapons;
        }

        return null;
    }

    public ngOnInit(): void {
        this._changeSubscription = this._refreshService.componentChanged$
            .subscribe(target => {
                if (['attacks', 'all', this.creature.toLowerCase()].includes(target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                if (view.creature.toLowerCase() === this.creature.toLowerCase() && ['attacks', 'all'].includes(view.target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

    private _setAttackRestrictions(): void {
        const onlyAttacks: Array<AttackRestriction> = [];
        const forbiddenAttacks: Array<AttackRestriction> = [];

        this._characterService.currentCreatureConditions(this._currentCreature).filter(gain => gain.apply)
            .forEach(gain => {
                const condition = this._characterService.conditions(gain.name)[0];

                this.onlyAttacks.push(
                    ...condition?.attackRestrictions
                        .filter(restriction =>
                            !restriction.excluding &&
                            (!restriction.conditionChoiceFilter.length || restriction.conditionChoiceFilter.includes(gain.choice)),
                        )
                    || [],
                );
                this.forbiddenAttacks.push(
                    ...condition?.attackRestrictions
                        .filter(restriction =>
                            restriction.excluding &&
                            (!restriction.conditionChoiceFilter.length || restriction.conditionChoiceFilter.includes(gain.choice)),
                        )
                    || [],
                );
            });

        this.onlyAttacks = onlyAttacks;
        this.forbiddenAttacks = forbiddenAttacks;
    }

    private _onEquipmentChange(item: Equipment): void {
        this._refreshService.prepareChangesByItem(
            this._currentCreature,
            item,
            { characterService: this._characterService, activitiesDataService: this._activitiesDataService },
        );
        this._refreshService.processPreparedChanges();
    }

    private _weaponAsBomb(weapon: Weapon): AlchemicalBomb | OtherConsumableBomb {
        return (weapon instanceof AlchemicalBomb || weapon instanceof OtherConsumableBomb) ? weapon : null;
    }

    private _isWeaponAllowed(weapon: Weapon): boolean {
        const creature = this._currentCreature;

        const doesListMatchWeapon =
            (list: Array<AttackRestriction>): boolean =>
                list.some(restriction => {
                    if (restriction.name) {
                        return restriction.name === weapon.name;
                    } else if (restriction.special) {
                        switch (restriction.special) {
                            case 'Favored Weapon':
                                return this._weaponPropertiesService.isFavoredWeapon(weapon, creature);
                            default: break;
                        }
                    }
                });

        return (
            !(
                this.onlyAttacks.length && !doesListMatchWeapon(this.onlyAttacks)
            ) &&
            !doesListMatchWeapon(this.forbiddenAttacks)
        );
    }

}
