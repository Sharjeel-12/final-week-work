import { TestBed } from '@angular/core/testing';

import { FeeDataService } from './fee-data.service';

describe('FeeDataService', () => {
  let service: FeeDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FeeDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
