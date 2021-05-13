/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { IntegrationsService } from './integrations.service';

describe('Service: Integration', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [IntegrationsService]
    });
  });

  it('should ...', inject([IntegrationsService], (service: IntegrationsService) => {
    expect(service).toBeTruthy();
  }));
});
