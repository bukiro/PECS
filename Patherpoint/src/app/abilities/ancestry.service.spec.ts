/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { AncestryService } from './ancestry.service';

describe('Service: Ancestry', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AncestryService]
    });
  });

  it('should ...', inject([AncestryService], (service: AncestryService) => {
    expect(service).toBeTruthy();
  }));
});
