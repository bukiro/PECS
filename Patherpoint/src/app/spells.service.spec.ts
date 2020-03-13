/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { SpellsService } from './spells.service';

describe('Service: Spells', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SpellsService]
    });
  });

  it('should ...', inject([SpellsService], (service: SpellsService) => {
    expect(service).toBeTruthy();
  }));
});
