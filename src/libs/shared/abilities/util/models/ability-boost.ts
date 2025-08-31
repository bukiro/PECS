export interface AbilityBoost {
    name: string;
    type: 'Boost' | 'Flaw' | 'Info';
    source: string;
    locked: boolean;
    sourceId: string;
}

export function isEqualAbilityBoost(a: AbilityBoost, b: AbilityBoost): boolean {
    return (['name', 'type', 'source', 'locked', 'sourceId'] satisfies Array<keyof AbilityBoost>)
        .every(key => a[key] === b[key]);
}
