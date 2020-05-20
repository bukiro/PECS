/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { ActionIcons_FreeComponent } from './actionIcons_Free.component';

describe('ActionIcons_FreeComponent', () => {
  let component: ActionIcons_FreeComponent;
  let fixture: ComponentFixture<ActionIcons_FreeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ActionIcons_FreeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ActionIcons_FreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
