import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { InputValidationService } from 'src/app/services/inputValidation.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { CopperAmounts } from 'src/libs/shared/definitions/currency';
import { CopperAmountFromCashObject } from 'src/libs/shared/util/currencyUtils';

@Component({
    selector: 'app-cash',
    templateUrl: './cash.component.html',
    styleUrls: ['./cash.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})

//TO-DO: Probably needs change detection at the moment. See if it updates if you sell something from the inventory.
export class CashComponent {

    public cash = {
        platinum: 0,
        gold: 0,
        silver: 0,
        copper: 0,
    };

    constructor(
        private readonly _characterService: CharacterService,
        private readonly _refreshService: RefreshService,
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
        const character = this._characterService.character;
        const funds = CopperAmountFromCashObject(character.cash);

        return sum <= funds;
    }

    public isCashInvalid(): boolean {
        return this.cash.platinum < 0 || this.cash.gold < 0 || this.cash.silver < 0 || this.cash.copper < 0;
    }

    public addCash(multiplier = 1, sum = 0, changeafter = false): void {
        this._characterService.addCash(multiplier, sum, this.cash);

        if (changeafter) {
            this._refreshService.setComponentChanged('inventory');
        }
    }


}

