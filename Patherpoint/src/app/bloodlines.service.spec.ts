/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { BloodlinesService } from './bloodlines.service';

describe('Service: Bloodlines', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BloodlinesService]
    });
  });

  it('should ...', inject([BloodlinesService], (service: BloodlinesService) => {
    expect(service).toBeTruthy();
  }));
});
