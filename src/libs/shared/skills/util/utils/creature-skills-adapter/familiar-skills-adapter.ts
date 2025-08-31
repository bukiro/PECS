import { signal, Signal } from '@angular/core';
import { SkillChoice } from '../../models/skill-choice';
import { SkillIncrease } from '../../models/skill-increase';
import { CreatureSkillsAdapter } from './creature-skills-adapter';
import { Character } from 'src/libs/shared/character/util/models/character';
import { Familiar } from 'src/libs/shared/creatures/util/models/familiar';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { FamiliarSkillLevelAdapter } from '../creature-skill-level-adapter/familiar-skill-level-adapter';
import { CreatureSkillCommonAdapter } from '../creature-skill-common-adapter/creature-skill-common-adapter';
import { FamiliarSkillValueAdapter } from '../creature-skill-value-adapter/familiar-skill-value-adapter';
import { CreatureSkillLevelAdapter } from '../creature-skill-level-adapter/creature-skill-level-adapter';
import { CreatureSkillValueAdapter } from '../creature-skill-value-adapter/creature-skill-value-adapter';

const zeroArray$$ = signal([]).asReadonly();
const falseSignal$$ = signal(false).asReadonly();
const trueSignal$$ = signal(true).asReadonly();

export class FamiliarSkillsAdapter implements CreatureSkillsAdapter {

    public readonly skillLevel$$;
    public readonly skillValue$$;

    private readonly _commonAdapter: CreatureSkillCommonAdapter;
    private readonly _levelAdapter: CreatureSkillLevelAdapter;
    private readonly _valueAdapter: CreatureSkillValueAdapter;

    constructor(
        familiar: Familiar,
        character: Character,
        recastFns: RecastFns,
    ) {
        this._commonAdapter = new CreatureSkillCommonAdapter(familiar, recastFns);
        this._levelAdapter = new FamiliarSkillLevelAdapter();
        this._valueAdapter = new FamiliarSkillValueAdapter(familiar, character, this._commonAdapter, this._levelAdapter);

        this.skillLevel$$ = this._levelAdapter.level$$;
        this.skillValue$$ = this._valueAdapter.value$$;
    }

    public skillChoices$$(): Signal<Array<SkillChoice>> {
        return zeroArray$$;
    }

    public skillIncreases$$(): Signal<Array<SkillIncrease>> {
        return zeroArray$$;
    }

    public allTrainedSkillNames$$(): Signal<Array<string>> {
        return zeroArray$$;
    }

    public canIncreaseSkill$$(): Signal<boolean> {
        return falseSignal$$;
    }

    public isSkillLegal$$(): Signal<boolean> {
        return trueSignal$$;
    }

}
