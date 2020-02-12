/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AttacksComponent } from './attacks.component';

describe('AttacksComponent', () => {
  let component: AttacksComponent;
  let fixture: ComponentFixture<AttacksComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AttacksComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AttacksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
