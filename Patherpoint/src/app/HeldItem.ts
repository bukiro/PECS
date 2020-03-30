import { Equipment } from './Equipment';

export class HeldItem extends Equipment {
    //Held Items should be type "helditems" to be found in the database
    public type: string = "helditems";
}