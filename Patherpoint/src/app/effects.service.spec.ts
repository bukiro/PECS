/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { EffectsService } from './effects.service';

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
