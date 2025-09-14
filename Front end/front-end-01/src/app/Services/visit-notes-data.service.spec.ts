import { TestBed } from '@angular/core/testing';

import { VisitNotesDataService } from './visit-notes-data.service';

describe('VisitNotesDataService', () => {
  let service: VisitNotesDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VisitNotesDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
