import { FeatChoice } from 'src/app/character-creation/definitions/models/FeatChoice';
import { SkillChoice } from 'src/app/classes/SkillChoice';
import { SpellChoice } from 'src/app/classes/SpellChoice';
import { FormulaChoice } from 'src/app/classes/FormulaChoice';
import { SpellCasting } from 'src/app/classes/SpellCasting';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { SpecializationGain } from 'src/app/classes/SpecializationGain';
import { AbilityChoice } from 'src/app/classes/AbilityChoice';
import { ItemGain } from 'src/app/classes/ItemGain';
import { LoreChoice } from 'src/app/classes/LoreChoice';
import { ProficiencyChange } from 'src/app/classes/ProficiencyChange';
import { HeritageGain } from 'src/app/classes/HeritageGain';
import { Hint } from 'src/app/classes/Hint';
import { BloodMagic } from 'src/app/classes/BloodMagic';
import { ProficiencyCopy } from 'src/app/classes/ProficiencyCopy';
import { LanguageGain } from 'src/app/classes/LanguageGain';
import { SignatureSpellGain } from 'src/app/classes/SignatureSpellGain';
import { EffectGain } from 'src/app/classes/EffectGain';
import { FeatRequirements } from 'src/app/character-creation/definitions/models/featRequirements';
import { FeatIgnoreRequirements } from './featIgnoreRequirements';

export class Feat {
    public abilityreq: Array<FeatRequirements.AbilityRequirement> = [];
    public access = '';
    /**
     * If weaponfeatbase is true, the feat will be copied for every weapon that matches the description in the subtype:
     * - Advanced => Advanced Weapons
     * - Ancestry => Weapons with a trait that corresponds to an ancestry
     * - Uncommon => Weapons with the Uncommon trait
     * These can be combined. Any more filters need to be hardcoded in characterService.create_WeaponFeats().
     */
    public weaponfeatbase = false;
    public anathema: Array<string> = [];
    public archetype = '';
    public changeProficiency: Array<ProficiencyChange> = [];
    public copyProficiency: Array<ProficiencyCopy> = [];
    public bloodMagic: Array<BloodMagic> = [];
    /**
     * Having this feat counts as fulfilling the prerequisite of having the feat named in countAsFeat.
     * This is useful for class feats that allow you to take another of the class type choices.
     */
    public countAsFeat = '';
    /**
     * The customData property causes the feat to be copied into a custom feat, and the data property to gain the listed fields.
     * This usually goes hand in hand with feats where you need to make very specific, hardcoded choices that are saved in the data fields.
     */
    public customData: Array<{ name: string; type: 'string' | 'number' | 'stringArray' | 'numberArray' }> = [];
    public generatedLoreFeat = false;
    public generatedWeaponFeat = false;
    //A custom character feat with canDelete: true can be manually deleted by the user.
    public canDelete = false;
    public displayName = '';
    public desc = '';
    public effects: Array<EffectGain> = [];
    public featreq: Array<string> = [];
    public heritagereq = '';
    /**
     * You can add requirements to the ignore list.
     * These get evaluated as complexreqs and must result in one of the following to disable the requirement:
     * - "levelreq"
     * - "abilityreq"
     * - "featreq"
     * - "skillreq"
     * - "heritagereq"
     * - "complexreq"
     * - "dedicationlimit"
     */
    public ignoreRequirements: Array<FeatIgnoreRequirements.FeatIgnoreRequirement> = [];
    public gainAbilityChoice: Array<AbilityChoice> = [];
    public gainActivities: Array<string> = [];
    public gainAnimalCompanion = '';
    public gainSpecialization: Array<SpecializationGain> = [];
    public gainFamiliar = false;
    public gainConditions: Array<ConditionGain> = [];
    public gainFeatChoice: Array<FeatChoice> = [];
    public gainFormulaChoice: Array<FormulaChoice> = [];
    public gainAncestry: Array<string> = [];
    public gainHeritage: Array<HeritageGain> = [];
    public gainItems: Array<ItemGain> = [];
    public gainLanguages: Array<LanguageGain> = [];
    public gainLoreChoice: Array<LoreChoice> = [];
    public gainSkillChoice: Array<SkillChoice> = [];
    public gainSpellBookSlots: Array<{ spellBookSlots: Array<number>; className: string }> = [];
    public gainSpellListSpells: Array<string> = [];
    public gainSpellCasting: Array<SpellCasting> = [];
    public gainSpellChoice: Array<SpellChoice> = [];
    public gainDomains: Array<string> = [];
    public hide = false;
    public hints: Array<Hint> = [];
    public levelreq = 0;
    public limited = 0;
    public lorebase = '';
    public name = '';
    public onceEffects: Array<EffectGain> = [];
    public senses: Array<string> = [];
    public shortdesc = '';
    public skillreq: Array<FeatRequirements.SkillRequirement> = [];
    public specialdesc = '';
    public complexreq: Array<FeatRequirements.ComplexRequirement> = [];
    public complexreqdesc = '';
    public subType = '';
    public subTypes = false;
    public superType = '';
    public tenets: Array<string> = [];
    public traits: Array<string> = [];
    public unlimited = false;
    public usageNote = '';
    public sourceBook = '';
    public allowSignatureSpells: Array<SignatureSpellGain> = [];
    public PFSnote = '';

    public recast(): Feat {
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
        this.gainHeritage.forEach(gainHeritage => {
            gainHeritage.source = this.name;
        });
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
}
