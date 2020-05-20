/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { ActionIcons_2AComponent } from './actionIcons_2A.component';

describe('ActionIcons_2AComponent', () => {
  let component: ActionIcons_2AComponent;
  let fixture: ComponentFixture<ActionIcons_2AComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ActionIcons_2AComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ActionIcons_2AComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
