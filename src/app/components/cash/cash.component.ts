import { ChangeDetectionStrategy, Component } from '@angular/core';
import { InputValidationService } from 'src/libs/shared/input-validation/input-validation.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { CopperAmounts } from 'src/libs/shared/definitions/currency';
import { CurrencyService } from 'src/libs/shared/services/currency/currency.service';

@Component({
    selector: 'app-cash',
    templateUrl: './cash.component.html',
    styleUrls: ['./cash.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})

export class CashComponent {

    public cash = {
        platinum: 0,
        gold: 0,
        silver: 0,
        copper: 0,
    };

    constructor(
        private readonly _refreshService: RefreshService,
        private readonly _currencyService: CurrencyService,
    ) { }

    public positiveNumbersOnly(event: KeyboardEvent): boolean {
        return InputValidationService.positiveNumbersOnly(event);
    }

    public hasFunds(sum = (
        (this.cash.platinum * CopperAmounts.CopperInPlatinum)
        + (this.cash.gold * CopperAmounts.CopperInGold)
        + (this.cash.silver * CopperAmounts.CopperInSilver)
        + (this.cash.copper)
    )): boolean {
        return this._currencyService.hasFunds(sum);
    }

    public isCashInvalid(): boolean {
        return this.cash.platinum < 0 || this.cash.gold < 0 || this.cash.silver < 0 || this.cash.copper < 0;
    }

    public addCash(multiplier: 1 | -1 = 1): void {
        this._currencyService.addCash(multiplier, 0, this.cash);
        this._refreshService.processPreparedChanges();
    }


}

