export class EffectGain {
    public readonly _className: string = this.constructor.name;
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
    public toggle: boolean = false;
    public type: string = "";
    public duration: number = 0;
}
