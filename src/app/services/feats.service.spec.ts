/* tslint:disable:no-unused-variable */

import { TestBed, inject, waitForAsync } from '@angular/core/testing';
import { FeatsService } from 'src/app/services/feats.service';

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
