import { TestBed } from '@angular/core/testing';

import { VisitDataService } from './visits-data.service';

describe('VisitsDataService', () => {
  let service: VisitDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VisitDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
