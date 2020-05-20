/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { ActionIconsComponent } from './actionIcons.component';

describe('ActionIconsComponent', () => {
  let component: ActionIconsComponent;
  let fixture: ComponentFixture<ActionIconsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ActionIconsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ActionIconsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
