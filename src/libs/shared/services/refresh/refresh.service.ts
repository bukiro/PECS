/* eslint-disable complexity */
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { Creature } from 'src/app/classes/Creature';
import { Effect } from 'src/app/classes/Effect';
import { Equipment } from 'src/app/classes/Equipment';
import { Hint } from 'src/app/classes/Hint';
import { Item } from 'src/app/classes/Item';
import { Rune } from 'src/app/classes/Rune';
import { TraitsDataService } from 'src/app/core/services/data/traits-data.service';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { CreatureActivitiesService } from 'src/libs/shared/services/creature-activities/creature-activities.service';

interface DetailToChange {
    creature: CreatureTypes | '';
    target: string;
    subtarget: string;
}

@Injectable({
    providedIn: 'root',
})
export class RefreshService {

    private readonly _componentChanged$: Observable<string | CreatureTypes>;
    private readonly _detailChanged$: Observable<DetailToChange>;
    private _preparedToChange: Array<DetailToChange> = [];
    private readonly _componentChanged = new BehaviorSubject<string>('');
    private readonly _detailChanged =
        new BehaviorSubject<DetailToChange>({ target: '', creature: '', subtarget: '' });
    private _creatureActivitiesService?: CreatureActivitiesService;

    constructor(
        private readonly _traitsDataService: TraitsDataService,
    ) {
        //Prepare the update variables that everything subscribes to.
        this._componentChanged$ = this._componentChanged.asObservable();
        this._detailChanged$ = this._detailChanged.asObservable();
    }

    public get componentChanged$(): Observable<string> {
        return this._componentChanged$;
    }

    public get detailChanged$(): Observable<DetailToChange> {
        return this._detailChanged$;
    }

    //TO-DO: Make this lowercase so the subscriptions don't have to (and then cleanup the subscriptions)
    public setComponentChanged(target = 'all'): void {
        if (['character', 'companion', 'familiar', 'all'].includes(target.toLowerCase())) {
            this._clearPreparedChanges(target);
        }

        this._componentChanged.next(target.toLowerCase());
    }

    public prepareDetailToChange(creature: CreatureTypes = CreatureTypes.Character, target = 'all', subtarget = ''): void {
        this._preparedToChange.push({ creature, target, subtarget });
    }

    public processPreparedChanges(): void {
        Object.values(CreatureTypes).forEach(creature => {
            if (this._preparedToChange.some(view => view.creature === creature && view.target === 'all')) {
                //If "all" is updated for a creature, skip everything else.
                this._clearPreparedChanges(creature);
                this._setDetailChanged({ creature, target: 'all', subtarget: '' });
            } else if (this._preparedToChange.some(view => view.creature === creature && view.target === 'effects')) {
                // If "effects" is updated for a creature, keep everything else for later,
                // as effects may stack up more of the others and will update again afterwards.
                this._preparedToChange = this._preparedToChange.filter(view => !(view.creature === creature && view.target === 'effects'));
                this._setDetailChanged({ creature, target: 'effects', subtarget: '' });
            } else {
                // For the rest, copy the toChange list and clear it,
                // so we don't get a loop if set_ViewChanged() causes more calls of process_ToChange().
                const uniqueOthersStrings = this._preparedToChange
                    .filter(view => view.creature.toLowerCase() === creature.toLowerCase())
                    .map(view => JSON.stringify(view));
                const uniqueOthers = Array.from(new Set(uniqueOthersStrings)).map(view => JSON.parse(view));

                this._clearPreparedChanges(creature);
                uniqueOthers.forEach(view => {
                    this._setDetailChanged(view);
                });
            }
        });
    }

    public prepareChangesByHints(creature: Creature, hints: Array<Hint> = []): void {
        if (!this._creatureActivitiesService) { console.error('CreatureActivitiesService missing in RefreshService!'); }

        const affectedActivities = (targetName: string): boolean =>
            this._creatureActivitiesService?.creatureOwnedActivities(creature, creature.level)
                .some(activity => targetName.includes(activity.name))
            || false;

        hints.forEach(hint => {
            //Update the tags for every element that is named here.
            hint.showon.split(',').forEach(subtarget => {
                this.prepareDetailToChange(creature.type, 'tags', subtarget.trim());
            });

            //If any activities are named, also update the activities area.
            if (affectedActivities(hint.showon)) {
                this.prepareDetailToChange(creature.type, 'activities');
            }

            if (hint.effects.length) {
                this.prepareDetailToChange(creature.type, 'effects');
            }
        });
        this.prepareDetailToChange(creature.type, 'character-sheet');
    }

    public prepareChangesByAbility(creatureType: CreatureTypes, ability: string): void {
        //Set refresh commands for all components of the application depending this ability.
        const abilities: Array<string> = ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'];
        const attacks: Array<string> = ['Dexterity', 'Strength'];
        const defense: Array<string> = ['Constitution', 'Dexterity', 'Wisdom'];
        const general: Array<string> = ['Strength', 'Dexterity', 'Intelligence', 'Wisdom', 'Charisma'];
        const health: Array<string> = ['Constitution'];
        const inventory: Array<string> = ['Strength'];
        const spells: Array<string> = ['Intelligence', 'Charisma', 'Wisdom'];

        //Prepare changes for everything that should be updated according to the ability.
        this.prepareDetailToChange(creatureType, 'abilities');

        if (abilities.includes(ability)) {
            this.prepareDetailToChange(creatureType, 'abilities');
            this.prepareDetailToChange(creatureType, 'individualskills', ability);
        }

        if (attacks.includes(ability)) {
            this.prepareDetailToChange(creatureType, 'attacks');
        }

        if (defense.includes(ability)) {
            this.prepareDetailToChange(creatureType, 'defense');
        }

        if (general.includes(ability)) {
            this.prepareDetailToChange(creatureType, 'general');
        }

        if (health.includes(ability)) {
            this.prepareDetailToChange(creatureType, 'health');
        }

        if (inventory.includes(ability)) {
            this.prepareDetailToChange(creatureType, 'inventory');
        }

        if (spells.includes(ability)) {
            this.prepareDetailToChange(creatureType, 'spells');
            this.prepareDetailToChange(creatureType, 'spellbook');
            this.prepareDetailToChange(creatureType, 'spellchoices');
        }

        this.prepareDetailToChange(creatureType, 'effects');
        this.prepareDetailToChange(CreatureTypes.Character, 'charactersheet');

        if (ability === 'Intelligence') {
            this.prepareDetailToChange(CreatureTypes.Character, 'skillchoices');
            this.prepareDetailToChange(CreatureTypes.Character, 'update-languages');
        }
    }

    public prepareChangesByItem(creature: Creature, item: Item): void {
        this.prepareDetailToChange(creature.type, item.id);
        item.traits.map(trait => this._traitsDataService.traitFromName(trait)).forEach(trait => {
            this.prepareChangesByHints(creature, trait.hints);
        });

        //TO-DO: Group these weapons with an item method, something like 'affectsAttackComponent'.
        if (
            item.isAlchemicalBomb() ||
            item.isOtherConsumableBomb() ||
            item.isAlchemicalPoison() ||
            item.isAmmunition() ||
            item.isSnare()
        ) {
            this.prepareDetailToChange(creature.type, 'attacks');
        }

        if (item.isOil()) {
            this.prepareChangesByHints(creature, item.hints);
        }

        if (item.isRune()) {
            this._prepareChangesByRune(creature, item);
        }

        if (item.isEquipment()) {
            this._prepareChangesByEquipment(creature, item as Equipment);
            this.prepareChangesByHints(creature, item.hints);
        }
    }

    public prepareChangesByEquipmentChoice(creature: Creature, item: Equipment): void {
        if (item.effects.some(effect => effect.value.includes('Choice'))) {
            this.prepareDetailToChange(creature.type, 'effects');
        }

        if (item.hints.some(hint => hint.effects.some(effect => effect.value.includes('Choice')))) {
            this.prepareDetailToChange(creature.type, 'effects');
        }

        if (item.hints.some(hint => hint.conditionChoiceFilter.length)) {
            this.prepareChangesByHints(creature, item.hints);
        }
    }

    public prepareChangesByEffects(newEffects: Array<Effect>, oldEffects: Array<Effect>, context: { creature: Creature }): void {
        //Set refresh commands for all components of the application depending on whether there are new effects affecting their data,
        // or old effects have been removed.

        const changedEffects: Array<Effect> = [];

        // Collect all new feats that don't exist in the old list or old feats that don't exist in the new list
        // - that is, everything that has changed.
        newEffects.forEach(newEffect => {
            if (!oldEffects.some(oldEffect => JSON.stringify(oldEffect) === JSON.stringify(newEffect))) {
                changedEffects.push(newEffect);
            }
        });
        oldEffects.forEach(oldEffect => {
            if (!newEffects.some(newEffect => JSON.stringify(newEffect) === JSON.stringify(oldEffect))) {
                changedEffects.push(oldEffect);
            }
        });

        //Update various components depending on effect targets.
        this._prepareChangesByEffectTargets(changedEffects.map(effect => effect.target), context);

        //If any equipped weapon is affected, update attacks, and if any equipped armor or shield is affected, update defense.
        if (
            context.creature.inventories[0].weapons.some(weapon =>
                weapon.equipped &&
                changedEffects.some(effect => effect.target.toLowerCase() === weapon.name.toLowerCase()),
            )
        ) {
            this.prepareDetailToChange(context.creature.type, 'attacks');
        }

        if (
            context.creature.inventories[0].armors.some(armor =>
                armor.equipped &&
                changedEffects.some(effect => effect.target.toLowerCase() === armor.name.toLowerCase()),
            )
        ) {
            this.prepareDetailToChange(context.creature.type, 'defense');
        }

        if (
            context.creature.inventories[0].shields.some(shield =>
                shield.equipped &&
                changedEffects.some(effect => effect.target.toLowerCase() === shield.name.toLowerCase()),
            )
        ) {
            this.prepareDetailToChange(context.creature.type, 'defense');
        }
    }

    public initialize(creatureActivitiesService: CreatureActivitiesService): void {
        this._creatureActivitiesService = creatureActivitiesService;
    }

    private _prepareChangesByEffectTargets(targets: Array<string>, context: { creature: Creature }): void {
        //Setup lists of names and what they should update.
        const general: Array<string> = ['Max Languages', 'Size'].map(name => name.toLowerCase());
        const generalWildcard: Array<string> = new Array<string>().map(name => name.toLowerCase());
        const abilities: Array<string> =
            ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'].map(name => name.toLowerCase());
        const abilitiesWildcard: Array<string> =
            ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'].map(name => name.toLowerCase());
        const health: Array<string> =
            ['HP', 'Fast Healing', 'Hardness', 'Max Dying', 'Max HP', 'Resting HP Gain', 'Temporary HP', 'Resting Blocked']
                .map(name => name.toLowerCase());
        const healthWildcard: Array<string> = ['Resistance', 'Immunity'].map(name => name.toLowerCase());
        const defense: Array<string> =
            ['AC', 'Saving Throws', 'Fortitude', 'Reflex', 'Will', 'Dexterity-based Checks and DCs',
                'Constitution-based Checks and DCs', 'Wisdom-based Checks and DCs', 'All Checks and DCs',
                'Ignore Armor Penalty', 'Ignore Armor Speed Penalty', 'Proficiency Level', 'Dexterity Modifier Cap']
                .map(name => name.toLowerCase());
        const effects: Array<string> = ['Encumbered Limit'].map(name => name.toLowerCase());
        const fortitude: Array<string> = ['Constitution-based Checks and DCs'].map(name => name.toLowerCase());
        const reflex: Array<string> = ['Dexterity-based Checks and DCs'].map(name => name.toLowerCase());
        const will: Array<string> = ['Wisdom-based Checks and DCs'].map(name => name.toLowerCase());
        const defenseWildcard: Array<string> = ['Proficiency Level'].map(name => name.toLowerCase());
        const attacks: Array<string> =
            ['Damage Rolls', 'Dexterity-based Checks and DCs', 'Strength-based Checks and DCs', 'All Checks and DCs',
                'Unarmed Damage per Die', 'Weapon Damage per Die'].map(name => name.toLowerCase());
        const attacksWildcard: Array<string> =
            ['Attack Rolls', 'Damage', 'Dice Size', 'Dice Number', 'Proficiency Level',
                'Reach', 'Damage Per Die', 'Gain Trait', 'Lose Trait'].map(name => name.toLowerCase());
        const individualskills: Array<string> =
            ['Perception', 'Fortitude', 'Reflex', 'Will', 'Acrobatics', 'Arcana', 'Athletics',
                'Crafting', 'Deception', 'Diplomacy', 'Intimidation', 'Medicine', 'Nature', 'Occultism',
                'Performance', 'Religion', 'Society', 'Stealth', 'Survival', 'Thievery', 'Fortitude', 'Reflex', 'Will']
                .map(name => name.toLowerCase());
        const individualSkillsWildcard: Array<string> =
            ['Lore', 'Class DC', 'Spell DC', 'Spell Attack', 'Attack Rolls'].map(name => name.toLowerCase());
        const skillsWildcard: Array<string> =
            ['All Checks and DCs', 'Skill Checks', 'Proficiency Level', 'Recall Knowledge Checks',
                'Master Recall Knowledge Checks', 'Saving Throws', 'Speed']
                .map(name => name.toLowerCase());
        const inventory: Array<string> = ['Bulk', 'Encumbered Limit', 'Max Bulk', 'Max Invested'].map(name => name.toLowerCase());
        const inventoryWildcard: Array<string> = ['Gain Trait', 'Lose Trait'].map(name => name.toLowerCase());
        const spellbook: Array<string> =
            ['Refocus Bonus Points', 'Focus Points', 'Focus Pool', 'All Checks and DCs',
                'Attack Rolls', 'Spell Attack Rolls', 'Spell DCs'].map(name => name.toLowerCase());
        const spellbookWildcard: Array<string> =
            ['Spell Slots', 'Proficiency Level', 'Spell Level', 'Disabled'].map(name => name.toLowerCase());
        const activities: Array<string> =
            ['Dexterity-based Checks and DCs', 'Strength-based Checks and DCs', 'All Checks and DCs'].map(name => name.toLowerCase());
        const activitiesWildcard: Array<string> = ['Class DC', 'Charges', 'Cooldown', 'Disabled'].map(name => name.toLowerCase());

        //Then prepare changes for everything that should be updated according to the targets.
        targets.forEach(target => {
            const lowerCaseTarget = target.toLowerCase();

            if (general.includes(lowerCaseTarget) || generalWildcard.some(name => lowerCaseTarget.includes(name))) {
                this.prepareDetailToChange(context.creature.type, 'general');
            }

            if (abilities.includes(lowerCaseTarget)) {
                this.prepareDetailToChange(context.creature.type, 'abilities');
                this.prepareDetailToChange(context.creature.type, 'skills');
                this.prepareDetailToChange(context.creature.type, 'effects');
            }

            abilitiesWildcard.filter(name => lowerCaseTarget.includes(name)).forEach(() => {
                this.prepareDetailToChange(context.creature.type, 'abilities');
                this.prepareDetailToChange(context.creature.type, 'skills');
                this.prepareDetailToChange(context.creature.type, 'effects');
            });

            if (health.includes(lowerCaseTarget) || healthWildcard.some(name => lowerCaseTarget.includes(name))) {
                this.prepareDetailToChange(context.creature.type, 'health');
            }

            if (defense.includes(lowerCaseTarget)) {
                this.prepareDetailToChange(context.creature.type, 'defense');
            }

            if (defenseWildcard.some(name => lowerCaseTarget.includes(name))) {
                this.prepareDetailToChange(context.creature.type, 'defense');
            }

            if (effects.includes(lowerCaseTarget)) {
                //Effects need to be re-generated if new effects are likely to change the effect generation procedure itself
                // or its preflight functions.
                this.prepareDetailToChange(context.creature.type, 'effects');
            }

            if (attacks.includes(lowerCaseTarget) || attacksWildcard.some(name => lowerCaseTarget.includes(name))) {
                this.prepareDetailToChange(context.creature.type, 'attacks');
                this.prepareDetailToChange(context.creature.type, 'individualskills', 'attacks');
            }

            if (individualskills.includes(lowerCaseTarget)) {
                this.prepareDetailToChange(context.creature.type, 'individualskills', lowerCaseTarget);
            }

            if (fortitude.includes(lowerCaseTarget)) {
                this.prepareDetailToChange(context.creature.type, 'individualskills', 'fortitude');
            }

            if (reflex.includes(lowerCaseTarget)) {
                this.prepareDetailToChange(context.creature.type, 'individualskills', 'reflex');
            }

            if (will.includes(lowerCaseTarget)) {
                this.prepareDetailToChange(context.creature.type, 'individualskills', 'will');
            }

            if (individualSkillsWildcard.some(name => lowerCaseTarget.includes(name))) {
                this.prepareDetailToChange(context.creature.type, 'individualskills', lowerCaseTarget);
            }

            if (skillsWildcard.some(name => lowerCaseTarget.includes(name))) {
                this.prepareDetailToChange(context.creature.type, 'skills');
                this.prepareDetailToChange(context.creature.type, 'individualskills', 'all');
            }

            if (inventory.includes(lowerCaseTarget)) {
                this.prepareDetailToChange(context.creature.type, 'inventory');
            }

            if (inventoryWildcard.some(name => lowerCaseTarget.includes(name))) {
                this.prepareDetailToChange(context.creature.type, 'inventory');
            }

            if (spellbook.includes(lowerCaseTarget)) {
                this.prepareDetailToChange(context.creature.type, 'spellbook');
            }

            if (spellbookWildcard.some(name => lowerCaseTarget.includes(name))) {
                this.prepareDetailToChange(context.creature.type, 'spellbook');
            }

            if (activities.includes(lowerCaseTarget)) {
                this.prepareDetailToChange(context.creature.type, 'activities');
            }

            if (activitiesWildcard.some(name => lowerCaseTarget.includes(name))) {
                this.prepareDetailToChange(context.creature.type, 'activities');
            }

            //Specific triggers
            if (lowerCaseTarget === 'familiar abilities') {
                //Familiar abilities effects need to update the familiar's featchoices.
                this.prepareDetailToChange(CreatureTypes.Familiar, 'featchoices');
            }
        });
    }

    private _clearPreparedChanges(creatureType = 'all'): void {
        this._preparedToChange = this._preparedToChange
            .filter(view =>
                view.creature.toLowerCase() !== creatureType.toLowerCase() &&
                creatureType.toLowerCase() !== 'all',
            );
    }

    private _setDetailChanged(view: DetailToChange): void {
        this._detailChanged.next(view);
    }

    private _prepareChangesByEquipment(
        creature: Creature,
        item: Equipment,
    ): void {
        //Prepare refresh list according to the item's properties.
        if (item.isShield() || item.isArmor() || item.isWeapon()) {
            this.prepareDetailToChange(creature.type, 'defense');
            //There are effects that are based on your currently equipped armor and shield.
            //That means we have to check the effects whenever we equip or unequip one of those.
            this.prepareDetailToChange(creature.type, 'effects');
        }

        if (item.isWeapon() || (item.isWornItem() && item.isHandwrapsOfMightyBlows)) {
            this.prepareDetailToChange(creature.type, 'attacks');
            //There are effects that are based on your currently weapons.
            //That means we have to check the effects whenever we equip or unequip one of those.
            this.prepareDetailToChange(creature.type, 'effects');
        }

        if (item.effects.length) {
            this.prepareDetailToChange(creature.type, 'effects');
        }

        if (item.gainConditions.length) {
            this.prepareDetailToChange(creature.type, 'effects');
        }

        if (item.activities?.length) {
            this.prepareDetailToChange(creature.type, 'activities');
            item.activities.forEach(activity => {
                activity.showonSkill?.split(',').forEach(skillName => {
                    this.prepareDetailToChange(creature.type, 'skills');
                    this.prepareDetailToChange(creature.type, 'individualskills', skillName.trim());
                });
            });
        }

        if (item.gainActivities?.length) {
            this.prepareDetailToChange(creature.type, 'activities');
            item.gainActivities.forEach(gain => {
                gain.originalActivity.showonSkill?.split(',').forEach(skillName => {
                    this.prepareDetailToChange(creature.type, 'skills');
                    this.prepareDetailToChange(creature.type, 'individualskills', skillName.trim());
                });
            });
        }

        if (item.gainSpells.length) {
            this.prepareDetailToChange(creature.type, 'spellbook');
            this.prepareDetailToChange(creature.type, 'spells');
        }

        if (item.gainSenses.length) {
            this.prepareDetailToChange(creature.type, 'skills');
        }

        item.propertyRunes.forEach(rune => {
            if (item.isArmor()) {
                this.prepareChangesByHints(creature, rune.hints);

                if (rune.effects?.length) {
                    this.prepareDetailToChange(creature.type, 'effects');
                }
            }

            if (rune.activities?.length) {
                this.prepareDetailToChange(creature.type, 'activities');
                rune.activities.forEach(activity => {
                    activity.showonSkill?.split(',').forEach(skillName => {
                        this.prepareDetailToChange(creature.type, 'skills');
                        this.prepareDetailToChange(creature.type, 'individualskills', skillName.trim());
                    });
                });
            }
        });

        if (item.isAdventuringGear()) {
            if (item.isArmoredSkirt) {
                this.prepareDetailToChange(creature.type, 'inventory');
                this.prepareDetailToChange(creature.type, 'defense');
            }
        }

        if (item.isWornItem()) {
            if (item.isDoublingRings) {
                this.prepareDetailToChange(creature.type, 'inventory');
                this.prepareDetailToChange(creature.type, 'attacks');
            }

            if (item.isHandwrapsOfMightyBlows) {
                this.prepareDetailToChange(creature.type, 'inventory');
                this.prepareDetailToChange(creature.type, 'attacks');
            }

            if (item.isBracersOfArmor) {
                this.prepareDetailToChange(creature.type, 'inventory');
                this.prepareDetailToChange(creature.type, 'defense');
            }

            if (item.isRingOfWizardry) {
                this.prepareDetailToChange(creature.type, 'inventory');
                this.prepareDetailToChange(creature.type, 'spellbook');
                this.prepareDetailToChange(creature.type, 'spells');
            }

            if (item.gainLanguages.length) {
                this.prepareDetailToChange(creature.type, 'general');
                this.prepareDetailToChange(creature.type, 'update-languages');
            }

            item.aeonStones.forEach(aeonStone => {
                this.prepareChangesByItem(creature, aeonStone);
            });
        }
    }

    private _prepareChangesByRune(creature: Creature, rune: Rune): void {
        //Prepare refresh list according to the rune's properties.
        this.prepareChangesByHints(creature, rune.hints);

        if (rune.effects.length) {
            this.prepareDetailToChange(creature.type, 'effects');
        }

        if (rune.activities.length) {
            this.prepareDetailToChange(creature.type, 'activities');
        }
    }

}
