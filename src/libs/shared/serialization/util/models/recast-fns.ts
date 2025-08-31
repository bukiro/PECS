import { Activity } from 'src/libs/shared/activities/util/models/activity';
import { Item } from 'src/libs/shared/items/util/models/item';
import { ItemTypes } from 'src/libs/shared/items/util/models/item-types';
import { MaybeSerialized } from './serializable';
import { Feat } from 'src/libs/shared/feats/util/models/feat';
import { Signal } from '@angular/core';
import { Condition } from 'src/libs/shared/conditions/util/models/condition';
import { ActivityGain } from 'src/libs/shared/activities/util/models/activity-gain';
import { FeatGain } from 'src/libs/shared/feats/util/models/feat-gain';
import { ConditionGain } from 'src/libs/shared/conditions/util/models/condition-gain';
import { Ability } from 'src/libs/shared/abilities/util/models/ability';
import { Skill } from 'src/libs/shared/skills/util/models/skill';
import { AnimalCompanionStage } from 'src/libs/shared/animal-companion/util/models/animal-companion-stage';
import { Trait } from 'src/libs/shared/traits/util/models/trait';
import { Deity } from 'src/libs/shared/deities/util/models/deity';
import { Spell } from 'src/libs/shared/spells/util/models/spell';
import { ItemCollection } from 'src/libs/shared/items/util/models/item-collection';

export type ItemPrototypeFn = <T extends Item>(obj: MaybeSerialized<T>, options?: { type?: ItemTypes; prototype?: T }) => T;
export type CleanItemsFn = () => ItemCollection;
export type ActivityLookupFn = (gain: ActivityGain) => Signal<Activity>;
export type FeatLookupFn = (gain: FeatGain) => Signal<Feat>;
export type ConditionLookupFn = (gain: ConditionGain) => Signal<Condition>;
export type DeityLookupFn = (name: string) => Deity;
export type AbilityLookupFn = (name: string) => Ability;
export type SkillLookupFn = (name: string, customSkills?: Array<Skill>) => Skill;
export type SpellLookupFn = (name: string) => Spell;
export type TraitLookupFn = (name: string) => Trait;
export type AnimalCompanionStagesFn = () => Signal<Array<AnimalCompanionStage>>;

export interface RecastFns {
    getAbility: AbilityLookupFn;
    getAnimalCompanionStages: AnimalCompanionStagesFn;
    getDeity: DeityLookupFn;
    getItemPrototype: ItemPrototypeFn;
    getCleanItems: CleanItemsFn;
    getOriginalActivity$$: ActivityLookupFn;
    getOriginalFeat$$: FeatLookupFn;
    getOriginalCondition$$: ConditionLookupFn;
    getSkill: SkillLookupFn;
    getSpell: SpellLookupFn;
    getTrait: TraitLookupFn;
}
