/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { InputValidationService } from './inputValidation.service';

describe('Service: InputValidation', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InputValidationService]
    });
  });

  it('should ...', inject([InputValidationService], (service: InputValidationService) => {
    expect(service).toBeTruthy();
  }));
});
