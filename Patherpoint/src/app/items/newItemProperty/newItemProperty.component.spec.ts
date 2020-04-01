/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { NewItemPropertyComponent } from './newItemProperty.component';

describe('NewItemPropertyComponent', () => {
  let component: NewItemPropertyComponent;
  let fixture: ComponentFixture<NewItemPropertyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewItemPropertyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewItemPropertyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
