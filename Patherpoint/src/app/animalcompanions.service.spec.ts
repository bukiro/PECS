/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { AnimalcompanionsService } from './animalcompanions.service';

describe('Service: Animalcompanions', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AnimalcompanionsService]
    });
  });

  it('should ...', inject([AnimalcompanionsService], (service: AnimalcompanionsService) => {
    expect(service).toBeTruthy();
  }));
});
