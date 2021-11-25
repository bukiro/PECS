/* tslint:disable:no-unused-variable */

import { TestBed, inject, waitForAsync } from '@angular/core/testing';
import { AnimalCompanionsService } from 'src/app/services/animalcompanions.service';

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
