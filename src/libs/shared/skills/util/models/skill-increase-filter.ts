export interface SkillIncreaseFilter {
    name?: string;
    type?: string;
    source?: string;
    sourceId?: string;
    locked?: boolean;
    notSources?: Array<string>;
}
