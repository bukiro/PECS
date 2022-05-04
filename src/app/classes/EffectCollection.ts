import { Effect } from 'src/app/classes/Effect';

export class EffectCollection {
    public all: Array<Effect> = [];
    public relatives: Array<Effect> = [];
    public absolutes: Array<Effect> = [];
    public bonuses: Array<Effect> = [];
    public penalties: Array<Effect> = [];
}
