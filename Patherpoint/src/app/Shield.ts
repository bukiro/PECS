import { Equipment } from './Equipment';

export class Shield extends Equipment {
    public readonly _className: string = this.constructor.name;
    //This is a list of all the attributes that should be saved if a refID exists. All others can be looked up via the refID when loading the character.
    public readonly save = new Equipment().save.concat([
        "raised",
        "takingCover",
        "currentHitpoints"
    ])
    //Shields should be type "shields" to be found in the database
    readonly type = "shields";
    //Shields are usually moddable as shield, which means they get material but no runes
    moddable = "shield" as ""|"-"|"weapon"|"armor"|"shield";
    //The shield's AC bonus received when raising it
    public acbonus: number = 0;
    //Is the shield currently raised in order to deflect damage?
    public raised: boolean = false;
    //The penalty to all speeds while equipping this shield
    public speedpenalty: number = 0;
    //Are you currently taking cover behind the shield?
    public takingCover: boolean = false;
    public get breakpoint() { return Math.max(1, Math.floor(this.hitpoints / 2)); };
    public brokenThreshold: number = 0;
    //The additional AC bonus received when taking cover behind the shield
    public coverbonus: number = 0;
    public currentHitpoints: number = 0;
    public hardness: number = 0;
    public hitpoints: number = 0;
    //What kind of shield is this based on?
    public shieldBase: string = "";
    
}