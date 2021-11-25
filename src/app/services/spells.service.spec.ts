/* tslint:disable:no-unused-variable */

import { TestBed, inject, waitForAsync } from '@angular/core/testing';
import { SpellsService } from 'src/app/services/spells.service';

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
