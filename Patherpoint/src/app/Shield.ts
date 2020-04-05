import { Equipment } from './Equipment';

export class Shield extends Equipment {
    //Shields should be type "shields" to be found in the database
    readonly type = "shields";
    //Shields are usually moddable as shield, which means they get material but no runes
    moddable = "shield" as ""|"weapon"|"armor"|"shield";
    //The penalty to all speeds while equipping this shield
    public speedpenalty: number = 0;
    //The shield's AC bonus received when raising it
    public acbonus: number = 0;
    //Is the shield currently raised in order to deflect damage?
    public raised: boolean = false;
    //Are you currently taking cover behind the shield?
    public takingCover: boolean = false;
    //The additional AC bonus received when taking cover behind the shield
    public coverbonus: number = 0;
}