export class BloodMagic {
    public condition = '';
    public duration = 10;
    public sourceTrigger: string[] = [];
    public trigger: string[] = [];
    public neutralPhrase = false;
    recast() {
        return this;
    }
}
