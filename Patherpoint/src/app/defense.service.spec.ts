/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { DefenseService } from './defense.service';

describe('Service: Defense', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DefenseService]
    });
  });

  it('should ...', inject([DefenseService], (service: DefenseService) => {
    expect(service).toBeTruthy();
  }));
});
