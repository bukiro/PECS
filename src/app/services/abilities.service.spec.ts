/* tslint:disable:no-unused-variable */

import { TestBed, inject, waitForAsync } from '@angular/core/testing';
import { AbilitiesService } from 'src/app/services/abilities.service';

describe('Service: Abilities', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AbilitiesService]
    });
  });

  it('should ...', inject([AbilitiesService], (service: AbilitiesService) => {
    expect(service).toBeTruthy();
  }));
});
