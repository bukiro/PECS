/* tslint:disable:no-unused-variable */

import { TestBed, inject, waitForAsync } from '@angular/core/testing';
import { DeitiesService } from 'src/app/services/deities.service';

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
