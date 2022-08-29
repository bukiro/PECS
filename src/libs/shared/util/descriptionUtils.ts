import { HeightenedDesc } from 'src/app/classes/HeightenedDesc';
import { HeightenedDescSet } from 'src/app/classes/HeightenedDescSet';

export function heightenedTextFromDescSets(text: string, levelNumber: number, descSets: Array<HeightenedDescSet>): string {
    // For an arbitrary text (usually the condition description),
    // retrieve the appropriate description set for this level and replace the variables with the included strings.
    let heightenedTextResult = text;
    let foundDescSet: HeightenedDescSet | undefined;

    if (descSets.length) {
        for (let levelNumberToTry = levelNumber; levelNumberToTry > 0; levelNumberToTry--) {
            foundDescSet = descSets.find(descSet => descSet.level === levelNumberToTry);

            if (foundDescSet) {
                break;
            }
        }
    }

    foundDescSet?.descs.forEach((descVar: HeightenedDesc) => {
        const regex = new RegExp(descVar.variable, 'g');

        heightenedTextResult = heightenedTextResult.replace(regex, (descVar.value || ''));
    });

    return heightenedTextResult;
}
