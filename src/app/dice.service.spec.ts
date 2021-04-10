/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { DiceService } from './dice.service';

describe('Service: Dice', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DiceService]
    });
  });

  it('should ...', inject([DiceService], (service: DiceService) => {
    expect(service).toBeTruthy();
  }));
});
