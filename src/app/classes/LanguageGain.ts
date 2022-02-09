export class LanguageGain {
    public name: string = "";
    public source: string = "";
    public title: string = "Granted language";
    public locked: boolean = false;
    public level: number = -1;
    recast() {
        return this;
    }
}
