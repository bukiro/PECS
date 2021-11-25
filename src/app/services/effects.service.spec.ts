/* tslint:disable:no-unused-variable */

import { TestBed, inject, waitForAsync } from '@angular/core/testing';
import { EffectsService } from 'src/app/services/effects.service';

describe('Service: Effects', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EffectsService]
    });
  });

  it('should ...', inject([EffectsService], (service: EffectsService) => {
    expect(service).toBeTruthy();
  }));
});
