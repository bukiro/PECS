export class BloodMagic {
    public condition = '';
    public duration = 10;
    public sourceTrigger: Array<string> = [];
    public trigger: Array<string> = [];
    public neutralPhrase = false;
    recast() {
        return this;
    }
}
