import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisitsCalendar } from './visits-calendar';

describe('VisitsCalendar', () => {
  let component: VisitsCalendar;
  let fixture: ComponentFixture<VisitsCalendar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitsCalendar],
    }).compileComponents();

    fixture = TestBed.createComponent(VisitsCalendar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
