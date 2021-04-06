/* tslint:disable:no-unused-variable */

import { TestBed, inject, waitForAsync } from '@angular/core/testing';
import { FamiliarsService } from './familiars.service';

describe('Service: Familiars', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FamiliarsService]
    });
  });

  it('should ...', inject([FamiliarsService], (service: FamiliarsService) => {
    expect(service).toBeTruthy();
  }));
});
