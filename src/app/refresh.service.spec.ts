/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { RefreshService } from './refresh.service';

describe('Service: Refresh', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RefreshService]
    });
  });

  it('should ...', inject([RefreshService], (service: RefreshService) => {
    expect(service).toBeTruthy();
  }));
});
