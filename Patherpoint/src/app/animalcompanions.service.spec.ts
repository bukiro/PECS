/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { AnimalCompanionsService } from './animalcompanions.service';

describe('Service: Animalcompanions', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AnimalCompanionsService]
    });
  });

  it('should ...', inject([AnimalCompanionsService], (service: AnimalCompanionsService) => {
    expect(service).toBeTruthy();
  }));
});
