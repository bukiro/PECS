import { Rune } from './Rune';

export class ArmorRune extends Rune {
    //Armor Runes should be type "armorrunes" to be found in the database
    readonly type = "armorrunes";
    public resilient: number = 0;
}
