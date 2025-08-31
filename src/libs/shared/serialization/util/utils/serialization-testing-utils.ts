import { signal } from '@angular/core';
import { Ability } from 'src/libs/shared/abilities/util/models/ability';
import { Activity } from 'src/libs/shared/activities/util/models/activity';
import { AnimalCompanionStage } from 'src/libs/shared/animal-companion/util/models/animal-companion-stage';
import { Condition } from 'src/libs/shared/conditions/util/models/condition';
import { Deity } from 'src/libs/shared/deities/util/models/deity';
import { Feat } from 'src/libs/shared/feats/util/models/feat';
import { Item } from 'src/libs/shared/items/util/models/item';
import { ItemCollection } from 'src/libs/shared/items/util/models/item-collection';
import { Skill } from 'src/libs/shared/skills/util/models/skill';
import { Spell } from 'src/libs/shared/spells/util/models/spell';
import { Trait } from 'src/libs/shared/traits/util/models/trait';
import {
    AbilityLookupFn,
    AnimalCompanionStagesFn,
    DeityLookupFn,
    ItemPrototypeFn,
    CleanItemsFn,
    ActivityLookupFn,
    FeatLookupFn,
    ConditionLookupFn,
    SkillLookupFn,
    SpellLookupFn,
    TraitLookupFn,
    RecastFns,
} from '../models/recast-fns';
import { MaybeSerialized } from '../models/serializable';


// eslint-disable-next-line complexity
export const mockRecastFns = (
    {
        ability,
        activity,
        cleanItems,
        condition,
        deity,
        feat,
        item,
        skill,
        spell,
        stages,
        trait,
        getAbility,
        getAnimalCompanionStages,
        getDeity,
        getItemPrototype,
        getCleanItems,
        getOriginalActivity$$,
        getOriginalFeat$$,
        getOriginalCondition$$,
        getSkill,
        getSpell,
        getTrait,
    }: {
        getAbility?: AbilityLookupFn;
        getAnimalCompanionStages?: AnimalCompanionStagesFn;
        getDeity?: DeityLookupFn;
        getItemPrototype?: ItemPrototypeFn;
        getCleanItems?: CleanItemsFn;
        getOriginalActivity$$?: ActivityLookupFn;
        getOriginalFeat$$?: FeatLookupFn;
        getOriginalCondition$$?: ConditionLookupFn;
        getSkill?: SkillLookupFn;
        getSpell?: SpellLookupFn;
        getTrait?: TraitLookupFn;
        ability?: Ability;
        activity?: Activity;
        cleanItems?: ItemCollection;
        condition?: Condition;
        deity?: Deity;
        feat?: Feat;
        item?: Item;
        skill?: Skill;
        spell?: Spell;
        stages?: Array<AnimalCompanionStage>;
        trait?: Trait;
    } = {},
): RecastFns => ({
    getAbility: getAbility ?? (() => (ability ?? new Ability())),
    getAnimalCompanionStages: getAnimalCompanionStages ?? (() => signal(stages ?? []).asReadonly()),
    getCleanItems: getCleanItems ?? (() => cleanItems ?? new ItemCollection()),
    getDeity: getDeity ?? (() => (deity ?? new Deity())),
    getItemPrototype: getItemPrototype ?? (<T extends Item>(obj: MaybeSerialized<T>) => (obj ?? item) as T),
    getOriginalActivity$$: getOriginalActivity$$ ?? (() => signal(activity ?? new Activity()).asReadonly()),
    getOriginalFeat$$: getOriginalFeat$$ ?? (() => signal(feat ?? new Feat()).asReadonly()),
    getOriginalCondition$$: getOriginalCondition$$ ?? (() => signal(condition ?? new Condition()).asReadonly()),
    getSkill: getSkill ?? (() => (skill ?? new Skill())),
    getSpell: getSpell ?? (() => (spell ?? new Spell())),
    getTrait: getTrait ?? (() => (trait ?? new Trait())),
});
