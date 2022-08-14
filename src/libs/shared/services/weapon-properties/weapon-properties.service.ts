import { Injectable } from '@angular/core';
import { Creature } from 'src/app/classes/Creature';
import { ProficiencyChange } from 'src/app/classes/ProficiencyChange';
import { Weapon } from 'src/app/classes/Weapon';
import { WornItem } from 'src/app/classes/WornItem';
import { CharacterService } from 'src/app/services/character.service';
import { FeatsDataService } from 'src/app/core/services/data/feats-data.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { ShoddyPenalties } from '../../definitions/shoddyPenalties';
import { MaxSkillLevel, skillLevelBaseStep } from '../../definitions/skillLevels';
import { WeaponProficiencies } from '../../definitions/weaponProficiencies';
import { CreatureFeatsService } from '../creature-feats/creature-feats.service';
import { SkillValuesService } from '../skill-values/skill-values.service';

@Injectable({
    providedIn: 'root',
})
export class WeaponPropertiesService {

    constructor(
        private readonly _characterService: CharacterService,
        private readonly _refreshService: RefreshService,
        private readonly _skillValuesService: SkillValuesService,
        private readonly _featsDataService: FeatsDataService,
        private readonly _creatureFeatsService: CreatureFeatsService,
    ) { }

    public effectiveProficiency(
        weapon: Weapon,
        context: { creature: Creature; charLevel?: number },
    ): string {
        const charLevel = context.charLevel || this._characterService.character.level;

        let proficiency = weapon.prof;
        // Some feats allow you to apply another proficiency to certain weapons, e.g.:
        // "For the purpose of determining your proficiency,
        // martial goblin weapons are simple weapons and advanced goblin weapons are martial weapons."
        const proficiencyChanges: Array<ProficiencyChange> = [];

        if (context.creature.isFamiliar()) {
            return '';
        }

        if (context.creature.isCharacter()) {
            this._characterService.characterFeatsAndFeatures()
                .filter(feat =>
                    feat.changeProficiency.length &&
                    this._creatureFeatsService.creatureHasFeat(
                        feat,
                        { creature: context.creature },
                        { charLevel },
                    ),
                )
                .forEach(feat => {
                    proficiencyChanges.push(...feat.changeProficiency.filter(change =>
                        (!change.name || weapon.name.toLowerCase() === change.name.toLowerCase()) &&
                        (!change.trait || weapon.traits.some(trait => change.trait.includes(trait))) &&
                        (!change.proficiency || (weapon.prof && change.proficiency === weapon.prof)) &&
                        (!change.group || (weapon.group && change.group === weapon.group)),
                    ));
                });

            const proficiencies: Array<string> = proficiencyChanges.map(change => change.result);

            //Set the resulting proficiency to the best result by setting it in order of worst to best.
            if (proficiencies.includes(WeaponProficiencies.Advanced)) {
                proficiency = WeaponProficiencies.Advanced;
            }

            if (proficiencies.includes(WeaponProficiencies.Martial)) {
                proficiency = WeaponProficiencies.Martial;
            }

            if (proficiencies.includes(WeaponProficiencies.Simple)) {
                proficiency = WeaponProficiencies.Simple;
            }

            if (proficiencies.includes(WeaponProficiencies.Unarmed)) {
                proficiency = WeaponProficiencies.Unarmed;
            }
        }

        return proficiency;
    }

    public profLevel(
        weapon: Weapon,
        creature: Creature,
        runeSource: Weapon | WornItem,
        charLevel: number = this._characterService.character.level,
        options: { preparedProficiency?: string } = {},
    ): number {
        if (this._characterService.stillLoading || creature.isFamiliar()) { return 0; }

        let skillLevel = 0;
        const prof = options.preparedProficiency || this.effectiveProficiency(weapon, { creature, charLevel });
        //There are a lot of ways to be trained with a weapon.
        //To determine the skill level, we have to find skills for the item's proficiency, its name, its weapon base and any of its traits.
        const levels: Array<number> = [];

        //If useHighestAttackProficiency is true, the proficiency level will be copied from your highest unarmed or weapon proficiency.
        if (weapon.useHighestAttackProficiency) {
            const highestProficiencySkill =
                this._characterService.skills(creature, 'Highest Attack Proficiency', { type: 'Specific Weapon Proficiency' });

            levels.push(
                this._skillValuesService.level(
                    (
                        this._characterService.skills(creature, weapon.name)[0] ||
                        highestProficiencySkill[0]
                    ),
                    creature
                    , charLevel,
                ) ||
                0,
            );
        }

        //Weapon name, e.g. Demon Sword.
        levels.push(
            this._skillValuesService.level(
                this._characterService.skills(creature, weapon.name, { type: 'Specific Weapon Proficiency' })[0],
                creature,
                charLevel,
            ) ||
            0,
        );
        //Weapon base, e.g. Longsword.
        levels.push(
            weapon.weaponBase
                ? this._skillValuesService.level(
                    this._characterService.skills(creature, weapon.weaponBase, { type: 'Specific Weapon Proficiency' })[0],
                    creature,
                    charLevel,
                )
                : 0,
        );

        //Proficiency and Group, e.g. Martial Sword.
        //There are proficiencies for "Simple Sword" or "Advanced Bow" that we need to consider, so we build that phrase here.
        const profAndGroup = `${ prof.split(' ')[0] } ${ weapon.group }`;

        levels.push(
            this._skillValuesService.level(
                this._characterService.skills(creature, profAndGroup, { type: 'Specific Weapon Proficiency' })[0],
                creature,
                charLevel,
            ) ||
            0,
        );
        //Proficiency, e.g. Martial Weapons.
        levels.push(
            this._skillValuesService.level(prof, creature, charLevel) || 0);
        //Any traits, e.g. Monk. Will include, for instance, "Thrown 20 ft", so we also test the first word of any multi-word trait.
        levels.push(
            ...weapon.traits
                .map(trait =>
                    this._skillValuesService.level(
                        this._characterService.skills(creature, trait, { type: 'Specific Weapon Proficiency' })[0],
                        creature,
                        charLevel,
                    ) ||
                    0,
                ),
        );
        levels.push(
            ...weapon.traits
                .filter(trait => trait.includes(' '))
                .map(trait =>
                    this._skillValuesService.level(
                        this._characterService.skills(creature, trait.split(' ')[0], { type: 'Specific Weapon Proficiency' })[0],
                        creature,
                        charLevel,
                    ) ||
                    0,
                ),
        );
        // Favored Weapon.
        levels.push(
            this.isFavoredWeapon(weapon, creature)
                ? this._skillValuesService.level(
                    this._characterService.skills(creature, 'Favored Weapon', { type: 'Favored Weapon' })[0],
                    creature,
                    charLevel,
                )
                : 0,
        );
        // Get the skill level by applying the result with the most increases, but no higher than 8.
        skillLevel = Math.min(Math.max(...levels.filter(level => level !== undefined)), MaxSkillLevel);

        // If you have an Ancestral Echoing rune on this weapon, you get to raise the item's proficiency by one level,
        // up to the highest proficiency you have.
        let bestSkillLevel: number = skillLevel;

        if (runeSource.propertyRunes.some(rune => rune.name === 'Ancestral Echoing')) {
            // First, we get all the weapon proficiencies...
            const skills: Array<number> =
                this._characterService.skills(creature, '', { type: 'Weapon Proficiency' })
                    .map(skill => this._skillValuesService.level(skill, creature, charLevel));

            skills.push(
                ...this._characterService.skills(creature, '', { type: 'Specific Weapon Proficiency' })
                    .map(skill => this._skillValuesService.level(skill, creature, charLevel)),
            );
            //Then we set this skill level to either this level +2 or the highest of the found proficiencies - whichever is lower.
            bestSkillLevel = Math.min(skillLevel + skillLevelBaseStep, Math.max(...skills));
        }

        // If you have an oil applied that emulates an Ancestral Echoing rune,
        // apply the same rule (there is no such oil, but things can change)
        if (weapon.oilsApplied.some(oil => oil.runeEffect && oil.runeEffect.name === 'Ancestral Echoing')) {
            // First, we get all the weapon proficiencies...
            const skills: Array<number> =
                this._characterService.skills(creature, '', { type: 'Weapon Proficiency' })
                    .map(skill => this._skillValuesService.level(skill, creature, charLevel));

            skills.push(
                ...this._characterService.skills(creature, '', { type: 'Specific Weapon Proficiency' })
                    .map(skill => this._skillValuesService.level(skill, creature, charLevel)));
            // Then we set this skill level to either this level +2 or the highest of the found proficiencies - whichever is lower.
            bestSkillLevel = Math.min(skillLevel + skillLevelBaseStep, Math.max(...skills));
        }

        return bestSkillLevel;
    }


    public updateModifiers(weapon: Weapon, creature: Creature): void {
        //Initialize shoddy values and shield ally/emblazon armament for all shields and weapons.
        //Set components to update if these values have changed from before.
        const oldValues = [weapon.$shoddy, weapon.$emblazonArmament, weapon.$emblazonEnergy, weapon.$emblazonAntimagic];

        this._cacheEffectiveShoddy(weapon, creature);
        this._cacheIsEmblazonArmamentActive(weapon, creature);

        const newValues = [weapon.$shoddy, weapon.$emblazonArmament, weapon.$emblazonEnergy, weapon.$emblazonAntimagic];

        if (oldValues.some((previous, index) => previous !== newValues[index])) {
            this._refreshService.prepareDetailToChange(creature.type, weapon.id);
            this._refreshService.prepareDetailToChange(creature.type, 'attacks');
            this._refreshService.prepareDetailToChange(creature.type, 'inventory');
        }
    }

    public isFavoredWeapon(weapon: Weapon, creature: Creature): boolean {
        if (creature.isFamiliar()) {
            return false;
        }

        if (creature.isCharacter() && creature.class.deity) {
            if (this._characterService.currentCharacterDeities(creature)[0]?.favoredWeapon
                .some(favoredWeapon =>
                    [
                        weapon.name.toLowerCase(),
                        weapon.weaponBase.toLowerCase(),
                        weapon.displayName.toLowerCase(),
                    ].includes(favoredWeapon.toLowerCase()),
                )
            ) {
                return true;
            }
        }

        if (
            creature.isCharacter() &&
            this._characterService.characterFeatsTaken(0, creature.level, { featName: 'Favored Weapon (Syncretism)' }).length
        ) {
            if (this._characterService.currentCharacterDeities(creature, 'syncretism')[0]?.favoredWeapon
                .some(favoredWeapon =>
                    [
                        weapon.name.toLowerCase(),
                        weapon.weaponBase.toLowerCase(),
                        weapon.displayName.toLowerCase(),
                    ].includes(favoredWeapon.toLowerCase()),
                )) {
                return true;
            }
        }

        return false;
    }

    private _cacheEffectiveShoddy(weapon: Weapon, creature: Creature): void {
        //Shoddy items have a -2 penalty to Attack, unless you have the Junk Tinker feat and have crafted the item yourself.
        if (
            weapon.shoddy &&
            weapon.crafted &&
            creature.isCharacter() &&
            this._characterService.characterHasFeat('Junk Tinker')
        ) {
            weapon.$shoddy = ShoddyPenalties.NotShoddy;
        } else if (weapon.shoddy) {
            weapon.$shoddy = ShoddyPenalties.Shoddy;
        } else {
            weapon.$shoddy = ShoddyPenalties.NotShoddy;
        }
    }

    private _cacheIsEmblazonArmamentActive(weapon: Weapon, creature: Creature): void {
        weapon.$emblazonArmament = false;
        weapon.$emblazonEnergy = false;
        weapon.emblazonArmament.forEach(ea => {
            if (
                ea.emblazonDivinity ||
                (
                    creature.isCharacter() &&
                    this._characterService.currentCharacterDeities(creature)
                        .some(deity => deity.name.toLowerCase() === ea.deity.toLowerCase())
                )
            ) {
                switch (ea.type) {
                    case 'emblazonArmament':
                        weapon.$emblazonArmament = true;
                        break;
                    case 'emblazonEnergy':
                        weapon.$emblazonEnergy = true;
                        break;
                    case 'emblazonAntimagic':
                        weapon.$emblazonAntimagic = true;
                        break;
                    default: break;
                }
            }
        });
    }

}
