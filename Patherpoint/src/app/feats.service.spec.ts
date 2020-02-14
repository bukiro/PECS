/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { FeatsService } from './feats.service';

describe('Service: Feats', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FeatsService]
    });
  });

  it('should ...', inject([FeatsService], (service: FeatsService) => {
    expect(service).toBeTruthy();
  }));
});
