/* eslint-disable complexity */
import { Injectable } from '@angular/core';
import { Observable, of, combineLatest, switchMap, map, distinctUntilChanged, tap } from 'rxjs';
import { Specialization } from 'src/app/classes/attacks/specialization';
import { SpecializationGain } from 'src/app/classes/attacks/specialization-gain';
import { Creature } from 'src/app/classes/creatures/creature';
import { AdventuringGear } from 'src/app/classes/items/adventuring-gear';
import { Armor } from 'src/app/classes/items/armor';
import { ShoddyPenalties } from '../../definitions/shoddy-penalties';
import { maxSkillLevel } from '../../definitions/skill-levels';
import { CharacterFeatsService } from '../character-feats/character-feats.service';
import { CreatureConditionsService } from '../creature-conditions/creature-conditions.service';
import { ItemSpecializationsDataService } from '../data/item-specializations-data.service';
import { SkillsDataService } from '../data/skills-data.service';
import { SkillValuesService } from '../skill-values/skill-values.service';
import { emptySafeCombineLatest } from '../../util/observable-utils';
import { AppliedCreatureConditionsService } from '../creature-conditions/applied-creature-conditions.service';

@Injectable({
    providedIn: 'root',
})
export class ArmorPropertiesService {

    constructor(
        private readonly _skillValuesService: SkillValuesService,
        private readonly _appliedCreatureConditionsService: AppliedCreatureConditionsService,
        private readonly _creatureConditionsService: CreatureConditionsService,
        private readonly _itemSpecializationsDataService: ItemSpecializationsDataService,
        private readonly _characterFeatsService: CharacterFeatsService,
        private readonly _skillsDataService: SkillsDataService,
    ) { }

    public effectiveProficiency$(armor: Armor, context: { creature: Creature }): Observable<string> {
        return this._appliedCreatureConditionsService.appliedCreatureConditions$$(context.creature, { name: 'Mage Armor' })
            .pipe(
                map(conditions => !!conditions.length),
                switchMap(hasMageArmor =>
                    //While wearing mage armor, you use your unarmored proficiency to calculate your AC.
                    hasMageArmor
                        ? of('Unarmored Defense')
                        : armor.effectiveProficiencyWithoutEffects$$(),
                ),
            );
    }

    public profLevel$(
        armor: Armor,
        creature: Creature,
    ): Observable<number> {
        if (creature.isFamiliar()) { return of(0); }

        const armorNameSkill =
            this._skillsDataService.skills(
                creature.customSkills,
                armor.name,
                { type: 'Specific Weapon Proficiency' },
                { noSubstitutions: false },
            )[0];

        return combineLatest([
            armorNameSkill
                ? this._skillValuesService.level$(
                    armorNameSkill,
                    creature,
                )
                : of(0),
            this.effectiveProficiency$(armor, { creature })
                .pipe(
                    switchMap(proficiency => this._skillValuesService.level$(
                        proficiency,
                        creature,
                    )),
                ),
        ])
            .pipe(
                map(([armorLevel, proficiencyLevel]) =>
                    //Add either the armor category proficiency or the armor proficiency, whichever is better
                    Math.min(Math.max(armorLevel, proficiencyLevel), maxSkillLevel),
                ),
            );
    }

    public armorSpecializations$(armor: Armor, creature: Creature): Observable<Array<Specialization>> {
        if (!(creature.isCharacter() && armor.group)) {
            return of([]);
        }

        return combineLatest([
            this.effectiveProficiency$(armor, { creature }),
            this._characterFeatsService.characterFeatsAtLevel$$(),
            this.profLevel$(armor, creature),
        ])
            .pipe(
                map(([proficiency, feats, skillLevel]) => {
                    const specializationGains: Array<SpecializationGain> = [];

                    feats
                        .filter(feat => feat.gainSpecialization.length)
                        .forEach(feat => {
                            specializationGains.push(
                                ...feat.gainSpecialization.filter(spec =>
                                    (!spec.group || (armor.group && spec.group.includes(armor.group)))
                                    && (
                                        !spec.name ||
                                        (
                                            (armor.name && spec.name.includes(armor.name))
                                            || (armor.armorBase && spec.name.includes(armor.armorBase))
                                        )
                                    )
                                    && (!spec.trait || armor.traits.filter(trait => trait && spec.trait.includes(trait)).length)
                                    && (!spec.proficiency || (proficiency && spec.proficiency.includes(proficiency)))
                                    && (!spec.skillLevel || skillLevel >= spec.skillLevel)
                                    && (
                                        !spec.featreq ||
                                        this._characterFeatsService.characterHasFeatAtLevel$$(spec.featreq)
                                    ),
                                ),
                            );
                        });

                    return specializationGains;
                }),
                switchMap(specializationGains => emptySafeCombineLatest(
                    specializationGains
                        .map(spec =>
                            (
                                spec.featreq
                                    ? of(true)
                                    : this._characterFeatsService.characterHasFeatAtLevel$$(spec.featreq)
                            )
                                .pipe(
                                    map(hasFeat => hasFeat ? spec : undefined),
                                ),
                        ),
                )),
                map(specializationGains => {
                    const groupSpecializations = this._itemSpecializationsDataService.specializations(armor.group);
                    const specializations: Array<Specialization> = [];

                    specializationGains
                        .filter((spec): spec is SpecializationGain => !!spec)
                        .forEach(critSpec => {
                            const specs: Array<Specialization> =
                                groupSpecializations
                                    .map(spec => Specialization.from(spec));

                            specs.forEach(spec => {
                                if (critSpec.condition) {
                                    spec.desc = `(${ critSpec.condition }) ${ spec.desc }`;
                                }

                                if (!specializations.some(existingspec => JSON.stringify(existingspec) === JSON.stringify(spec))) {
                                    specializations.push(spec);
                                }
                            });
                        });

                    return specializations;
                }),
            );
    }

    public updateModifiers$(armor: Armor, creature: Creature): Observable<boolean> {
        return combineLatest([
            //Initialize shoddy values and armored skirt.
            this._calculateArmoredSkirt$(armor, creature)
                .pipe(
                    distinctUntilChanged(),
                    tap(armoredSkirtValue => {
                        armor.effectiveArmoredSkirt$$.next(armoredSkirtValue);
                    }),
                ),
            this._calculateShoddy$(armor, creature)
                .pipe(
                    distinctUntilChanged(),
                    tap(shoddyValue => {
                        armor.effectiveShoddy$$.next(shoddyValue);
                    }),
                ),
        ])
            .pipe(
                map(() => true),
            );
    }

    private _calculateArmoredSkirt$(armor: Armor, creature: Creature): Observable<-1 | 0 | 1> {
        return creature.inventories.values$
            .pipe(
                switchMap(inventories => emptySafeCombineLatest(
                    inventories.map(inventory => inventory.equippedAdventuringGear$),
                )),
                map(adventuringGearLists =>
                    new Array<AdventuringGear>()
                        .concat(...adventuringGearLists)
                        .some(item => item.isArmoredSkirt),
                ),
                map(hasEquippedArmoredSkirt => {
                    if (hasEquippedArmoredSkirt) {
                        if (['Breastplate', 'Chain Shirt', 'Chain Mail', 'Scale Mail'].includes(armor.name)) {
                            return 1;
                        } else if (['Half Plate', 'Full Plate', 'Hellknight Plate'].includes(armor.name)) {
                            return -1;
                        }
                    }

                    return 0;
                }),
            );
    }

    private _calculateShoddy$(armor: Armor, creature: Creature): Observable<ShoddyPenalties> {
        //Shoddy items have penalties to AC, unless you have the Junk Tinker feat and have crafted the item yourself.
        return (
            creature.isCharacter()
                ? this._characterFeatsService.characterHasFeatAtLevel$$('Junk Tinker')
                : of(false)
        )
            .pipe(
                map(hasJunkTinker => {
                    if (
                        armor.shoddy &&
                        armor.crafted &&
                        hasJunkTinker
                    ) {
                        return ShoddyPenalties.NotShoddy;
                    } else if (armor.shoddy) {
                        return ShoddyPenalties.Shoddy;
                    } else {
                        return ShoddyPenalties.NotShoddy;
                    }
                }),
            );
    }

}
