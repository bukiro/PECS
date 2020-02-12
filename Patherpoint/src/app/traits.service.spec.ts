/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { TraitsService } from './traits.service';

describe('Service: Traits', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TraitsService]
    });
  });

  it('should ...', inject([TraitsService], (service: TraitsService) => {
    expect(service).toBeTruthy();
  }));
});
