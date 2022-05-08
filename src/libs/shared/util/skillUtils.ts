export function SkillLevelName(skillLevel: number, shortForm = false): string {
    if (shortForm) {
        return ['U', 'U', 'T', 'T', 'E', 'E', 'M', 'M', 'L'][skillLevel];
    } else {
        return ['Untrained', 'Untrained', 'Trained', 'Trained', 'Expert', 'Expert', 'Master', 'Master', 'Legendary'][skillLevel];
    }
}
