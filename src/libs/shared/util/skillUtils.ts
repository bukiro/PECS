export function skillLevelName(skillLevel: number, options: { shortForm?: boolean } = {}): string {
    if (options.shortForm) {
        return ['U', 'U', 'T', 'T', 'E', 'E', 'M', 'M', 'L'][skillLevel];
    } else {
        return ['Untrained', 'Untrained', 'Trained', 'Trained', 'Expert', 'Expert', 'Master', 'Master', 'Legendary'][skillLevel];
    }
}
