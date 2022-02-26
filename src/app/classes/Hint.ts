import { EffectGain } from 'src/app/classes/EffectGain';
import { HeightenedDesc } from 'src/app/classes/HeightenedDesc';
import { HeightenedDescSet } from 'src/app/classes/HeightenedDescSet';

export class Hint {
        //We want the active hints to be reset when loading characters. Everything listed in neversave gets deleted during saving.
    public readonly neversave: string[] = [
        "active",
        "active2",
        "active3",
        "active4",
        "active5"
    ];
    public desc: string = "";
    public minLevel: number = 0;
    public heightenedDescs: HeightenedDescSet[] = [];
    public showon: string = "";
    public effects: EffectGain[] = [];
    public active: boolean = false;
    public active2: boolean = false;
    public active3: boolean = false;
    public active4: boolean = false;
    public active5: boolean = false;
    //If extraActivations is 1 through 4, one or two more activation boxes are shown.
    public extraActivations: number = 0;
    //If conditionChoiceFilter is set, only show this hint if the condition that the hint comes from has a matching choice active.
    public conditionChoiceFilter: string[] = [];
    //On an aeon stone, hints can be resonant powers. These only get shown if the aeon stone is slotted in a wayfinder.
    public resonant: boolean = false;
    //Replace the object that is loaded when more information is shown. Does not replace the title.
    public replaceSource: { source: string, type: "feat" }[] = [];
    //Replace the title of the hint.
    public replaceTitle: string = "";
    public displayOnly: boolean = false;
    recast() {
        this.heightenedDescs = this.heightenedDescs.map(obj => Object.assign(new HeightenedDescSet(), obj).recast());
        this.effects = this.effects.map(obj => Object.assign(new EffectGain(), obj).recast());
        return this;
    }
    get_DescriptionSet(levelNumber: number) {
        //This descends from levelnumber downwards and returns the first description set with a matching level.
        //A description set contains variable names and the text to replace them with.
        if (this.heightenedDescs.length) {
            for (levelNumber; levelNumber > 0; levelNumber--) {
                if (this.heightenedDescs.some(descSet => descSet.level == levelNumber)) {
                    return this.heightenedDescs.find(descSet => descSet.level == levelNumber);
                }
            }
        }
        return new HeightenedDescSet();
    }
    get_Heightened(text: string, levelNumber: number) {
        //For an arbitrary text (usually the spell description or the saving throw result descriptions), retrieve the appropriate description set for this level and replace the variables with the included strings.
        this.get_DescriptionSet(levelNumber).descs.forEach((descVar: HeightenedDesc) => {
            let regex = new RegExp(descVar.variable, "g")
            text = text.replace(regex, (descVar.value || ""));
        })
        return text;
    }
}