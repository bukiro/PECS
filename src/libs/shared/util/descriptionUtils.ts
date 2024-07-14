import { HeightenedDescriptionVariable } from 'src/app/classes/spells/heightened-description-variable';
import { HeightenedDescriptionVariableCollection } from 'src/app/classes/spells/heightened-description-variable-collection';

export function heightenedTextFromDescSets(text: string, levelNumber: number, descSets: Array<HeightenedDescriptionVariableCollection>): string {
    // For an arbitrary text (usually the condition description),
    // retrieve the appropriate description set for this level and replace the variables with the included strings.
    let heightenedTextResult = text;
    let foundDescSet: HeightenedDescriptionVariableCollection | undefined;

    if (descSets.length) {
        for (let levelNumberToTry = levelNumber; levelNumberToTry > 0; levelNumberToTry--) {
            foundDescSet = descSets.find(descSet => descSet.level === levelNumberToTry);

            if (foundDescSet) {
                break;
            }
        }
    }

    foundDescSet?.descs.forEach((descVar: HeightenedDescriptionVariable) => {
        const regex = new RegExp(descVar.variable, 'g');

        heightenedTextResult = heightenedTextResult.replace(regex, (descVar.value || ''));
    });

    return heightenedTextResult;
}
