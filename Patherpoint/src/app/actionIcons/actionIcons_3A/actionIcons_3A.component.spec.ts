/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { ActionIcons_3AComponent } from './actionIcons_3A.component';

describe('ActionIcons_3AComponent', () => {
  let component: ActionIcons_3AComponent;
  let fixture: ComponentFixture<ActionIcons_3AComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ActionIcons_3AComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ActionIcons_3AComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
