import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HotelPage } from './hotel.page';

describe('HotelPage', () => {
  let component: HotelPage;
  let fixture: ComponentFixture<HotelPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HotelPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
