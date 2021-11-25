/* tslint:disable:no-unused-variable */

import { TestBed, inject, waitForAsync } from '@angular/core/testing';
import { DefenseService } from 'src/app/services/defense.service';

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
