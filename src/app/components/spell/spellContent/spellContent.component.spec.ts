/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { SpellContentComponent } from './spellContent.component';

describe('SpellContentComponent', () => {
  let component: SpellContentComponent;
  let fixture: ComponentFixture<SpellContentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SpellContentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SpellContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
