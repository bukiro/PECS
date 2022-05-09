import { SkillIncrease } from 'src/app/classes/SkillIncrease';

export class SkillChoice {
    public available = 0;
    public filter: Array<string> = [];
    public id = '';
    public increases: Array<SkillIncrease> = [];
    //If insertLevel is set, this SkillChoice is placed at the designated class level when granted by a feat.
    // I.e. if a feat contains a SkillChoice with insertLevel = 5, the choice is added to level 5 regardless of when the feat was taken.
    public insertLevel = 0;
    //If insertClass is set, this SkillChoice is only granted by a feat if the character class name matches this name.
    // This is especially useful for class choices (hunter's edge, rogue racket, bloodline etc.) that don't give certain benefits when multiclassing.
    public insertClass = '';
    //minRank: you may only increase skills that already have at least this level.
    // If a skill increase doesn't come from at least one choice with minRank == 0, it isn't counted at all.
    // This allows to upgrade, but not learn skills (like spell DCs for traditions you haven't chosen).
    public minRank = 0;
    //maxRank: the highest rank you are allowed to achieve with this choice.
    //This means that only skills are allowed which currently have maxRank-2 !
    public maxRank = 8;
    //If showOnSheet is set, this choice is intended to be made on the character sheet instead of while building the character.
    //  This is relevant for feats like Ancestral Longevity.
    public showOnSheet = false;
    public source = '';
    public type = '';
    public bonus = false;
    public recast(): SkillChoice {
        return this;
    }
}
