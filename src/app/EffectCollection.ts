import { Effect } from './Effect';

export class EffectCollection {
    public all: Effect[] = [];
    public relatives: Effect[] = [];
    public absolutes: Effect[] = [];
    public bonuses: Effect[] = [];
    public penalties: Effect[] = [];
}