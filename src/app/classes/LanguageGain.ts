export class LanguageGain {
    public name = '';
    public source = '';
    public title = 'Granted language';
    public locked = false;
    public level = -1;

    public recast(): LanguageGain {
        return this;
    }

    public clone(): LanguageGain {
        return Object.assign<LanguageGain, LanguageGain>(new LanguageGain(), JSON.parse(JSON.stringify(this))).recast();
    }
}
