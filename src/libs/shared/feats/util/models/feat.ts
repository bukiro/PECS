import { setupSerializationWithHelpers } from 'src/libs/shared/serialization/util/utils/serialization';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { FeatChoice } from './feat-choice';
import { FeatIgnoreRequirement } from './feat-ignore-requirements';
import { FeatRequirements } from './feat-requirements';
import { MaybeSerialized, Serializable, Serialized } from 'src/libs/shared/serialization/util/models/serializable';
import { ProficiencyCopyGain } from './proficiency-copy-gain';
import { ProficiencyChange } from './proficiency-change';
import { EffectGain } from 'src/libs/shared/effects/util/models/effect-gain';
import { ConditionGain } from 'src/libs/shared/conditions/util/models/condition-gain';
import { ItemGain } from 'src/libs/shared/items/util/models/item-gain';
import { SpellCasting } from 'src/libs/shared/spells/util/models/spell-casting';
import { SpellChoice } from 'src/libs/shared/spells/util/models/spell-choice';
import { Hint } from 'src/libs/shared/hints/util/models/hint';
import { SignatureSpellGain } from 'src/libs/shared/spells/util/models/signature-spell-gain';
import { BloodMagic } from 'src/libs/shared/spells/util/models/blood-magic';
import { AbilityChoice } from 'src/libs/shared/abilities/util/models/ability-choice';
import { SpecializationGain } from './specialization-gain';
import { SkillChoice } from 'src/libs/shared/skills/util/models/skill-choice';
import { LoreChoice } from 'src/libs/shared/lores/util/models/lore-choice';
import { LanguageGain } from 'src/libs/shared/languages/util/models/language-gain';
import { HeritageGain } from 'src/libs/shared/character/util/models/heritage-gain';
import { FormulaChoice } from 'src/libs/shared/crafting/util/models/formula-choice';
import { signal } from '@angular/core';

export type SerializedFeat = Serialized<Pick<Feat, 'complexreq'>>;

const { assign, forExport, isEqual } = setupSerializationWithHelpers<Feat>({
    primitives: [
        'access',
        'weaponfeatbase',
        'archetype',
        'countAsFeat',
        'generatedLoreFeat',
        'generatedWeaponFeat',
        'canDelete',
        'displayName',
        'desc',
        'heritagereq',
        'gainAnimalCompanion',
        'gainFamiliar',
        'hide',
        'levelreq',
        'limited',
        'lorebase',
        'name',
        'shortdesc',
        'specialdesc',
        'complexreqdesc',
        'subType',
        'subTypes',
        'superType',
        'unlimited',
        'usageNote',
        'sourceBook',
        'PFSnote',
    ],
    primitiveArrays: [
        'anathema',
        'featreq',
        'gainActivities',
        'gainAncestry',
        'gainSpellListSpells',
        'gainDomains',
        'senses',
        'tenets',
        'traits',
    ],
    primitiveObjectArrays: [
        'customData',
        'ignoreRequirements',
        'skillreq',
        'complexreq',
        'abilityreq',
    ],
    serializableArrays: {
        effects:
            () => obj => EffectGain.from(obj),
        changeProficiency:
            () => obj => ProficiencyChange.from(obj),
        copyProficiency:
            () => obj => ProficiencyCopyGain.from(obj),
        bloodMagic:
            () => obj => BloodMagic.from(obj),
        gainAbilityChoice:
            () => obj => AbilityChoice.from(obj),
        gainSpecialization:
            () => obj => SpecializationGain.from(obj),
        gainConditions:
            recastFns => obj => ConditionGain.from(obj, recastFns),
        gainFeatChoice:
            recastFns => obj => FeatChoice.from(obj, recastFns),
        gainFormulaChoice:
            () => obj => FormulaChoice.from(obj),
        gainHeritage:
            () => obj => HeritageGain.from(obj),
        gainItems:
            () => obj => ItemGain.from(obj),
        gainLanguages:
            () => obj => LanguageGain.from(obj),
        gainLoreChoice:
            () => obj => LoreChoice.from(obj),
        gainSkillChoice:
            () => obj => SkillChoice.from(obj),
        gainSpellCasting:
            recastFns => obj => SpellCasting.from(obj, recastFns),
        gainSpellChoice:
            recastFns => obj => SpellChoice.from(obj, recastFns),
        hints:
            () => obj => Hint.from(obj),
        onceEffects:
            () => obj => EffectGain.from(obj),
        allowSignatureSpells:
            () => obj => SignatureSpellGain.from(obj),
    },
});

export class Feat implements Serializable<Feat> {
    public access = '';
    /**
     * If weaponfeatbase is true, the feat will be copied for every weapon that matches the description in the subtype:
     * - Advanced => Advanced Weapons
     * - Ancestry => Weapons with a trait that corresponds to an ancestry
     * - Uncommon => Weapons with the Uncommon trait
     * These can be combined. Any more filters need to be hardcoded in characterService.create_WeaponFeats().
     */
    public weaponfeatbase = false;
    public archetype = '';
    /**
     * Having this feat counts as fulfilling the prerequisite of having the feat named in countAsFeat.
     * This is useful for class feats that allow you to take another of the class type choices.
     */
    public countAsFeat = '';
    public generatedLoreFeat = false;
    public generatedWeaponFeat = false;
    // A custom character feat with canDelete: true can be manually deleted by the user.
    // This is only set on custom feats, so can be reactive.
    public canDelete = signal(false);
    public displayName = '';
    public desc = '';
    public heritagereq = '';
    public gainAnimalCompanion = '';
    public gainFamiliar = false;
    public hide = false;
    public levelreq = 0;
    public limited = 0;
    public lorebase = '';
    public name = '';
    public shortdesc = '';
    public specialdesc = '';
    public complexreqdesc = '';
    public subType = '';
    public subTypes = false;
    public superType = '';
    public unlimited = false;
    public usageNote = '';
    public sourceBook = '';
    public PFSnote = '';

    public anathema: Array<string> = [];
    public featreq: Array<string> = [];
    public gainActivities: Array<string> = [];
    public gainAncestry: Array<string> = [];
    public gainSpellListSpells: Array<string> = [];
    public gainDomains: Array<string> = [];
    public senses: Array<string> = [];
    public tenets: Array<string> = [];
    public traits: Array<string> = [];

    /**
     * The customData property causes the feat to be copied into a custom feat, and the data property to gain the listed fields.
     * This usually goes hand in hand with feats where you need to make very specific, hardcoded choices that are saved in the data fields.
     */
    public customData: Array<{ name: string; type: 'string' | 'number' | 'stringArray' | 'numberArray' }> = [];
    /**
     * You can add requirements to the ignore list.
     * These get evaluated as complexreqs and must each result in one of the following to disable the requirement:
     * - "levelreq"
     * - "abilityreq"
     * - "featreq"
     * - "skillreq"
     * - "heritagereq"
     * - "complexreq"
     * - "dedicationlimit"
     */
    public ignoreRequirements: Array<FeatIgnoreRequirement> = [];
    public gainSpellBookSlots: Array<{ spellBookSlots: Array<number>; className: string }> = [];
    public skillreq: Array<FeatRequirements.SkillRequirement> = [];
    /**
     * complexreq can contain a list of various queries about the character state.
     * The rules of fulfilling these requirements are as follows:
     * - If any of the requirements in the array are true, the feat can be taken
     * - Within any requirement, the requirement is true if all given values are true
     * - If there is any situation where all of a set of requirements need to be true,
     * a requirement can use `allOf` to offer a sub-array of requirements.
     */
    public complexreq: Array<FeatRequirements.ComplexRequirement> = [];
    public abilityreq: Array<FeatRequirements.AbilityRequirement> = [];

    public effects: Array<EffectGain> = [];
    public changeProficiency: Array<ProficiencyChange> = [];
    public copyProficiency: Array<ProficiencyCopyGain> = [];
    public bloodMagic: Array<BloodMagic> = [];
    public gainAbilityChoice: Array<AbilityChoice> = [];
    public gainSpecialization: Array<SpecializationGain> = [];
    public gainConditions: Array<ConditionGain> = [];
    public gainFeatChoice: Array<FeatChoice> = [];
    public gainFormulaChoice: Array<FormulaChoice> = [];
    public gainHeritage: Array<HeritageGain> = [];
    public gainItems: Array<ItemGain> = [];
    public gainLanguages: Array<LanguageGain> = [];
    public gainLoreChoice: Array<LoreChoice> = [];
    public gainSkillChoice: Array<SkillChoice> = [];
    public gainSpellCasting: Array<SpellCasting> = [];
    public gainSpellChoice: Array<SpellChoice> = [];
    public hints: Array<Hint> = [];
    public onceEffects: Array<EffectGain> = [];
    public allowSignatureSpells: Array<SignatureSpellGain> = [];

    public static from(values: MaybeSerialized<Feat>, recastFns: RecastFns): Feat {
        return new Feat().with(values, recastFns);
    }

    public with(values: MaybeSerialized<Feat>, recastFns: RecastFns): this {
        assign(this, values, recastFns);

        this.gainHeritage.forEach(gainHeritage => {
            gainHeritage.source = this.name;
        });

        this.gainSpellChoice.forEach(choice => {
            if (!choice.source) {
                choice.source = `Feat: ${ this.name }`;
                choice.spells().forEach(gain => {
                    gain.source = choice.source;
                });
            }
        });

        return this;
    }

    public forExport(): Serialized<Feat> {
        return {
            ...forExport(this),
        };
    }

    public clone(recastFns: RecastFns): this {
        return Feat.from(this, recastFns) as this;
    }

    public isEqual(compared: Partial<Feat>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}
