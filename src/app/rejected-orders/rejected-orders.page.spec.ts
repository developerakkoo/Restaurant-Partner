import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RejectedOrdersPage } from './rejected-orders.page';

describe('RejectedOrdersPage', () => {
  let component: RejectedOrdersPage;
  let fixture: ComponentFixture<RejectedOrdersPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RejectedOrdersPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
