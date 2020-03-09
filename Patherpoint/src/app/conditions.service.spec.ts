/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { ConditionsService } from './conditions.service';

describe('Service: Conditions', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ConditionsService]
    });
  });

  it('should ...', inject([ConditionsService], (service: ConditionsService) => {
    expect(service).toBeTruthy();
  }));
});
