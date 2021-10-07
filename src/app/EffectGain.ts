export class EffectGain {
        public affected: string = "";
    //Add this number to the target value.
    //Gets eval()-ed to determine the actual value.
    //Gets applied if parseInt(value) != 0
    public value: string = "0";
    //Set the target value to this number and ignore item, proficiency and untyped effects.
    //Gets eval()-ed to determine the actual value.
    //Gets applied if (setValue);
    //(eval(setValue) == null) will throw out the effect - this can be used for effects that only give a value under a certain condition.
    // Hint: "you gain an X Speed" effects do not stack and should use setValue.
    public setValue: string = "";
    //Set if the effect does not need a value, but still needs to be applied.
    //An effect that has a value and is toggle==true will be toggled only if the value is nonzero, and not keep its value.
    public toggle: boolean = false;
    //Effects will be shown if show = true, not shown if show = false, or otherwise shown if they match a certain list of effects that should always show.
    public show: boolean = undefined;
    public type: string = "";
    public duration: number = 0;
    public maxDuration: number = 0;
    //source and sourceId are copied from conditions and used to track temporary HP.
    public source: string = "";
    public sourceId: string = "";
    //spellSource is copied from conditions and used in value eval()s. Also only used to calculate temporary HP so far.
    public spellSource: string = "";
    //If the effect is typed, cumulative lists all effect sources (of the same type) that it is cumulative with.
    public cumulative: string[] = [];
    //A resonant effect only applies if the carrying item is slotted into a wayfinder.
    public resonant: boolean = false;
    //The title will be shown instead of the value if it is set. It can be calculated like the value, and use the value for its calculations, but should result in a string.
    public title: string = "";
    recast() {
        return this;
    }
}
