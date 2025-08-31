export interface SkillIncrease {
    name: string;
    source: string;
    maxRank: number;
    locked: boolean;
    sourceId: string;
}

export function isEqualSkillIncrease(a: SkillIncrease, b: SkillIncrease): boolean {
    return (['name', 'source', 'maxRank', 'locked', 'sourceId'] satisfies Array<keyof SkillIncrease>)
        .every(key => a[key] === b[key]);
}
