import { Injectable } from '@angular/core';
import { Ability } from 'src/app/classes/Ability';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { Character } from 'src/app/classes/Character';
import { Deity } from 'src/app/classes/Deity';
import { Familiar } from 'src/app/classes/Familiar';
import { Feat } from 'src/app/classes/Feat';
import { Skill } from 'src/app/classes/Skill';
import { Weapon } from 'src/app/classes/Weapon';
import { CharacterService } from 'src/app/services/character.service';
import { Speed } from 'src/app/classes/Speed';
import { FeatRequirements } from '../../definitions/models/featRequirements';

@Injectable({
    providedIn: 'root'
})
export class FeatRequirementsService {

    constructor(private characterService: CharacterService) { }

    public static prof(skillLevel: number): string {
        switch (skillLevel) {
            case 2:
                return 'Trained in ';
            case 4:
                return 'Expert in ';
            case 6:
                return 'Master in ';
            case 8:
                return 'Legendary in ';
        }
    }

    public meetsLevelReq(feat: Feat, charLevel: number = this.characterService.get_Character().level): FeatRequirements.FeatRequirementResult {
        //If the feat has a levelreq, check if the level beats that.
        //Returns [requirement met, requirement description]
        let result: { met: boolean, desc: string };
        if (feat.levelreq) {
            if (charLevel >= feat.levelreq) {
                result = { met: true, desc: `Level ${ feat.levelreq }` };
            } else {
                result = { met: false, desc: `Level ${ feat.levelreq }` };
            }
        } else {
            result = { met: true, desc: '' };
        }
        return result;
    }

    public meetsAbilityReq(feat: Feat, charLevel: number = this.characterService.get_Character().level): FeatRequirements.FeatRequirementResult[] {
        //If the feat has an abilityreq, split it into the ability and the requirement (they come in objects {ability, value}), then check if that ability's baseValue() meets the requirement.
        //Ability requirements are checked without temporary bonuses or penalties
        //Returns an array of [requirement met, requirement description]
        const character = this.characterService.get_Character();
        const result: Array<{ met: boolean, desc: string }> = [];
        if (feat.abilityreq.length) {
            feat.abilityreq.forEach(requirement => {
                const requiredAbility: Ability[] = this.characterService.get_Abilities(requirement.ability);
                const expected: number = requirement.value;
                if (requiredAbility.length) {
                    requiredAbility.forEach(ability => {
                        if (ability.baseValue(character, this.characterService, charLevel).result >= expected) {
                            result.push({ met: true, desc: `${ ability.name } ${ expected }` });
                        } else {
                            result.push({ met: false, desc: `${ ability.name } ${ expected }` });
                        }
                    });
                }
            });
        } else {
            result.push({ met: true, desc: '' });
        }
        return result;
    }

    public meetsSkillReq(feat: Feat, charLevel: number = this.characterService.get_Character().level): FeatRequirements.FeatRequirementResult[] {
        //If the feat has a skillreq, first split it into all different requirements,
        //Then check if each one of these requirements {skill, value} are met by the skill's level
        //When evaluating the result, these should be treated as OR requirements - you never need two skillreqs for a feat.
        //Returns an array of [requirement met, requirement description]
        const character = this.characterService.get_Character();
        const result: Array<{ met: boolean, desc: string }> = [];
        const skillreq = JSON.parse(JSON.stringify(feat.skillreq));
        //The Versatile Performance feat allows to use Performance instead of Deception, Diplomacy or Intimidation to meet skill requirements for feats.
        //If you have the feat and any of these skills are required, add Performance to the requirements with the lowest required value.
        const matchingreqs = skillreq.filter(requirement => ['Deception', 'Diplomacy', 'Intimidation'].includes(requirement.skill));
        if (matchingreqs.length && this.characterService.get_CharacterFeatsTaken(1, charLevel, 'Versatile Performance').length) {
            const lowest = Math.min(matchingreqs.map(requirement => requirement.value));
            skillreq.push({ skill: 'Performance', value: lowest });
        }
        if (skillreq.length) {
            skillreq.forEach(requirement => {
                const requiredSkillName: string = requirement.skill;
                const requiredSkill: Skill[] = this.characterService.get_Skills(character, requiredSkillName, {}, { noSubstitutions: true });
                const expected: number = requirement.value;
                if (requiredSkill.length) {
                    if (requiredSkill
                        .find(skill =>
                            skill.level(character, this.characterService, charLevel, true) >= expected
                        )
                    ) {
                        result.push({ met: true, desc: FeatRequirementsService.prof(expected) + requirement.skill });
                    } else {
                        result.push({ met: false, desc: FeatRequirementsService.prof(expected) + requirement.skill });
                    }
                }
            });
        } else {
            result.push({ met: true, desc: '' });
        }
        return result;
    }

    public meetsFeatReq(feat: Feat, charLevel: number = this.characterService.get_Character().level): FeatRequirements.FeatRequirementResult[] {
        //If the feat has a featreq, check if you meet that (or a feat that has this supertype).
        //Returns [requirement met, requirement description]
        //Requirements like "Aggressive Block or Brutish Shove" are split in get_CharacterFeatsAndFeatures().
        const result: Array<{ met: boolean, desc: string }> = [];
        if (feat.featreq.length) {
            feat.featreq.forEach(featreq => {
                //Use testcreature and testfeat to allow to check for the Familiar's feats
                let requiredFeat: Feat[];
                let testcreature: Character | Familiar;
                let testfeat = featreq;
                if (featreq.includes('Familiar:')) {
                    testcreature = this.characterService.get_Familiar();
                    testfeat = featreq.split('Familiar:')[1].trim();
                    requiredFeat = this.characterService.familiarsService.get_FamiliarAbilities().filter(ability => [ability.name.toLowerCase(), ability.superType.toLowerCase()].includes(testfeat.toLowerCase()));
                } else {
                    testcreature = this.characterService.get_Character();
                    requiredFeat = this.characterService.get_CharacterFeatsAndFeatures(testfeat, '', true, true);
                }
                if (requiredFeat.length) {
                    if (requiredFeat.some(feat => feat.have(testcreature, this.characterService, charLevel))) {
                        result.push({ met: true, desc: featreq });
                    } else {
                        result.push({ met: false, desc: featreq });
                    }
                } else {
                    result.push({ met: false, desc: featreq });
                }
            });
        } else {
            result.push({ met: true, desc: '' });
        }
        return result;
    }

    public meetsHeritageReq(feat: Feat, charLevel: number = this.characterService.get_Character().level): FeatRequirements.FeatRequirementResult[] {
        //If the feat has a heritagereq, check if your heritage matches that.
        //Requirements like "irongut goblin heritage or razortooth goblin heritage" are split into each heritage and succeed if either matches your heritage.
        //Returns [requirement met, requirement description]
        const character = this.characterService.get_Character();
        const result: Array<{ met: boolean, desc: string }> = [];
        if (feat.heritagereq) {
            if (
                feat.heritagereq.split(' or ').find(heritage =>
                    character.class?.heritage?.name.toLowerCase() == heritage.toLowerCase() ||
                    character.class?.heritage?.superType.toLowerCase() == heritage.toLowerCase() ||
                    character.class?.additionalHeritages.some(extraHeritage => extraHeritage.name.toLowerCase() == heritage.toLowerCase()) ||
                    character.class?.additionalHeritages.some(extraHeritage => extraHeritage.superType.toLowerCase() == heritage.toLowerCase())
                )
            ) {
                result.push({ met: true, desc: feat.heritagereq });
            } else {
                result.push({ met: false, desc: feat.heritagereq });
            }
        } else {
            result.push({ met: true, desc: '' });
        }
        return result;
    }

    public meetsSpecialReq(feat: Feat, _charLevel?: number): FeatRequirements.FeatRequirementResult {
        //If the feat has a specialreq, it comes as a string that contains a condition. Evaluate the condition to find out if the requirement is met.
        //When writing the condition, take care that it only uses variables known in this method,
        //and that it must remain true even after you take the feat (or the feat will be automatically removed.)
        //As an example, if the requirement is:
        //  (Skill_Level('Character', 'Athletics') < 2)
        //instead use:
        //  (Skill_Level('Character', 'Athletics') < 2) || Has_This_Feat()
        //
        //Here we prepare variables and functions to use in specialreq evaluations.
        /* eslint-disable @typescript-eslint/no-unused-vars */
        const characterService = this.characterService;
        const character: Character = characterService.get_Character();
        //charLevel is usually the level on which you take the feat. If none is given, the current character level is used for calculations.
        //The variable is recast here so it can be used in eval().
        const charLevel = _charLevel || character.level;
        const familiar: Familiar = characterService.get_Familiar();
        const deities: Deity[] = characterService.deitiesService.get_CharacterDeities(characterService, character, '', charLevel);
        const deity = deities[0];
        const secondDeity = deities[1];
        const subType = feat.subType;
        function Skill_Level(creatureType: string, name: string) {
            if (creatureType == 'Familiar') {
                return 0;
            } else {
                const creature = characterService.get_Creature(creatureType);
                return characterService.get_Skills(creature, name)[0]?.level(creature, characterService, charLevel) || 0;
            }
        }
        function Skills_Of_Type(type: string, creatureType = 'Character'): Skill[] {
            const creature = characterService.get_Creature(creatureType);
            return characterService.get_Skills(creature, '', { type: type });
        }
        function Has_Skill_Of_Level_By_Type(type: string, levels: number[], options: { mustHaveAll?: boolean } = {}, creatureType = 'Character') {
            const creature = characterService.get_Creature(creatureType);
            const skills = Skills_Of_Type(type, creatureType);
            const skillLevels = new Set(skills.map(skill => skill.level(creature, characterService, charLevel)));
            return options.mustHaveAll ? levels.every(level => skillLevels.has(level)) : levels.some(level => skillLevels.has(level));
        }
        function Speed(creatureType: string, name: string) {
            const creature = characterService.get_Creature(creatureType);
            const speeds: Speed[] = characterService.get_Speeds(creature).filter(speed => speed.name == name);
            if (speeds.length) {
                return speeds[0].value(creature, characterService, characterService.effectsService).result;
            } else {
                return 0;
            }
        }
        function Feats_Taken(creatureType: string) {
            if (creatureType == 'Familiar') {
                return characterService.familiarsService.get_FamiliarAbilities().filter(feat => feat.have(familiar, characterService, charLevel));
            } else if (creatureType == 'Character') {
                return characterService.get_CharacterFeatsTaken(0, charLevel);
            } else {
                return null;
            }
        }
        function Has_Feat(creatureType: string, name: string, includeCountAs = true) {
            //Return whether the feat has been taken up to the current level. A number is not necessary.
            if (creatureType == 'Familiar') {
                return characterService.familiarsService.get_FamiliarAbilities().some(feat => feat.have(familiar, characterService, charLevel));
            } else if (creatureType == 'Character') {
                return !!characterService.get_CharacterFeatsTaken(0, charLevel, name, '', '', undefined, false, includeCountAs).length;
            } else {
                return null;
            }
        }
        function Owned_Stances() {
            return characterService.get_CharacterFeatsAndFeatures('', 'Stance').filter(feat => feat.have(character, characterService, charLevel));
        }
        const Has_This_Feat = (creatureType = 'Character') => {
            return feat.have(characterService.get_Creature(creatureType), characterService, charLevel);
        };
        function Has_Sense(creatureType: string, name: string) {
            return characterService.get_Senses(characterService.get_Creature(creatureType), charLevel, false).includes(name);
        }
        function Has_Any_Lore(): boolean {
            return character.get_SkillIncreases(characterService, 1, charLevel).some(increase => increase.name.toLowerCase().includes('lore:'));
        }
        function Has_AnimalCompanion(): boolean {
            return characterService.get_CompanionAvailable();
        }
        function Has_Familiar(): boolean {
            return characterService.get_FamiliarAvailable();
        }
        function Deity_Has_Domain(deityObject: Deity, domainNames: string[]) {
            domainNames = domainNames.map(name => name.toLowerCase());
            return !!deityObject && deityObject.get_Domains(character, characterService).some(domain => domainNames.includes(domain.toLowerCase()));
        }
        function Deity_Has_Alternate_Domain(deityObject: Deity, domainNames: string[]) {
            domainNames = domainNames.map(name => name.toLowerCase());
            return !!deityObject && deityObject.get_AlternateDomains(character, characterService).some(domain => domainNames.includes(domain.toLowerCase()));
        }
        function Has_Spell(spellName: string, className = '', castingType = ''): boolean {
            return !!character.get_SpellsTaken(1, charLevel, { characterService: characterService }, { spellName, classNames: [className], castingTypes: [castingType] });
        }
        function Favored_Weapons(deityObject: Deity): Weapon[] {
            return deityObject && deityObject.favoredWeapon?.map(favoredWeaponName =>
                characterService.itemsService.get_CleanItems().weapons
                    .find(weapon => weapon.name.toLowerCase() === favoredWeaponName.toLowerCase())
            ) || [];
        }
        /* eslint-enable @typescript-eslint/no-unused-vars */
        let result: { met: boolean, desc: string };
        if (feat.specialreq) {
            try {
                if (eval(feat.specialreq)) {
                    result = { met: true, desc: feat.specialreqdesc };
                } else {
                    result = { met: false, desc: feat.specialreqdesc };
                }
            } catch (error) {
                console.warn(`Failed evaluating feat requirement of ${ feat.name } (${ feat.specialreq }): ${ error }`);
                result = { met: false, desc: feat.specialreqdesc };
            }
        } else {
            result = { met: true, desc: '' };
        }
        return result;
    }

    public meetsComplexReq(feat: Feat, _charLevel?: number): FeatRequirements.FeatRequirementResult {
        if (!feat.complexreq.length) {
            return { met: true, desc: '' };
        }
        const character: Character = this.characterService.get_Character();
        //charLevel is usually the level on which you want to take the feat. If none is given, the current character level is used for calculations.
        const charLevel = _charLevel || character.level;
        //Split comma lists into lowercase names and replace certain codewords.
        const subType = feat.subType.toLowerCase();
        function SplitNames(list: string): string[] {
            return Array.from(new Set(
                list.toLowerCase()
                    .split(',')
                    .map(name => name.trim())
                    .map(name => {
                        switch (name) {
                            case 'subtype':
                                return subType;
                            default:
                                return name;
                        }
                    })
            ));
        }
        function ApplyDefaultQuery(query: FeatRequirements.RequirementBasicQuery, list: string[]) {
            list = list.map(name => name.toLowerCase());
            if (query.any) {
                return list.length;
            } else if (query.allOfNames) {
                const names = SplitNames(query.allOfNames);
                return names.every(name => list.includes(name)) && list.length;
            } else if (query.anyOfNames) {
                const names = SplitNames(query.anyOfNames);
                return names.filter(name => list.includes(name)).length;
            } else {
                return list.length;
            }
        }
        function DoesNumberMatchExpectation(number: number, expectation: FeatRequirements.RequirementExpectation): boolean {
            if (!expectation) {
                return !!number;
            }
            return (
                (expectation.isTrue ? !!number : true) &&
                (expectation.isFalse ? !number : true) &&
                (expectation.isEqual ? (number === expectation.isEqual) : true) &&
                (expectation.isGreaterThan ? (number > expectation.isGreaterThan) : true) &&
                (expectation.isLesserThan ? (number < expectation.isLesserThan) : true)
            );
        }
        function DoesNumberListMatchExpectation(numberList: number[], query: FeatRequirements.RequirementBasicQuery, expectation?: FeatRequirements.RequirementExpectation): boolean {
            if (query.allOfNames) {
                if (!expectation) {
                    return numberList.every(number => !!number);
                }
                return (
                    (expectation.isTrue ? numberList.every(number => !!number) : true) &&
                    (expectation.isFalse ? numberList.every(number => !number) : true) &&
                    (expectation.isEqual ? numberList.every(number => number === expectation.isEqual) : true) &&
                    (expectation.isGreaterThan ? numberList.every(number => number > expectation.isGreaterThan) : true) &&
                    (expectation.isLesserThan ? numberList.every(number => number < expectation.isLesserThan) : true)
                );
            } else {
                if (!expectation) {
                    return numberList.some(number => !!number);
                }
                return (
                    (expectation.isTrue ? numberList.some(number => !!number) : true) &&
                    (expectation.isFalse ? numberList.some(number => !number) : true) &&
                    (expectation.isEqual ? numberList.some(number => number === expectation.isEqual) : true) &&
                    (expectation.isGreaterThan ? numberList.some(number => number > expectation.isGreaterThan) : true) &&
                    (expectation.isLesserThan ? numberList.some(number => number < expectation.isLesserThan) : true)
                );
            }

        }
        let success = false;
        feat.complexreq.forEach(complexreq => {
            //You can choose a creature to check this requirement on. Most checks only run on the character.
            const creatureType = complexreq.creatureToTest || 'Character';
            const creature = this.characterService.get_Creature(creatureType);
            //Each requirement set is treated as an OR; The first time that any set succeeds, the complex requirements are fulfilled.
            if (!success) {
                let requirementFailure = false;
                //Each singular requirement is treated as AND; The first time that any of them fails, the set fails and the remaining requirements in the set are skipped.
                if (complexreq.hasThisFeat && !requirementFailure) {
                    if (!feat.have(creature, this.characterService, charLevel)) {
                        requirementFailure = true;
                    }
                }
                if (complexreq.isOnLevel && !requirementFailure) {
                    const queryResult = charLevel;
                    if (!DoesNumberMatchExpectation(queryResult, complexreq.isOnLevel)) {
                        requirementFailure = true;
                    }
                }
                complexreq.matchesAnyOfAligments?.forEach(alignmentreq => {
                    if (!requirementFailure) {
                        const alignments = SplitNames(alignmentreq.query)
                            .filter(alignment => character.alignment?.toLowerCase().includes(alignment));
                        const queryResult = alignments.length;
                        if (!DoesNumberMatchExpectation(queryResult, alignmentreq.expected)) {
                            requirementFailure = true;
                        }
                    }
                });
                complexreq.countFeats?.forEach(featreq => {
                    if (!requirementFailure) {
                        let feats: Feat[] = this.characterService.get_CharacterFeatsAndFeatures();
                        if (featreq.query.havingAllOfTraits) {
                            const traits = SplitNames(featreq.query.havingAllOfTraits);
                            feats = feats.filter(feat => {
                                const featTraits = feat.traits.map(trait => trait.toLowerCase());
                                return traits.every(trait => featTraits.includes(trait));
                            });
                        }
                        if (featreq.query.havingAnyOfTraits) {
                            const traits = SplitNames(featreq.query.havingAnyOfTraits);
                            feats = feats.filter(feat => {
                                const featTraits = feat.traits.map(trait => trait.toLowerCase());
                                return traits.some(trait => featTraits.includes(trait));
                            });
                        }
                        //For performance reasons, names are filtered before have() is run for each feat.
                        if (featreq.query.allOfNames) {
                            const names = SplitNames(featreq.query.allOfNames);
                            feats = feats.filter(feat => {
                                if (featreq.query.excludeCountAs) {
                                    return names.includes(feat.name.toLowerCase());
                                } else {
                                    return names.some(name =>
                                        [
                                            feat.name.toLowerCase(),
                                            feat.subType.toLowerCase(),
                                            feat.countAsFeat.toLowerCase(),
                                        ].includes(name)
                                    );
                                }
                            });
                        }
                        if (featreq.query.anyOfNames) {
                            const names = SplitNames(featreq.query.anyOfNames);
                            feats = feats.filter(feat => {
                                if (featreq.query.excludeCountAs) {
                                    return names.includes(feat.name.toLowerCase());
                                } else {
                                    return names.some(name =>
                                        [
                                            feat.name.toLowerCase(),
                                            feat.superType.toLowerCase(),
                                            feat.countAsFeat.toLowerCase(),
                                        ].includes(name)
                                    );
                                }
                            });
                        }
                        feats = feats.filter(feat => feat.have(creature, this.characterService, charLevel, true));
                        const featNames = feats.map(feat => feat.name);
                        if (!featreq.query.excludeCountAs) {
                            featNames.push(...feats.map(feat => feat.superType).filter(name => name));
                            featNames.push(...feats.map(feat => feat.countAsFeat).filter(name => name));
                        }
                        const queryResult = ApplyDefaultQuery(featreq.query, featNames);
                        if (!DoesNumberMatchExpectation(queryResult, featreq.expected)) {
                            requirementFailure = true;
                        }
                    }
                });
                complexreq.countLores?.forEach(lorereq => {
                    if (!requirementFailure) {
                        const allLores = Array.from(new Set(character.get_SkillIncreases(this.characterService, 1, charLevel).filter(increase => increase.name.toLowerCase().includes('lore:')).map(increase => increase.name)));
                        const queryResult = ApplyDefaultQuery(lorereq.query, allLores);
                        if (!DoesNumberMatchExpectation(queryResult, lorereq.expected)) {
                            requirementFailure = true;
                        }
                    }
                });
                complexreq.countAncestries?.forEach(lorereq => {
                    if (!requirementFailure) {
                        const allAncestries = character.class?.ancestry?.ancestries || [];
                        const queryResult = ApplyDefaultQuery(lorereq.query, allAncestries);
                        if (!DoesNumberMatchExpectation(queryResult, lorereq.expected)) {
                            requirementFailure = true;
                        }
                    }
                });
                complexreq.countBackgrounds?.forEach(backgroundreq => {
                    if (!requirementFailure) {
                        //You can only have one background.
                        const allBackgrounds = character.class?.background ? [character.class?.background.name.toLowerCase()] : [];
                        const queryResult = ApplyDefaultQuery(backgroundreq.query, allBackgrounds);
                        if (!DoesNumberMatchExpectation(queryResult, backgroundreq.expected)) {
                            requirementFailure = true;
                        }
                    }
                });
                complexreq.countHeritages?.forEach(heritagereq => {
                    if (!requirementFailure) {
                        const allHeritages = character.class?.heritage ?
                            [character.class?.heritage.name.toLowerCase()]
                                .concat(character.class.additionalHeritages.map(heritage => heritage.name.toLowerCase())) :
                            [];
                        const queryResult = ApplyDefaultQuery(heritagereq.query, allHeritages);
                        if (!DoesNumberMatchExpectation(queryResult, heritagereq.expected)) {
                            requirementFailure = true;
                        }
                    }
                });
                complexreq.countSenses?.forEach(sensereq => {
                    if (!requirementFailure) {
                        const allSenses = this.characterService.get_Senses(creature, charLevel, false);
                        const queryResult = ApplyDefaultQuery(sensereq.query, allSenses);
                        if (!DoesNumberMatchExpectation(queryResult, sensereq.expected)) {
                            requirementFailure = true;
                        }
                    }
                });
                complexreq.countSpeeds?.forEach(speedreq => {
                    if (!requirementFailure) {
                        const allSpeeds = this.characterService.get_Speeds(creature).map(speed => speed.name);
                        const queryResult = ApplyDefaultQuery(speedreq.query, allSpeeds);
                        if (!DoesNumberMatchExpectation(queryResult, speedreq.expected)) {
                            requirementFailure = true;
                        }
                    }
                });
                complexreq.countClasses?.forEach(classreq => {
                    if (!requirementFailure) {
                        //You can only have one class.
                        let classes = character.class ? [character.class] : [];
                        if (classreq.query.havingLessHitpointsThan) {
                            classes = classes.filter(_class => _class.hitPoints < classreq.query.havingLessHitpointsThan);
                        }
                        if (classreq.query.havingMoreHitpointsThan) {
                            classes = classes.filter(_class => _class.hitPoints > classreq.query.havingMoreHitpointsThan);
                        }
                        const queryResult = ApplyDefaultQuery(classreq.query, classes.map(_class => _class.name.toLowerCase()));
                        if (!DoesNumberMatchExpectation(queryResult, classreq.expected)) {
                            requirementFailure = true;
                        }
                    }
                });
                complexreq.countClassSpellcastings?.forEach(spellcastingreq => {
                    if (!requirementFailure) {
                        let spellCastings = character.class?.spellCasting.filter(casting => !['Innate', 'Focus'].includes(casting.castingType) && casting.charLevelAvailable <= charLevel);
                        if (spellcastingreq.query.beingOfPrimaryClass) {
                            spellCastings = spellCastings.filter(casting => casting.className.toLowerCase() === character.class.name.toLowerCase());
                        }
                        if (spellcastingreq.query.beingOfFamiliarsClass) {
                            const familiar = this.characterService.get_FamiliarAvailable() ? this.characterService.get_Familiar() : null;
                            if (familiar) {
                                spellCastings = spellCastings.filter(casting => casting.className.toLowerCase() === familiar.originClass.toLowerCase());
                            } else {
                                spellCastings.length = 0;
                            }
                        }
                        if (spellcastingreq.query.havingAnyOfClassNames) {
                            const classNames = SplitNames(spellcastingreq.query.havingAnyOfClassNames);
                            spellCastings = spellCastings.filter(casting => classNames.includes(casting.className.toLowerCase()));
                        }
                        if (spellcastingreq.query.havingAnyOfCastingTypes) {
                            const castingTypes = SplitNames(spellcastingreq.query.havingAnyOfCastingTypes);
                            spellCastings = spellCastings.filter(casting => castingTypes.includes(casting.castingType.toLowerCase()));
                        }
                        if (spellcastingreq.query.havingAnyOfTraditions) {
                            const traditions = SplitNames(spellcastingreq.query.havingAnyOfTraditions);
                            spellCastings = spellCastings.filter(casting => traditions.includes(casting.tradition.toLowerCase()));
                        }
                        if (spellcastingreq.query.havingSpellsOfLevelGreaterOrEqual) {
                            spellCastings = spellCastings.filter(casting => casting.spellChoices.some(choice => choice.charLevelAvailable <= charLevel && choice.level >= spellcastingreq.query.havingSpellsOfLevelGreaterOrEqual));
                        }
                        const queryResult = spellCastings.length;
                        if (!DoesNumberMatchExpectation(queryResult, spellcastingreq.expected)) {
                            requirementFailure = true;
                        }
                    }
                });
                complexreq.countSpells?.forEach(spellreq => {
                    if (!requirementFailure) {
                        const classNames = spellreq.query.ofSpellCasting?.havingAnyOfClassNames ? SplitNames(spellreq.query.ofSpellCasting.havingAnyOfClassNames) : [];
                        const castingTypes = spellreq.query.ofSpellCasting?.havingAnyOfCastingTypes ? SplitNames(spellreq.query.ofSpellCasting.havingAnyOfCastingTypes) : [];
                        const traditions = spellreq.query.ofSpellCasting?.havingAnyOfTraditions ? SplitNames(spellreq.query.ofSpellCasting.havingAnyOfTraditions) : [];
                        const allSpells = character.get_SpellsTaken(1, charLevel, { characterService: this.characterService }, { classNames: classNames, traditions: traditions, castingTypes: castingTypes })
                            .map(spellSet => spellSet.gain.name);
                        const queryResult = ApplyDefaultQuery(spellreq.query, allSpells);
                        if (!DoesNumberMatchExpectation(queryResult, spellreq.expected)) {
                            requirementFailure = true;
                        }
                    }
                });
                complexreq.countLearnedSpells?.forEach(learnedspellreq => {
                    if (!requirementFailure) {
                        const allLearnedSpells = character.get_SpellsLearned().map(learned => learned.name);
                        const queryResult = ApplyDefaultQuery(learnedspellreq.query, allLearnedSpells);
                        if (!DoesNumberMatchExpectation(queryResult, learnedspellreq.expected)) {
                            requirementFailure = true;
                        }
                    }
                });
                complexreq.countDeities?.forEach(deityreq => {
                    if (!requirementFailure) {
                        const allDeities: Deity[] = this.characterService.deitiesService.get_CharacterDeities(this.characterService, character, '', charLevel);
                        let deities: Deity[] = (!deityreq.query.secondOnly ? [allDeities[0]] : [])
                            .concat(!deityreq.query.firstOnly ? [allDeities[1]] : [])
                            .filter(deity => !!deity);
                        if (!deityreq.query.allowPhilosophies) {
                            deities = deities.filter(deity => deity.category !== 'Philosophies');
                        }
                        if (deityreq.query.matchingAlignment) {
                            deities = deities.filter(deity => deity.alignment.toLowerCase().includes(deityreq.query.matchingAlignment.toLowerCase()));
                        }
                        if (deityreq.query.havingAllOfFonts) {
                            const fonts = SplitNames(deityreq.query.havingAllOfFonts);
                            deities = deities.filter(deity => {
                                const deityFonts = deity.divineFont.map(deityFont => deityFont.toLowerCase());
                                return !fonts.some(font => !deityFonts.includes(font));

                            });
                        }
                        if (deityreq.query.havingAnyOfSkills) {
                            const skills = SplitNames(deityreq.query.havingAnyOfSkills);
                            deities = deities.filter(deity => {
                                const deitySkills = deity.divineSkill.map(deitySkill => deitySkill.toLowerCase());
                                return skills.some(skill => deitySkills.includes(skill));
                            });
                        }
                        if (deityreq.query.havingAnyOfDomains) {
                            const domains = SplitNames(deityreq.query.havingAnyOfDomains);
                            deities = deities
                                .filter(deity => {
                                    const deityDomains = deity.get_Domains(character, this.characterService)
                                        .concat(deity.get_AlternateDomains(character, this.characterService))
                                        .map(domain => domain.toLowerCase());
                                    return domains.some(domain => deityDomains.includes(domain));
                                });
                        }
                        if (deityreq.query.havingAnyOfPrimaryDomains) {
                            const domains = SplitNames(deityreq.query.havingAnyOfPrimaryDomains);
                            deities = deities
                                .filter(deity => {
                                    const deityDomains = deity.get_Domains(character, this.characterService)
                                        .map(domain => domain.toLowerCase());
                                    return domains.some(domain => deityDomains.includes(domain));
                                });
                        }
                        if (deityreq.query.havingAnyOfAlternateDomains) {
                            const domains = SplitNames(deityreq.query.havingAnyOfAlternateDomains);
                            deities = deities
                                .filter(deity => {
                                    const deityDomains = deity.get_AlternateDomains(character, this.characterService)
                                        .map(domain => domain.toLowerCase());
                                    return domains.some(domain => deityDomains.includes(domain));
                                });
                        }
                        const queryResult = ApplyDefaultQuery(deityreq.query, deities.map(deity => deity.name));
                        if (!DoesNumberMatchExpectation(queryResult, deityreq.expected)) {
                            requirementFailure = true;
                        }
                    }
                });
                complexreq.countFavoredWeapons?.forEach(favoredweaponreq => {
                    if (!requirementFailure) {
                        const allDeities: Deity[] = this.characterService.deitiesService.get_CharacterDeities(this.characterService, character, '', charLevel);
                        let favoredWeapons: string[] = [].concat(...allDeities.map(deity => deity.favoredWeapon));
                        if (favoredweaponreq.query.havingAnyOfProficiencies) {
                            const proficiencies = SplitNames(favoredweaponreq.query.havingAnyOfProficiencies);
                            favoredWeapons = favoredWeapons.filter(weaponName => {
                                const weapon = this.characterService.itemsService.get_CleanItems().weapons.find(weapon => weapon.name.toLowerCase() === weaponName.toLowerCase());
                                return proficiencies.includes(weapon.prof.toLowerCase());
                            });
                        }
                        const queryResult = ApplyDefaultQuery(favoredweaponreq.query, favoredWeapons);
                        if (!DoesNumberMatchExpectation(queryResult, favoredweaponreq.expected)) {
                            requirementFailure = true;
                        }
                    }
                });
                complexreq.skillLevels?.forEach(skillreq => {
                    if (!requirementFailure) {
                        const types = skillreq.query.anyOfTypes ? SplitNames(skillreq.query.anyOfTypes) : [];
                        let allSkills: Skill[] = [];
                        if (types.length) {
                            types.forEach(type => {
                                allSkills.push(...this.characterService.get_Skills(creature, '', { type }));
                            });
                        } else if (skillreq.query.allOfNames) {
                            SplitNames(skillreq.query.allOfNames).forEach(name => {
                                allSkills.push(...this.characterService.get_Skills(creature, name));
                            });
                        } else if (skillreq.query.anyOfNames) {
                            SplitNames(skillreq.query.anyOfNames).forEach(name => {
                                allSkills.push(...this.characterService.get_Skills(creature, name));
                            });
                        } else {
                            //The default is 'any'.
                            allSkills.push(...this.characterService.get_Skills(creature, ''));
                        }
                        if (skillreq.query.matchingDivineSkill) {
                            const deity = this.characterService.get_CharacterDeities(character, '', charLevel)[0];
                            if (!deity) {
                                allSkills = [];
                            } else {
                                const deitySkills = deity.divineSkill.map(skill => skill.toLowerCase());
                                allSkills = allSkills.filter(skill => deitySkills.includes(skill.name.toLowerCase()));
                            }
                        }
                        allSkills = allSkills.filter(skill => !!skill);
                        const allSkillLevels = allSkills.map(skill => skill.level(creature, this.characterService, charLevel));
                        if (!DoesNumberListMatchExpectation(allSkillLevels, skillreq.query, skillreq.expected)) {
                            requirementFailure = true;
                        }
                    }
                });
                if (complexreq.hasAnimalCompanion && !requirementFailure) {
                    const companions: AnimalCompanion[] = this.characterService.get_CompanionAvailable() ? [this.characterService.get_Companion()] : [];
                    const queryResult = companions.length;
                    if (!DoesNumberMatchExpectation(queryResult, complexreq.hasAnimalCompanion)) {
                        requirementFailure = true;
                    }
                }
                if (complexreq.hasFamiliar && !requirementFailure) {
                    const familiars: Familiar[] = this.characterService.get_FamiliarAvailable() ? [this.characterService.get_Familiar()] : [];
                    const queryResult = familiars.length;
                    if (!DoesNumberMatchExpectation(queryResult, complexreq.hasFamiliar)) {
                        requirementFailure = true;
                    }
                }
                if (!requirementFailure) {
                    success = true;
                }
            }
        });
        if (success) {
            return { met: true, desc: feat.specialreqdesc };
        } else {
            return { met: false, desc: feat.specialreqdesc };
        }
    }

    public canChoose(feat: Feat, context: { choiceLevel?: number, charLevel?: number } = {}, options: { skipLevel?: boolean, ignoreRequirementsList?: string[] } = {}): boolean {
        const characterLevel = this.characterService.get_Character().level;
        context = {
            choiceLevel: characterLevel,
            charLevel: characterLevel,
            ...context,
        };
        options = {
            skipLevel: false,
            ignoreRequirementsList: [],
            ...options,
        };
        //This function evaluates ALL the possible requirements for taking a feat.
        //Returns true only if all the requirements are true. If the feat doesn't have a requirement, it is always true.
        //CharLevel is the level the character is at when the feat is taken (so the level extracted from choice.id).
        //ChoiceLevel is choice.level and may differ, for example when you take a 1st-level general feat at 8th level via General Training. It is only used for the level requirement.
        if (isNaN(context.charLevel)) {
            context.charLevel == context.choiceLevel;
        }
        if (this.characterService.still_loading()) { return false; }
        //Don't check the level if skipLevel is set. This is used for subFeats, where the superFeat's levelreq is enough.
        const levelreq: boolean = options.ignoreRequirementsList.includes('levelreq') || options.skipLevel || this.meetsLevelReq(feat, context.choiceLevel).met;
        //Check the ability reqs. True if ALL are true.
        const abilityreqs = this.meetsAbilityReq(feat, context.charLevel);
        const abilityreq: boolean = options.ignoreRequirementsList.includes('abilityreq') || !abilityreqs.filter(req => req.met == false).length;
        //Check the skill reqs. True if ANY is true.
        const skillreqs = this.meetsSkillReq(feat, context.charLevel);
        const skillreq: boolean = options.ignoreRequirementsList.includes('skillreq') || !!skillreqs.filter(req => req.met == true).length;
        //Check the feat reqs. True if ALL are true.
        const featreqs = this.meetsFeatReq(feat, context.charLevel);
        const featreq: boolean = options.ignoreRequirementsList.includes('featreq') || !featreqs.filter(req => req.met == false).length;
        //Check the heritage reqs. True if ALL are true. (There is only one.)
        const heritagereqs = this.meetsHeritageReq(feat, context.charLevel);
        const heritagereq: boolean = options.ignoreRequirementsList.includes('heritagereq') || !heritagereqs.filter(req => req.met == false).length;
        //If any of the previous requirements are already not fulfilled, skip the specialreq, as it is the most performance intensive.
        if (levelreq && levelreq && abilityreq && skillreq && featreq && heritagereq) {
            //Check the special req. True if returns true.
            const specialreq: boolean = options.ignoreRequirementsList.includes('specialreq') || this.meetsSpecialReq(feat, context.charLevel).met;
            //Check the complex req. True if returns true.
            const complexreq: boolean = options.ignoreRequirementsList.includes('complexreq') || this.meetsComplexReq(feat, context.charLevel).met;
            //Return true if all are true. During the migration from eval, both specialreq and complexreq are evaluated.
            return specialreq && complexreq;
        } else {
            return false;
        }
    }

}