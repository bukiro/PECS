/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { DeitiesService } from './deities.service';

describe('Service: Deities', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DeitiesService]
    });
  });

  it('should ...', inject([DeitiesService], (service: DeitiesService) => {
    expect(service).toBeTruthy();
  }));
});
