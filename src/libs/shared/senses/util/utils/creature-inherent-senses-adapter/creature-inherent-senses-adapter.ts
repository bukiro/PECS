import { Signal } from '@angular/core';

export abstract class CreatureInherentSensesAdapter {

    public abstract inherentSenses$$: Signal<Array<string>>;

}
