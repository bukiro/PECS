/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { ExtensionsService } from './extensions.service';

describe('Service: Extensions', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ExtensionsService]
    });
  });

  it('should ...', inject([ExtensionsService], (service: ExtensionsService) => {
    expect(service).toBeTruthy();
  }));
});
