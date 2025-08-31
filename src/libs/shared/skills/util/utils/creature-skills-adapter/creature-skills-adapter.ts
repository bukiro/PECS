import { CreatureSkillChoicesAdapter } from '../creature-skill-choices-adapter/creature-skill-choices-adapter';
import { CreatureSkillIncreasesAdapter } from '../creature-skill-increases-adapter/creature-skill-increases-adapter';
import { CreatureSkillLegalityAdapter } from '../creature-skill-legality-adapter/creature-skill-legality-adapter';
import { CreatureSkillLevelAdapter } from '../creature-skill-level-adapter/creature-skill-level-adapter';
import { CreatureSkillValueAdapter } from '../creature-skill-value-adapter/creature-skill-value-adapter';

export abstract class CreatureSkillsAdapter {

    public abstract readonly skillChoices$$: typeof CreatureSkillChoicesAdapter.prototype.skillChoices$$;
    public abstract readonly skillIncreases$$: typeof CreatureSkillIncreasesAdapter.prototype.skillIncreases$$;
    public abstract readonly allTrainedSkillNames$$: typeof CreatureSkillIncreasesAdapter.prototype.allTrainedSkillNames$$;
    public abstract readonly skillLevel$$: typeof CreatureSkillLevelAdapter.prototype.level$$;
    public abstract readonly skillValue$$: typeof CreatureSkillValueAdapter.prototype.value$$;
    public abstract readonly canIncreaseSkill$$: typeof CreatureSkillLegalityAdapter.prototype.canIncreaseSkill$$;
    public abstract readonly isSkillLegal$$: typeof CreatureSkillLegalityAdapter.prototype.isSkillLegal$$;

}
