import { Injectable } from '@angular/core';
import {
    RecastFns,
    ItemPrototypeFn,
    ActivityLookupFn,
    FeatLookupFn,
    ConditionLookupFn,
    AbilityLookupFn,
    SkillLookupFn,
    AnimalCompanionStagesFn,
    TraitLookupFn,
    DeityLookupFn,
    SpellLookupFn,
    CleanItemsFn,
} from '../../util/models/recast-fns';
import { MaybeSerialized } from '../../util/models/serializable';
import { Item } from 'src/libs/shared/items/util/models/item';
import { ActivityGain } from 'src/libs/shared/activities/util/models/activity-gain';
import { FeatGain } from 'src/libs/shared/feats/util/models/feat-gain';
import { ConditionGain } from 'src/libs/shared/conditions/util/models/condition-gain';

@Injectable({
    providedIn: 'root',
})
export class RecastService {

    /**
     * A set of functions to restore unsaved content to certain objects after JSON conversion.
     * Use this set in recast functions if the data has been received from the API.
     */
    public static readonly restoreFns: RecastFns = {
        getAbility: name => {
            throw new Error(`[RecastService] restore functions not ready when looking up ${ name }`);
        },
        getAnimalCompanionStages: () => {
            throw new Error('[RecastService] restore functions not ready when looking up animal companion stages');
        },
        getCleanItems: () => {
            throw new Error('[RecastService] restore functions not ready when looking up clean items');
        },
        getDeity: name => {
            throw new Error(`[RecastService] restore functions not ready when looking up ${ name }`);
        },
        getItemPrototype: <T extends Item>(obj: MaybeSerialized<T>) => {
            throw new Error(`[RecastService] restore functions not ready when looking up ${ obj.name }`);
        },
        getOriginalActivity$$: (obj: ActivityGain) => {
            throw new Error(`[RecastService] restore functions not ready when looking up ${ obj.name }`);
        },
        getOriginalCondition$$: (obj: ConditionGain) => {
            throw new Error(`[RecastService] restore functions not ready when looking up ${ obj.name }`);
        },
        getOriginalFeat$$: (obj: FeatGain) => {
            throw new Error(`[RecastService] restore functions not ready when looking up ${ obj.name }`);
        },
        getSkill: name => {
            throw new Error(`[RecastService] restore functions not ready when looking up ${ name }`);
        },
        getSpell: name => {
            throw new Error(`[RecastService] restore functions not ready when looking up ${ name }`);
        },
        getTrait: name => {
            throw new Error(`[RecastService] restore functions not ready when looking up ${ name }`);
        },
    };

    /**
     * A set of functions that can be used as restoreFns but don't restore content.
     * Use this set in recast functions if the content is already there and just needs to be recast.
     */
    public static readonly recastFns: RecastFns = {
        getAbility: name => {
            throw new Error(`[RecastService] recast functions not ready when looking up ${ name }`);
        },
        getAnimalCompanionStages: () => {
            throw new Error('[RecastService] recast functions not ready when looking up animal companion stages');
        },
        getCleanItems: () => {
            throw new Error('[RecastService] recast functions not ready when looking up clean items');
        },
        getDeity: name => {
            throw new Error(`[RecastService] recast functions not ready when looking up ${ name }`);
        },
        getItemPrototype: <T extends Item>(obj: MaybeSerialized<T>) => {
            throw new Error(`[RecastService] recast functions not ready when looking up ${ obj.name }`);
        },
        getOriginalActivity$$: (obj: ActivityGain) => {
            throw new Error(`[RecastService] recast functions not ready when looking up ${ obj.name }`);
        },
        getOriginalCondition$$: (obj: ConditionGain) => {
            throw new Error(`[RecastService] recast functions not ready when looking up ${ obj.name }`);
        },
        getOriginalFeat$$: (obj: FeatGain) => {
            throw new Error(`[RecastService] recast functions not ready when looking up ${ obj.name }`);
        },
        getSkill: name => {
            throw new Error(`[RecastService] recast functions not ready when looking up ${ name }`);
        },
        getSpell: name => {
            throw new Error(`[RecastService] recast functions not ready when looking up ${ name }`);
        },
        getTrait: name => {
            throw new Error(`[RecastService] recast functions not ready when looking up ${ name }`);
        },
    };

    public registerAbilityLookupFns(abilityLookupFn: AbilityLookupFn): void {
        RecastService.restoreFns.getAbility = abilityLookupFn;
        RecastService.recastFns.getAbility = abilityLookupFn;
    }

    public registerActivityLookupFns(activityLookupFn: ActivityLookupFn): void {
        RecastService.restoreFns.getOriginalActivity$$ = activityLookupFn;
        RecastService.recastFns.getOriginalActivity$$ = activityLookupFn;
    }

    public registerAnimalCompanionStagesFns(stagesFn: AnimalCompanionStagesFn): void {
        RecastService.restoreFns.getAnimalCompanionStages = stagesFn;
        RecastService.recastFns.getAnimalCompanionStages = stagesFn;
    }

    public registerCleanItemsFns(cleanItemsFn: CleanItemsFn): void {
        RecastService.restoreFns.getCleanItems = cleanItemsFn;
        RecastService.recastFns.getCleanItems = cleanItemsFn;
    }

    public registerConditionLookupFns(conditionLookupFn: ConditionLookupFn): void {
        RecastService.restoreFns.getOriginalCondition$$ = conditionLookupFn;
        RecastService.recastFns.getOriginalCondition$$ = conditionLookupFn;
    }

    public registerDeityLookupFns(deityLookupFn: DeityLookupFn): void {
        RecastService.restoreFns.getDeity = deityLookupFn;
        RecastService.recastFns.getDeity = deityLookupFn;
    }

    public registerFeatLookupFns(featLookupFn: FeatLookupFn): void {
        RecastService.restoreFns.getOriginalFeat$$ = featLookupFn;
        RecastService.recastFns.getOriginalFeat$$ = featLookupFn;
    }

    public registerItemRecastFns(restoredPrototypeFn: ItemPrototypeFn, blankPrototypeFn: ItemPrototypeFn): void {
        RecastService.restoreFns.getItemPrototype = restoredPrototypeFn;
        RecastService.recastFns.getItemPrototype = blankPrototypeFn;
    }

    public registerSkillLookupFns(skillLookupFn: SkillLookupFn): void {
        RecastService.restoreFns.getSkill = skillLookupFn;
        RecastService.recastFns.getSkill = skillLookupFn;
    }

    public registerSpellLookupFns(spellLookupFn: SpellLookupFn): void {
        RecastService.restoreFns.getSpell = spellLookupFn;
        RecastService.recastFns.getSpell = spellLookupFn;
    }

    public registerTraitLookupFns(traitLookupFn: TraitLookupFn): void {
        RecastService.restoreFns.getTrait = traitLookupFn;
        RecastService.recastFns.getTrait = traitLookupFn;
    }

}
