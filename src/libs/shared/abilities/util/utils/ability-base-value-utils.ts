export const abilityModFromAbilityValue = (abilityValue: number): number => {
    /**
     * Calculates the ability modifier from the effective ability in the usual d20 fashion:
     * 0-1 => -5;
     * 2-3 => -4;
     * ...
     * 10-11 => 0;
     * 12-13 => 1;
     * ...
     * 20-21 => 5
     * etc.
     */
    const baseline = 10;
    const half = 0.5;

    return Math.floor((abilityValue - baseline) * half);
};
