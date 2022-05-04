import { EffectGain } from 'src/app/classes/EffectGain';
import { HeightenedDesc } from 'src/app/classes/HeightenedDesc';
import { HeightenedDescSet } from 'src/app/classes/HeightenedDescSet';

export class Hint {
    //We want the active hints to be reset when loading characters. Everything listed in neversave gets deleted during saving.
    public readonly neversave: Array<string> = [
        'active',
        'active2',
        'active3',
        'active4',
        'active5'
    ];
    public desc = '';
    public minLevel = 0;
    public heightenedDescs: Array<HeightenedDescSet> = [];
    public showon = '';
    public effects: Array<EffectGain> = [];
    public active = false;
    public active2 = false;
    public active3 = false;
    public active4 = false;
    public active5 = false;
    //If extraActivations is 1 through 4, up to four more activation boxes are shown.
    // Their state can be accessed in effect calculations with object.active2 through object.active5.
    public extraActivations = 0;
    //If conditionChoiceFilter is set, only show this hint if the condition that the hint comes from has a matching choice active.
    public conditionChoiceFilter: Array<string> = [];
    //On an aeon stone, hints can be resonant powers. These only get shown if the aeon stone is slotted in a wayfinder.
    public resonant = false;
    //Replace the object that is loaded when more information is shown. Does not replace the title.
    public replaceSource: Array<{ source: string; type: 'feat' }> = [];
    //Replace the title of the hint.
    public replaceTitle = '';
    public displayOnly = false;
    recast() {
        this.heightenedDescs = this.heightenedDescs.map(obj => Object.assign(new HeightenedDescSet(), obj).recast());
        this.effects = this.effects.map(obj => Object.assign(new EffectGain(), obj).recast());
        return this;
    }
    get_DescriptionSet(levelNumber: number) {
        //This descends from levelnumber downwards and returns the first description set with a matching level.
        //A description set contains variable names and the text to replace them with.
        if (this.heightenedDescs.length) {
            let remainingLevelNumber = levelNumber;
            for (remainingLevelNumber; remainingLevelNumber > 0; remainingLevelNumber--) {
                if (this.heightenedDescs.some(descSet => descSet.level == remainingLevelNumber)) {
                    return this.heightenedDescs.find(descSet => descSet.level == remainingLevelNumber);
                }
            }
        }
        return new HeightenedDescSet();
    }
    get_Heightened(text: string, levelNumber: number) {
        //For an arbitrary text (usually the spell description or the saving throw result descriptions), retrieve the appropriate description set for this level and replace the variables with the included strings.
        let heightenedText = text;
        this.get_DescriptionSet(levelNumber).descs.forEach((descVar: HeightenedDesc) => {
            const regex = new RegExp(descVar.variable, 'g');
            heightenedText = heightenedText.replace(regex, (descVar.value || ''));
        });
        return heightenedText;
    }
}
