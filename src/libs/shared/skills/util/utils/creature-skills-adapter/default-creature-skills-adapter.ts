import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { AnimalCompanion } from 'src/libs/shared/creatures/util/models/animal-companion';
import { Character } from 'src/libs/shared/character/util/models/character';
import { CreatureSkillIncreasesAdapter } from '../creature-skill-increases-adapter/creature-skill-increases-adapter';
import { CreatureSkillChoicesAdapter } from '../creature-skill-choices-adapter/creature-skill-choices-adapter';
import { CreatureSkillsAdapter } from './creature-skills-adapter';
import { CharacterSkillChoicesAdapter } from '../creature-skill-choices-adapter/character-skill-choices-adapter';
import { AnimalCompanionSkillChoicesAdapter } from '../creature-skill-choices-adapter/animal-companion-skill-choices-adapter';
import { CreatureSkillCommonAdapter } from '../creature-skill-common-adapter/creature-skill-common-adapter';
import { CreatureSkillLevelAdapter } from '../creature-skill-level-adapter/creature-skill-level-adapter';
import { CreatureSkillValueAdapter } from '../creature-skill-value-adapter/creature-skill-value-adapter';
import { CreatureSkillLegalityAdapter } from '../creature-skill-legality-adapter/creature-skill-legality-adapter';
import { DefaultCreatureSkillLevelAdapter } from '../creature-skill-level-adapter/default-creature-skill-level-adapter';
import { DefaultCreatureSkillValueAdapter } from '../creature-skill-value-adapter/default-creature-skill-value-adapter';

export class DefaultCreatureSkillsAdapter implements CreatureSkillsAdapter {

    public readonly skillChoices$$;
    public readonly skillIncreases$$;
    public readonly allTrainedSkillNames$$;
    public readonly skillLevel$$;
    public readonly skillValue$$;
    public readonly canIncreaseSkill$$;
    public readonly isSkillLegal$$;

    private readonly _choicesAdapter: CreatureSkillChoicesAdapter;
    private readonly _increasesAdapter: CreatureSkillIncreasesAdapter;
    private readonly _commonAdapter: CreatureSkillCommonAdapter;
    private readonly _legalityAdapter: CreatureSkillLegalityAdapter;
    private readonly _levelAdapter: CreatureSkillLevelAdapter;
    private readonly _valueAdapter: CreatureSkillValueAdapter;

    constructor(
        creature: Character | AnimalCompanion,
        recastFns: RecastFns,
    ) {
        if (creature.isCharacter()) {
            this._choicesAdapter = new CharacterSkillChoicesAdapter(creature);
        } else {
            this._choicesAdapter = new AnimalCompanionSkillChoicesAdapter(creature);
        }

        this._commonAdapter = new CreatureSkillCommonAdapter(creature, recastFns);
        this._increasesAdapter = new CreatureSkillIncreasesAdapter(this._choicesAdapter);
        this._levelAdapter = new DefaultCreatureSkillLevelAdapter(creature, this._commonAdapter, this._increasesAdapter);
        this._legalityAdapter = new CreatureSkillLegalityAdapter(this._commonAdapter, this._levelAdapter, this._increasesAdapter);
        this._valueAdapter = new DefaultCreatureSkillValueAdapter(creature, this._commonAdapter, this._levelAdapter);

        this.skillChoices$$ = this._choicesAdapter.skillChoices$$;
        this.skillIncreases$$ = this._increasesAdapter.skillIncreases$$;
        this.allTrainedSkillNames$$ = this._increasesAdapter.allTrainedSkillNames$$;
        this.skillLevel$$ = this._levelAdapter.level$$;
        this.skillValue$$ = this._valueAdapter.value$$;
        this.canIncreaseSkill$$ = this._legalityAdapter.canIncreaseSkill$$;
        this.isSkillLegal$$ = this._legalityAdapter.isSkillLegal$$;
    }

}
