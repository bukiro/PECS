/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { ActivitiesService } from './activities.service';

describe('Service: Activities', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ActivitiesService]
    });
  });

  it('should ...', inject([ActivitiesService], (service: ActivitiesService) => {
    expect(service).toBeTruthy();
  }));
});
