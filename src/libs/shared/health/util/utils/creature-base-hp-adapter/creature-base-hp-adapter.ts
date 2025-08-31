import { Signal } from '@angular/core';
import { ResultWithBonuses } from 'src/libs/shared/bonuses/util/models/result-with-bonuses';

export abstract class CreatureBaseHPAdapter {

    public abstract baseHP$$: Signal<ResultWithBonuses<number>>;

}
