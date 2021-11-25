/* tslint:disable:no-unused-variable */

import { TestBed, inject, waitForAsync } from '@angular/core/testing';
import { HistoryService } from 'src/app/services/history.service';

describe('Service: Ancestry', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HistoryService]
    });
  });

  it('should ...', inject([HistoryService], (service: HistoryService) => {
    expect(service).toBeTruthy();
  }));
});
