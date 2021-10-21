/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { CustomEffectsService } from './customEffects.service';

describe('Service: CustomEffects', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CustomEffectsService]
    });
  });

  it('should ...', inject([CustomEffectsService], (service: CustomEffectsService) => {
    expect(service).toBeTruthy();
  }));
});
