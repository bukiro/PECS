import { Signal } from '@angular/core';
import { ResultWithBonuses } from 'src/libs/shared/bonuses/util/models/result-with-bonuses';
import { Speed } from '../../models/speed';

export abstract class CreatureBaseSpeedAdapter {

    public abstract inherentSpeeds$$: Signal<Array<Speed>>;

    public abstract baseSpeed$$(name: string): Signal<ResultWithBonuses<number>>;

}
