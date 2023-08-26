import { Injectable } from '@angular/core';
import { Creature } from 'src/app/classes/Creature';
import { ProficiencyChange } from 'src/app/classes/ProficiencyChange';
import { Weapon } from 'src/app/classes/Weapon';
import { WornItem } from 'src/app/classes/WornItem';
import { ShoddyPenalties } from '../../definitions/shoddyPenalties';
import { maxSkillLevel, skillLevelBaseStep } from '../../definitions/skillLevels';
import { WeaponProficiencies } from '../../definitions/weaponProficiencies';
import { SkillValuesService } from '../skill-values/skill-values.service';
import { CharacterDeitiesService } from '../character-deities/character-deities.service';
import { CharacterFeatsService } from '../character-feats/character-feats.service';
import { SkillsDataService } from '../data/skills-data.service';
import { combineLatest, Observable, of, switchMap, map, distinctUntilChanged, tap } from 'rxjs';
import { Skill } from 'src/app/classes/Skill';
import { stringsIncludeCaseInsensitive } from '../../util/stringUtils';
import { EquipmentPropertiesSharedService } from '../equipment-properties-shared/equipment-properties-shared.service';

@Injectable({
    providedIn: 'root',
})
export class WeaponPropertiesService {

    constructor(
        private readonly _skillValuesService: SkillValuesService,
        private readonly _characterDeitiesService: CharacterDeitiesService,
        private readonly _characterFeatsService: CharacterFeatsService,
        private readonly _skillsDataService: SkillsDataService,
        private readonly _equipmentPropertiesSharedService: EquipmentPropertiesSharedService,
    ) { }

    public effectiveProficiency$(
        weapon: Weapon,
        context: { creature: Creature; charLevel?: number },
    ): Observable<WeaponProficiencies> {
        if (context.creature.isFamiliar()) {
            return of(WeaponProficiencies.None);
        }

        return (
            context.creature.isCharacter()
                ? this._characterFeatsService.characterFeatsAtLevel$(context.charLevel)
                : of([])
        )
            .pipe(
                map(characterFeats => {
                    let proficiency: WeaponProficiencies = weapon.prof;
                    // Some feats allow you to apply another proficiency to certain weapons, e.g.:
                    // "For the purpose of determining your proficiency,
                    // martial goblin weapons are simple weapons and advanced goblin weapons are martial weapons."
                    const proficiencyChanges: Array<ProficiencyChange> = [];


                    characterFeats
                        .filter(feat => feat.changeProficiency.length)
                        .forEach(feat => {
                            proficiencyChanges.push(...feat.changeProficiency.filter(change =>
                                (!change.name || weapon.name.toLowerCase() === change.name.toLowerCase()) &&
                                (!change.trait || weapon.traits.some(trait => change.trait.includes(trait))) &&
                                (!change.proficiency || (weapon.prof && change.proficiency === weapon.prof)) &&
                                (!change.group || (weapon.group && change.group === weapon.group)),
                            ));
                        });

                    const proficiencies: Array<WeaponProficiencies> =
                        proficiencyChanges.map(change => change.result);

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

                    return proficiency;
                }),
            );
    }

    public profLevel$(
        weapon: Weapon,
        creature: Creature,
        runeSource: Weapon | WornItem,
        options: { preparedProficiency?: string } = {},
    ): Observable<number> {
        if (creature.isFamiliar()) { return of(0); }

        return combineLatest([
            options.preparedProficiency
                ? of(options.preparedProficiency)
                : this.effectiveProficiency$(weapon, { creature }),
            creature.customSkills.values$,
        ])
            .pipe(
                switchMap(([prof, customSkills]) => {
                    // There are a lot of ways to be trained with a weapon.
                    // To determine the skill level, we have to find skills for the item's proficiency,
                    // its name, its weapon base and any of its traits.
                    // Many of the skills requested here do not actually exist, but they will be created by the skillsDataService
                    // for the purpose of these calculations.
                    // Generally, if a skill is requested from the skillsDataService and noSubstitutions is not set,
                    // a skill will be returned.
                    const levelSources: Array<Observable<number>> = [];

                    // If useHighestAttackProficiency is true,
                    // the proficiency level will be copied from your highest unarmed or weapon proficiency.
                    if (weapon.useHighestAttackProficiency) {
                        levelSources.push(
                            this._skillValuesService.level$(
                                this._skillsDataService
                                    .skills(customSkills, 'Highest Attack Proficiency', { type: 'Specific Weapon Proficiency' })[0],
                                creature,
                            ),
                        );
                    }

                    //Weapon name, e.g. Demon Sword.
                    levelSources.push(
                        this._skillValuesService.level$(
                            this._skillsDataService.skills(customSkills, weapon.name, { type: 'Specific Weapon Proficiency' })[0],
                            creature,
                        ),
                    );
                    //Weapon base, e.g. Longsword.
                    levelSources.push(
                        weapon.weaponBase
                            ? this._skillValuesService.level$(
                                this._skillsDataService
                                    .skills(customSkills, weapon.weaponBase, { type: 'Specific Weapon Proficiency' })[0],
                                creature,
                            )
                            : of(0),
                    );

                    // Proficiency and Group, e.g. Martial Sword.
                    // There are proficiencies for "Simple Sword" or "Advanced Bow" that we need to consider, so we build that phrase here.
                    const profAndGroup = `${ prof.split(' ')[0] } ${ weapon.group }`;

                    levelSources.push(
                        this._skillValuesService.level$(
                            this._skillsDataService.skills(customSkills, profAndGroup, { type: 'Specific Weapon Proficiency' })[0],
                            creature,
                        ),
                    );
                    // Proficiency, e.g. Martial Weapons.
                    levelSources.push(
                        this._skillValuesService.level$(prof, creature) || 0);
                    // Any traits, e.g. Monk. Will include, for instance, "Thrown 20 ft",
                    // so we also test the first word of any multi-word trait.
                    levelSources.push(
                        ...weapon.traits
                            .map(trait =>
                                this._skillValuesService.level$(
                                    this._skillsDataService
                                        .skills(customSkills, trait, { type: 'Specific Weapon Proficiency' })[0],
                                    creature,
                                ),
                            ),
                    );
                    levelSources.push(
                        ...weapon.traits
                            .filter(trait => trait.includes(' '))
                            .map(trait =>
                                this._skillValuesService.level$(
                                    this._skillsDataService
                                        .skills(customSkills, trait.split(' ')[0], { type: 'Specific Weapon Proficiency' })[0],
                                    creature,
                                ),
                            ),
                    );
                    // Favored Weapon.
                    levelSources.push(
                        this.isFavoredWeapon$(weapon, creature)
                            .pipe(isFavoredWeapon =>
                                isFavoredWeapon
                                    ? this._skillValuesService.level$(
                                        this._skillsDataService.skills(customSkills, 'Favored Weapon', { type: 'Favored Weapon' })[0],
                                        creature,
                                    )
                                    : of(0),
                            ),
                    );

                    return combineLatest(levelSources);
                }),
                // Get the skill level by applying the result with the most increases, but no higher than 8.
                map(skillLevels => Math.min(Math.max(...skillLevels, maxSkillLevel))),
                switchMap(skillLevel => {
                    // If you have an Ancestral Echoing rune on this weapon, you get to raise the item's proficiency by one level,
                    // up to the highest proficiency you have.
                    // If you have an oil applied that emulates an Ancestral Echoing rune,
                    // apply the same rule (there is no such oil, but things can change).
                    if (
                        runeSource.propertyRunes.some(rune => rune.name === 'Ancestral Echoing')
                        || weapon.oilsApplied.some(oil => oil.runeEffect && oil.runeEffect.name === 'Ancestral Echoing')
                    ) {
                        // First, we get all the weapon proficiencies...
                        const skills: Array<Skill> =
                            this._skillsDataService
                                .skills(creature.customSkills, '', { type: 'Weapon Proficiency' })
                                .concat(
                                    this._skillsDataService.skills(creature.customSkills, '', { type: 'Specific Weapon Proficiency' }),
                                );

                        // Then we set this skill level to either this level +2
                        // or the highest of the found proficiencies - whichever is lower.
                        return combineLatest(
                            skills.map(skill => this._skillValuesService.level$(skill, creature)),
                        )
                            .pipe(
                                map(skillLevels => Math.min(skillLevel + skillLevelBaseStep, Math.max(...skillLevels))),
                            );
                    }

                    return of(skillLevel);
                }),
            );
    }

    public updateModifiers$(weapon: Weapon, creature: Creature): Observable<void> {
        return combineLatest([
            this._calculateShoddy$(weapon, creature)
                .pipe(
                    distinctUntilChanged(),
                    tap(shoddyValue => {
                        weapon.effectiveShoddy$.next(shoddyValue);
                    }),
                ),
            this._equipmentPropertiesSharedService.calculateEmblazonArmament(weapon, creature)
                .pipe(
                    distinctUntilChanged(),
                    tap(emblazonArmament => {
                        weapon.effectiveEmblazonArmament$.next(emblazonArmament);
                    }),
                ),
        ])
            .pipe(
                switchMap(() => of()),
            );
    }

    public isFavoredWeapon$(weapon: Weapon, creature: Creature): Observable<boolean> {
        if (creature.isCharacter()) {
            return combineLatest([
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
                .pipe(
                    map(deities => deities.some(
                        deity => deity?.favoredWeapon.some(
                            favoredWeapon =>
                                stringsIncludeCaseInsensitive([
                                    weapon.name,
                                    weapon.weaponBase,
                                    weapon.displayName,
                                ], favoredWeapon),
                        ),
                    )),
                );
        }

        return of(false);
    }

    private _calculateShoddy$(weapon: Weapon, creature: Creature): Observable<ShoddyPenalties> {
        //Shoddy items have a -2 penalty to Attack, unless you have the Junk Tinker feat and have crafted the item yourself.
        return (
            creature.isCharacter()
                ? this._characterFeatsService.characterHasFeatAtLevel$('Junk Tinker')
                : of(false)
        )
            .pipe(
                map(hasJunkTinker => {
                    if (
                        weapon.shoddy &&
                        weapon.crafted &&
                        hasJunkTinker
                    ) {
                        return ShoddyPenalties.NotShoddy;
                    } else if (weapon.shoddy) {
                        return ShoddyPenalties.Shoddy;
                    } else {
                        return ShoddyPenalties.NotShoddy;
                    }
                }),
            );
    }

}
