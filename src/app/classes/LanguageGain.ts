export class LanguageGain {
    public name = '';
    public source = '';
    public title = 'Granted language';
    public locked = false;
    public level = -1;
    public recast(): LanguageGain {
        return this;
    }
}
