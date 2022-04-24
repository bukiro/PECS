import { CharacterService } from 'src/app/services/character.service';
import { Skill } from 'src/app/classes/Skill';
import { Ability } from 'src/app/classes/Ability';
import { FeatChoice } from 'src/app/classes/FeatChoice';
import { SkillChoice } from 'src/app/classes/SkillChoice';
import { SpellChoice } from 'src/app/classes/SpellChoice';
import { FormulaChoice } from 'src/app/classes/FormulaChoice';
import { SpellCasting } from 'src/app/classes/SpellCasting';
import { Character } from 'src/app/classes/Character';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { Familiar } from 'src/app/classes/Familiar';
import { Deity } from 'src/app/classes/Deity';
import { Speed } from 'src/app/classes/Speed';
import { SpecializationGain } from 'src/app/classes/SpecializationGain';
import { AbilityChoice } from 'src/app/classes/AbilityChoice';
import { ItemGain } from 'src/app/classes/ItemGain';
import { LoreChoice } from 'src/app/classes/LoreChoice';
import { ProficiencyChange } from 'src/app/classes/ProficiencyChange';
import { HeritageGain } from 'src/app/classes/HeritageGain';
import { Hint } from 'src/app/classes/Hint';
import { BloodMagic } from 'src/app/classes/BloodMagic';
import { Creature } from 'src/app/classes/Creature';
import { ProficiencyCopy } from 'src/app/classes/ProficiencyCopy';
import { LanguageGain } from 'src/app/classes/LanguageGain';
import { SignatureSpellGain } from 'src/app/classes/SignatureSpellGain';
import { EffectGain } from 'src/app/classes/EffectGain';
import { Weapon } from './Weapon';
import { AnimalCompanion } from './AnimalCompanion';

interface AbilityReq {
    ability: string;
    value: number;
}
interface SkillReq {
    skill: string;
    value: number;
}

interface ComplexRequirement {
    alwaysTrue: boolean;
    creatureToTest?: string;
    hasThisFeat?: boolean;
    isOnLevel?: RequirementExpectation;
    countLores?: { query: RequirementBasicQuery, expected?: RequirementExpectation }[];
    countAncestries?: { query: RequirementBasicQuery, expected?: RequirementExpectation }[];
    countBackgrounds?: { query: RequirementBasicQuery, expected?: RequirementExpectation }[];
    countHeritages?: { query: RequirementBasicQuery, expected?: RequirementExpectation }[];
    countSpells?: { query: RequirementQueryCountSpells, expected?: RequirementExpectation }[];
    skillLevels?: { query: RequirementQuerySkillLevel, expected?: RequirementExpectation }[];
    countDeities?: { query: RequirementQueryCountDeities, expected?: RequirementExpectation }[];
    hasAnimalCompanion: RequirementExpectation;
    hasFamiliar: RequirementExpectation;
    countFeats?: { query: RequirementQueryCountFeats, expected?: RequirementExpectation }[];
    matchesAnyOfAligments?: { query: string, expected?: RequirementExpectation }[];
    countClasses?: { query: RequirementQueryClass, expected?: RequirementExpectation }[];
    countSenses?: { query: RequirementBasicQuery, expected?: RequirementExpectation }[];
    countClassSpellcastings?: { query: RequirementQueryClassSpellCasting, expected?: RequirementExpectation }[];
    countLearnedSpells?: { query: RequirementBasicQuery, expected: RequirementExpectation }[];
    countSpeeds?: { query: RequirementBasicQuery, expected: RequirementExpectation }[];
    countFavoredWeapons?: { query: RequirementQueryFavoredWeapon, expected: RequirementExpectation }[];
}

interface RequirementBasicQuery {
    allOfNames?: string;
    anyOfNames?: string;
    any?: boolean;
}

interface RequirementQueryCountSpells extends RequirementBasicQuery {
    ofSpellCasting?: RequirementQuerySpellCasting;
}

interface RequirementQuerySkillLevel extends RequirementBasicQuery {
    anyOfTypes?: string;
    matchingDivineSkill?: boolean;
}

interface RequirementQueryCountFeats extends RequirementBasicQuery {
    havingAnyOfTraits?: string;
    havingAllOfTraits?: string;
    excludeCountAs?: boolean;
}

interface RequirementQueryCountDeities extends RequirementBasicQuery {
    firstOnly?: boolean;
    secondOnly?: boolean;
    allowPhilosophies?: boolean;
    matchingAlignment?: string;
    havingAllOfFonts?: string;
    havingAnyOfSkills?: string;
    havingAnyOfPrimaryDomains?: string;
    havingAnyOfAlternateDomains?: string;
    havingAnyOfDomains?: string;
}

interface RequirementQuerySpellCasting {
    havingAnyOfClassNames?: string;
    havingAnyOfCastingTypes?: string;
    havingAnyOfTraditions?: string;
    havingSpellsOfLevelGreaterOrEqual?: number;
}

interface RequirementQueryClassSpellCasting extends RequirementQuerySpellCasting {
    any?: boolean;
    beingOfPrimaryClass?: boolean;
    beingOfFamiliarsClass?: boolean;
}

interface RequirementQueryClass extends RequirementBasicQuery {
    havingLessHitpointsThan?: number;
    havingMoreHitpointsThan?: number;
}

interface RequirementQueryFavoredWeapon extends RequirementBasicQuery {
    havingAnyOfProficiencies?: string;
}

interface RequirementExpectation {
    isTrue?: boolean;
    isFalse?: boolean;
    isEqual?: number;
    isGreaterThan?: number;
    isGreaterOrEqual?: number;
    isLesserThan?: number;
    isLesserOrEqual?: number;
}

export class Feat {
    public abilityreq: AbilityReq[] = [];
    public access = '';
    //If weaponfeatbase is true, the feat will be copied for every weapon that matches the description in the subtype:
    // Advanced => Advanced Weapons
    // Ancestry => Weapons with a trait that corresponds to an ancestry
    // Uncommon => Weapons with the Uncommon trait
    //These can be combined. Any more filters need to be hardcoded in characterService.create_WeaponFeats().
    public weaponfeatbase = false;
    public anathema: string[] = [];
    public archetype = '';
    public changeProficiency: ProficiencyChange[] = [];
    public copyProficiency: ProficiencyCopy[] = [];
    public bloodMagic: BloodMagic[] = [];
    //Having this feat counts as fulfilling the prerequisite of having the feat named in countAsFeat. This is useful for class feats that allow you to take another of the class type choices.
    public countAsFeat = '';
    //The customData property causes the feat to be copied into a custom feat, and the data property to gain the listed fields.
    // This usually goes hand in hand with feats where you need to make very specific, hardcoded choices that are saved in the data fields.
    public customData: { name: string, type: 'string' | 'number' | 'stringArray' | 'numberArray' }[] = [];
    public displayName = '';
    public desc = '';
    public effects: EffectGain[] = [];
    public featreq: string[] = [];
    public heritagereq = '';
    //You can add requirements to the ignore list. These get evaluated and must result in "levelreq", "abilityreq", "featreq", "skillreq", "heritagereq", "specialreq", "complexreq" or "dedicationlimit" to do anything.
    public ignoreRequirements: string[] = [];
    public gainAbilityChoice: AbilityChoice[] = [];
    public gainActivities: string[] = [];
    public gainAnimalCompanion = '';
    public gainSpecialization: SpecializationGain[] = [];
    public gainFamiliar = false;
    public gainConditions: ConditionGain[] = [];
    public gainFeatChoice: FeatChoice[] = [];
    public gainFormulaChoice: FormulaChoice[] = [];
    public gainAncestry: string[] = [];
    public gainHeritage: HeritageGain[] = [];
    public gainItems: ItemGain[] = [];
    public gainLanguages: LanguageGain[] = [];
    public gainLoreChoice: LoreChoice[] = [];
    public gainSkillChoice: SkillChoice[] = [];
    public gainSpellBookSlots: { spellBookSlots: number[], className: string }[] = [];
    public gainSpellListSpells: string[] = [];
    public gainSpellCasting: SpellCasting[] = [];
    public gainSpellChoice: SpellChoice[] = [];
    public gainDomains: string[] = [];
    public hide = false;
    public hints: Hint[] = [];
    public readonly internalNote: string = '';
    public levelreq = 0;
    public limited = 0;
    public lorebase = '';
    public name = '';
    public onceEffects: EffectGain[] = [];
    public senses: string[] = [];
    public shortdesc = '';
    public skillreq: SkillReq[] = [];
    public specialdesc = '';
    public specialreq = '';
    public specialreqdesc = '';
    public complexreq: ComplexRequirement[] = [];
    public complexreqdesc = '';
    public subType = '';
    public subTypes = false;
    public superType = '';
    public tenets: string[] = [];
    public traits: string[] = [];
    public unlimited = false;
    public usageNote = '';
    public sourceBook = '';
    public allowSignatureSpells: SignatureSpellGain[] = [];
    public PFSnote = '';
    //For feats with the same name (from different source files for example), higher overridePriority wins. If two have the same priority, the first in the list wins.
    public overridePriority = 0;
    recast() {
        this.changeProficiency = this.changeProficiency.map(obj => Object.assign(new ProficiencyChange(), obj).recast());
        this.copyProficiency = this.copyProficiency.map(obj => Object.assign(new ProficiencyCopy(), obj).recast());
        this.bloodMagic = this.bloodMagic.map(obj => Object.assign(new BloodMagic(), obj).recast());
        this.effects = this.effects.map(obj => Object.assign(new EffectGain(), obj).recast());
        this.gainAbilityChoice = this.gainAbilityChoice.map(obj => Object.assign(new AbilityChoice(), obj).recast());
        this.gainSpecialization = this.gainSpecialization.map(obj => Object.assign(new SpecializationGain(), obj).recast());
        this.gainConditions = this.gainConditions.map(obj => Object.assign(new ConditionGain(), obj).recast());
        this.gainFeatChoice = this.gainFeatChoice.map(obj => Object.assign(new FeatChoice(), obj).recast());
        this.gainFormulaChoice = this.gainFormulaChoice.map(obj => Object.assign(new FormulaChoice(), obj).recast());
        this.gainHeritage = this.gainHeritage.map(obj => Object.assign(new HeritageGain(), obj).recast());
        this.gainItems = this.gainItems.map(obj => Object.assign(new ItemGain(), obj).recast());
        this.gainLanguages = this.gainLanguages.map(obj => Object.assign(new LanguageGain(), obj).recast());
        this.gainLoreChoice = this.gainLoreChoice.map(obj => Object.assign(new LoreChoice(), obj).recast());
        this.gainSkillChoice = this.gainSkillChoice.map(obj => Object.assign(new SkillChoice(), obj).recast());
        this.gainSpellCasting = this.gainSpellCasting.map(obj => Object.assign(new SpellCasting(obj.castingType), obj).recast());
        this.gainSpellChoice = this.gainSpellChoice.map(obj => Object.assign(new SpellChoice(), obj).recast());
        this.gainSpellChoice.forEach(choice => {
            if (!choice.source) {
                choice.source = `Feat: ${ this.name }`;
                choice.spells.forEach(gain => {
                    gain.source = choice.source;
                });
            }
        });
        this.hints = this.hints.map(obj => Object.assign(new Hint(), obj).recast());
        this.allowSignatureSpells = this.allowSignatureSpells.map(obj => Object.assign(new SignatureSpellGain(), obj).recast());
        return this;
    }
    prof(skillLevel: number) {
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
    meetsLevelReq(characterService: CharacterService, charLevel: number = characterService.get_Character().level) {
        //If the feat has a levelreq, check if the level beats that.
        //Returns [requirement met, requirement description]
        let result: { met: boolean, desc: string };
        if (this.levelreq) {
            if (charLevel >= this.levelreq) {
                result = { met: true, desc: `Level ${ this.levelreq }` };
            } else {
                result = { met: false, desc: `Level ${ this.levelreq }` };
            }
        } else {
            result = { met: true, desc: '' };
        }
        return result;
    }
    meetsAbilityReq(characterService: CharacterService, charLevel: number = characterService.get_Character().level) {
        //If the feat has an abilityreq, split it into the ability and the requirement (they come in objects {ability, value}), then check if that ability's baseValue() meets the requirement.
        //Ability requirements are checked without temporary bonuses or penalties
        //Returns an array of [requirement met, requirement description]
        const character = characterService.get_Character();
        const result: Array<{ met?: boolean, desc?: string }> = [];
        if (this.abilityreq.length) {
            this.abilityreq.forEach(requirement => {
                const requiredAbility: Ability[] = characterService.get_Abilities(requirement.ability);
                const expected: number = requirement.value;
                if (requiredAbility.length) {
                    requiredAbility.forEach(ability => {
                        if (ability.baseValue(character, characterService, charLevel).result >= expected) {
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
    meetsSkillReq(characterService: CharacterService, charLevel: number = characterService.get_Character().level) {
        //If the feat has a skillreq, first split it into all different requirements,
        //Then check if each one of these requirements {skill, value} are met by the skill's level
        //When evaluating the result, these should be treated as OR requirements - you never need two skillreqs for a feat.
        //Returns an array of [requirement met, requirement description]
        const character = characterService.get_Character();
        const result: Array<{ met?: boolean, desc?: string }> = [];
        const skillreq = JSON.parse(JSON.stringify(this.skillreq));
        //The Versatile Performance feat allows to use Performance instead of Deception, Diplomacy or Intimidation to meet skill requirements for feats.
        //If you have the feat and any of these skills are required, add Performance to the requirements with the lowest required value.
        const matchingreqs = skillreq.filter(requirement => ['Deception', 'Diplomacy', 'Intimidation'].includes(requirement.skill));
        if (matchingreqs.length && characterService.get_CharacterFeatsTaken(1, charLevel, 'Versatile Performance').length) {
            const lowest = Math.min(matchingreqs.map(requirement => requirement.value));
            skillreq.push({ skill: 'Performance', value: lowest });
        }
        if (skillreq.length) {
            skillreq.forEach(requirement => {
                const requiredSkillName: string = requirement.skill;
                const requiredSkill: Skill[] = characterService.get_Skills(character, requiredSkillName, {}, { noSubstitutions: true });
                const expected: number = requirement.value;
                if (requiredSkill.length) {
                    if (requiredSkill
                        .find(skill =>
                            skill.level(character, characterService, charLevel, true) >= expected
                        )
                    ) {
                        result.push({ met: true, desc: this.prof(expected) + requirement.skill });
                    } else {
                        result.push({ met: false, desc: this.prof(expected) + requirement.skill });
                    }
                }
            });
        } else {
            result.push({ met: true, desc: '' });
        }
        return result;
    }
    meetsFeatReq(characterService: CharacterService, charLevel: number = characterService.get_Character().level) {
        //If the feat has a featreq, check if you meet that (or a feat that has this supertype).
        //Returns [requirement met, requirement description]
        //Requirements like "Aggressive Block or Brutish Shove" are split in get_CharacterFeatsAndFeatures().
        const result: Array<{ met?: boolean, desc?: string }> = [];
        if (this.featreq.length) {
            this.featreq.forEach(featreq => {
                //Use testcreature and testfeat to allow to check for the Familiar's feats
                let requiredFeat: Feat[];
                let testcreature: Character | Familiar;
                let testfeat = featreq;
                if (featreq.includes('Familiar:')) {
                    testcreature = characterService.get_Familiar();
                    testfeat = featreq.split('Familiar:')[1].trim();
                    requiredFeat = characterService.familiarsService.get_FamiliarAbilities().filter(ability => [ability.name.toLowerCase(), ability.superType.toLowerCase()].includes(testfeat.toLowerCase()));
                } else {
                    testcreature = characterService.get_Character();
                    requiredFeat = characterService.get_CharacterFeatsAndFeatures(testfeat, '', true, true);
                }
                if (requiredFeat.length) {
                    if (requiredFeat.some(feat => feat.have(testcreature, characterService, charLevel))) {
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
    meetsHeritageReq(characterService: CharacterService, charLevel: number = characterService.get_Character().level) {
        //If the feat has a heritagereq, check if your heritage matches that.
        //Requirements like "irongut goblin heritage or razortooth goblin heritage" are split into each heritage and succeed if either matches your heritage.
        //Returns [requirement met, requirement description]
        const character = characterService.get_Character();
        const result: Array<{ met?: boolean, desc?: string }> = [];
        if (this.heritagereq) {
            if (
                this.heritagereq.split(' or ').find(heritage =>
                    character.class?.heritage?.name.toLowerCase() == heritage.toLowerCase() ||
                    character.class?.heritage?.superType.toLowerCase() == heritage.toLowerCase() ||
                    character.class?.additionalHeritages.some(extraHeritage => extraHeritage.name.toLowerCase() == heritage.toLowerCase()) ||
                    character.class?.additionalHeritages.some(extraHeritage => extraHeritage.superType.toLowerCase() == heritage.toLowerCase())
                )
            ) {
                result.push({ met: true, desc: this.heritagereq });
            } else {
                result.push({ met: false, desc: this.heritagereq });
            }
        } else {
            result.push({ met: true, desc: '' });
        }
        return result;
    }
    meetsSpecialReq(characterService: CharacterService, _charLevel?: number): { met: boolean, desc: string } {
        //If the feat has a specialreq, it comes as a string that contains a condition. Evaluate the condition to find out if the requirement is met.
        //When writing the condition, take care that it only uses variables known in this method,
        //and that it must remain true even after you take the feat (or the feat will be automatically removed.)
        //As an example, if the requirement is:
        //  (Skill_Level('Character', 'Athletics') < 2)
        //instead use:
        //  (Skill_Level('Character', 'Athletics') < 2) || Has_This_Feat()
        //
        //Here we prepare variables and functions to use in specialreq evaluations.
        const character: Character = characterService.get_Character();
        //charLevel is usually the level on which you take the feat. If none is given, the current character level is used for calculations.
        //The variable is recast here so it can be used in eval().
        const charLevel = _charLevel || character.level;
        const familiar: Familiar = characterService.get_Familiar();
        const deities: Deity[] = characterService.deitiesService.get_CharacterDeities(characterService, character, '', charLevel);
        /* eslint-disable @typescript-eslint/no-unused-vars */
        const deity = deities[0];
        const secondDeity = deities[1];
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
            return this.have(characterService.get_Creature(creatureType), characterService, charLevel);
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
        if (this.specialreq) {
            try {
                if (eval(this.specialreq)) {
                    result = { met: true, desc: this.specialreqdesc };
                } else {
                    result = { met: false, desc: this.specialreqdesc };
                }
            } catch (error) {
                console.warn(`Failed evaluating feat requirement of ${ this.name } (${ this.specialreq }): ${ error }`);
                result = { met: false, desc: this.specialreqdesc };
            }
        } else {
            result = { met: true, desc: '' };
        }
        return result;
    }
    meetsComplexReq(characterService: CharacterService, _charLevel?: number): { met: boolean, desc: string } {
        if (!this.complexreq.length) {
            return { met: true, desc: '' };
        }
        const character: Character = characterService.get_Character();
        //charLevel is usually the level on which you want to take the feat. If none is given, the current character level is used for calculations.
        const charLevel = _charLevel || character.level;
        //Split comma lists into lowercase names and replace certain codewords.
        const subType = this.subType.toLowerCase();
        function SplitNames(list: string): string[] {
            return Array.from(new Set(list.toLowerCase().split(',').map(name => {
                switch (name) {
                    case 'subtype':
                        return subType;
                    default:
                        return name;
                }
            })));
        }
        function ApplyDefaultQuery(query: RequirementBasicQuery, list: string[]) {
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
        function DoesNumberMatchExpectation(number: number, expectation: RequirementExpectation): boolean {
            if (!expectation) {
                return !!number;
            }
            return (
                (expectation.isTrue ? !!number : true) &&
                (expectation.isFalse ? !number : true) &&
                (expectation.isEqual ? (number === expectation.isEqual) : true) &&
                (expectation.isGreaterThan ? (number > expectation.isGreaterThan) : true) &&
                (expectation.isGreaterOrEqual ? (number >= expectation.isGreaterOrEqual) : true) &&
                (expectation.isLesserThan ? (number < expectation.isLesserThan) : true) &&
                (expectation.isLesserOrEqual ? (number <= expectation.isLesserOrEqual) : true)
            );
        }
        function DoesNumberListMatchExpectation(numberList: number[], query: RequirementBasicQuery, expectation?: RequirementExpectation): boolean {
            if (query.allOfNames) {
                if (!expectation) {
                    return numberList.every(number => !!number);
                }
                return (
                    (expectation.isTrue ? numberList.every(number => !!number) : true) &&
                    (expectation.isFalse ? numberList.every(number => !number) : true) &&
                    (expectation.isEqual ? numberList.every(number => number === expectation.isEqual) : true) &&
                    (expectation.isGreaterThan ? numberList.every(number => number > expectation.isGreaterThan) : true) &&
                    (expectation.isGreaterOrEqual ? numberList.every(number => number >= expectation.isGreaterOrEqual) : true) &&
                    (expectation.isLesserThan ? numberList.every(number => number < expectation.isLesserThan) : true) &&
                    (expectation.isLesserOrEqual ? numberList.every(number => number <= expectation.isLesserOrEqual) : true)
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
                    (expectation.isGreaterOrEqual ? numberList.some(number => number >= expectation.isGreaterOrEqual) : true) &&
                    (expectation.isLesserThan ? numberList.some(number => number < expectation.isLesserThan) : true) &&
                    (expectation.isLesserOrEqual ? numberList.some(number => number <= expectation.isLesserOrEqual) : true)
                );
            }

        }
        let success = false;
        this.complexreq.forEach(complexreq => {
            //You can choose a creature to check this requirement on. Most checks only run on the character.
            const creatureType = complexreq.creatureToTest || 'Character';
            const creature = characterService.get_Creature(creatureType);
            //Each requirement set is treated as an OR; The first time that any set succeeds, the complex requirements are fulfilled.
            if (!success) {
                let requirementFailure = false;
                //Each singular requirement is treated as AND; The first time that any of them fails, the set fails and the remaining requirements in the set are skipped.
                if (complexreq.hasThisFeat && !requirementFailure) {
                    if (!this.have(creature, characterService, charLevel)) {
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
                        let feats: Feat[] = characterService.get_CharacterFeatsAndFeatures();
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
                        feats = feats.filter(feat => feat.have(creature, characterService, charLevel, true));
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
                        const allLores = Array.from(new Set(character.get_SkillIncreases(characterService, 1, charLevel).filter(increase => increase.name.toLowerCase().includes('lore:')).map(increase => increase.name)));
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
                        const allSenses = characterService.get_Senses(creature, charLevel, false);
                        const queryResult = ApplyDefaultQuery(sensereq.query, allSenses);
                        if (!DoesNumberMatchExpectation(queryResult, sensereq.expected)) {
                            requirementFailure = true;
                        }
                    }
                });
                complexreq.countSpeeds?.forEach(speedreq => {
                    if (!requirementFailure) {
                        const allSpeeds = characterService.get_Speeds(creature).map(speed => speed.name);
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
                            const familiar = characterService.get_FamiliarAvailable() ? characterService.get_Familiar() : null;
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
                        const allSpells = character.get_SpellsTaken(1, charLevel, { characterService: characterService }, { classNames: classNames, traditions: traditions, castingTypes: castingTypes })
                            .map(spellSet => spellSet.gain.name);
                        //TODO: add ofMinLevel
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
                        const allDeities: Deity[] = characterService.deitiesService.get_CharacterDeities(characterService, character, '', charLevel);
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
                                    const deityDomains = deity.get_Domains(character, characterService)
                                        .concat(deity.get_AlternateDomains(character, characterService))
                                        .map(domain => domain.toLowerCase());
                                    return domains.some(domain => deityDomains.includes(domain));
                                });
                        }
                        if (deityreq.query.havingAnyOfPrimaryDomains) {
                            const domains = SplitNames(deityreq.query.havingAnyOfPrimaryDomains);
                            deities = deities
                                .filter(deity => {
                                    const deityDomains = deity.get_Domains(character, characterService)
                                        .map(domain => domain.toLowerCase());
                                    return domains.some(domain => deityDomains.includes(domain));
                                });
                        }
                        if (deityreq.query.havingAnyOfAlternateDomains) {
                            const domains = SplitNames(deityreq.query.havingAnyOfAlternateDomains);
                            deities = deities
                                .filter(deity => {
                                    const deityDomains = deity.get_AlternateDomains(character, characterService)
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
                        const allDeities: Deity[] = characterService.deitiesService.get_CharacterDeities(characterService, character, '', charLevel);
                        let favoredWeapons: string[] = [].concat(...allDeities.map(deity => deity.favoredWeapon));
                        if (favoredweaponreq.query.havingAnyOfProficiencies) {
                            const proficiencies = SplitNames(favoredweaponreq.query.havingAnyOfProficiencies);
                            favoredWeapons = favoredWeapons.filter(weaponName => {
                                const weapon = characterService.itemsService.get_CleanItems().weapons.find(weapon => weapon.name.toLowerCase() === weaponName.toLowerCase());
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
                                allSkills.push(...characterService.get_Skills(creature, '', { type }));
                            });
                        } else if (skillreq.query.allOfNames) {
                            SplitNames(skillreq.query.allOfNames).forEach(name => {
                                allSkills.push(...characterService.get_Skills(creature, name));
                            });
                        } else if (skillreq.query.anyOfNames) {
                            SplitNames(skillreq.query.anyOfNames).forEach(name => {
                                allSkills.push(...characterService.get_Skills(creature, name));
                            });
                        } else {
                            //The default is 'any'.
                            allSkills.push(...characterService.get_Skills(creature, ''));
                        }
                        if (skillreq.query.matchingDivineSkill) {
                            const deity = characterService.get_CharacterDeities(character, '', charLevel)[0];
                            if (!deity) {
                                allSkills = [];
                            } else {
                                const deitySkills = deity.divineSkill.map(skill => skill.toLowerCase());
                                allSkills = allSkills.filter(skill => deitySkills.includes(skill.name.toLowerCase()));
                            }
                        }
                        allSkills = allSkills.filter(skill => !!skill);
                        const allSkillLevels = allSkills.map(skill => skill.level(creature, characterService, charLevel));
                        if (!DoesNumberListMatchExpectation(allSkillLevels, skillreq.query, skillreq.expected)) {
                            requirementFailure = true;
                        }
                    }
                });
                if (complexreq.hasAnimalCompanion && !requirementFailure) {
                    const companions: AnimalCompanion[] = characterService.get_CompanionAvailable() ? [characterService.get_Companion()] : [];
                    const queryResult = companions.length;
                    if (!DoesNumberMatchExpectation(queryResult, complexreq.hasAnimalCompanion)) {
                        requirementFailure = true;
                    }
                }
                if (complexreq.hasFamiliar && !requirementFailure) {
                    const familiars: Familiar[] = characterService.get_FamiliarAvailable() ? [characterService.get_Familiar()] : [];
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
            return { met: true, desc: this.specialreqdesc };
        } else {
            return { met: false, desc: this.specialreqdesc };
        }
    }
    canChoose(characterService: CharacterService, choiceLevel: number = characterService.get_Character().level, charLevel: number = characterService.get_Character().level, skipLevel = false, ignoreRequirementsList: string[] = []) {
        //This function evaluates ALL the possible requirements for taking a feat
        //Returns true only if all the requirements are true. If the feat doesn't have a requirement, it is always true.
        //CharLevel is the level the character is at when the feat is taken (so the level extracted from choice.id).
        //ChoiceLevel is choice.level and may differ, for example when you take a 1st-level general feat at 8th level via General Training. It is only used for the level requirement.
        if (isNaN(charLevel)) {
            charLevel == choiceLevel;
        }
        if (characterService.still_loading()) { return false; }
        //Don't check the level if skipLevel is set. This is used for subFeats, where the superFeat's levelreq is enough.
        const levelreq: boolean = ignoreRequirementsList.includes('levelreq') || skipLevel || this.meetsLevelReq(characterService, choiceLevel).met;
        //Check the ability reqs. True if ALL are true.
        const abilityreqs = this.meetsAbilityReq(characterService, charLevel);
        const abilityreq: boolean = ignoreRequirementsList.includes('abilityreq') || !abilityreqs.filter(req => req.met == false).length;
        //Check the skill reqs. True if ANY is true.
        const skillreqs = this.meetsSkillReq(characterService, charLevel);
        const skillreq: boolean = ignoreRequirementsList.includes('skillreq') || !!skillreqs.filter(req => req.met == true).length;
        //Check the feat reqs. True if ALL are true.
        const featreqs = this.meetsFeatReq(characterService, charLevel);
        const featreq: boolean = ignoreRequirementsList.includes('featreq') || !featreqs.filter(req => req.met == false).length;
        //Check the heritage reqs. True if ALL are true. (There is only one.)
        const heritagereqs = this.meetsHeritageReq(characterService, charLevel);
        const heritagereq: boolean = ignoreRequirementsList.includes('heritagereq') || !heritagereqs.filter(req => req.met == false).length;
        //If any of the previous requirements are already not fulfilled, skip the specialreq, as it is the most performance intensive.
        if (levelreq && levelreq && abilityreq && skillreq && featreq && heritagereq) {
            //Check the special req. True if returns true.
            const specialreq: boolean = ignoreRequirementsList.includes('specialreq') || this.meetsSpecialReq(characterService, charLevel).met;
            //Check the complex req. True if returns true.
            const complexreq: boolean = ignoreRequirementsList.includes('complexreq') || this.meetsComplexReq(characterService, charLevel).met;
            //Return true if all are true. During the migration from eval, both specialreq and complexreq are evaluated.
            return specialreq && complexreq;
        } else {
            return false;
        }
    }
    have(creature: Creature, characterService: CharacterService, charLevel: number = (characterService?.get_Character().level || 0), excludeTemporary = false, includeCountAs = false, minLevel = 1) {
        if (characterService?.still_loading()) { return 0; }
        if (creature instanceof Character) {
            return characterService.get_CharacterFeatsTaken(minLevel, charLevel, this.name, '', '', undefined, excludeTemporary, includeCountAs)?.length || 0;
        } else if (creature instanceof Familiar) {
            return creature.abilities.feats.filter(gain => gain.name.toLowerCase() == this.name.toLowerCase())?.length || 0;
        } else {
            return 0;
        }
    }
}
