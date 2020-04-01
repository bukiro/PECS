import { Activity } from './Activity';

//ItemActivity combines Activity and ActivityGain, so that an item can have its own contained activity.
export class ItemActivity extends Activity {
    public source: string = "";
    public active: boolean = false;
    public activeCooldown: number = 0;
}