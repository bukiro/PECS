import { EffectGain } from 'src/app/classes/EffectGain';
import { HeightenedDescSet } from 'src/app/classes/HeightenedDescSet';
import { heightenedTextFromDescSets } from 'src/libs/shared/util/descriptionUtils';

export class Hint {
    //We want the active hints to be reset when loading characters. Everything listed in neversave gets deleted during saving.
    public readonly neversave: Array<string> = [
        'active',
        'active2',
        'active3',
        'active4',
        'active5',
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
    /**
     * If extraActivations is 1 through 4, up to four more activation boxes are shown.
     * Their state can be accessed in effect calculations with object.active2 through object.active5.
     */
    public extraActivations = 0;
    /** If conditionChoiceFilter is set, only show this hint if the condition that the hint comes from has a matching choice active. */
    public conditionChoiceFilter: Array<string> = [];
    /** On an aeon stone, hints can be resonant powers. These only get shown if the aeon stone is slotted in a wayfinder. */
    public resonant = false;
    /** Replace the object that is loaded when more information is shown. Does not replace the title. */
    public replaceSource: Array<{ source: string; type: 'feat' }> = [];
    /** Replace the title of the hint. */
    public replaceTitle = '';
    public displayOnly = false;
    public get anyActive(): boolean {
        return this.active || this.active2 || this.active3 || this.active4 || this.active5;
    }
    public recast(): Hint {
        this.heightenedDescs = this.heightenedDescs.map(obj => Object.assign(new HeightenedDescSet(), obj).recast());
        this.effects = this.effects.map(obj => Object.assign(new EffectGain(), obj).recast());

        return this;
    }
    public deactivateAll(): void {
        this.active = this.active2 = this.active3 = this.active4 = this.active5 = false;
    }
    public heightenedText(text: string, levelNumber: number): string {
        return heightenedTextFromDescSets(text, levelNumber, this.heightenedDescs);
    }
}
