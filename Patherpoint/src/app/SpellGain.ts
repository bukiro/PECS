import { ItemGain } from './ItemGain';

export class SpellGain {
    public name: string;
    public level: number;
    public target: string;
    public source: string;
    public className: string;
    public tradition: string;
    public locked: boolean;
    public active: boolean = false;
    public gainItems: ItemGain[] = [];
    public sourceId: string;
}