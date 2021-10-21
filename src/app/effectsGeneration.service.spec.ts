/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { EffectsGenerationService } from './effectsGeneration.service';

describe('Service: EffectsGeneration', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EffectsGenerationService]
    });
  });

  it('should ...', inject([EffectsGenerationService], (service: EffectsGenerationService) => {
    expect(service).toBeTruthy();
  }));
});
