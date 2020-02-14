import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Feat } from './Feat';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FeatsService {
  private feats: Feat[]; 
  private loader; 
  private loading: boolean = false;
  
  constructor(
      private http: HttpClient,
  ) { }

  get_Feats(loreFeats: Feat[], name: string = "", type: string = "") {
      if (!this.still_loading()) {
          let feats: Feat[] = this.feats.concat(loreFeats);
          return feats.filter(feat => ((feat.name == name || name == "") && (feat.traits.indexOf(type) > -1 || type == "")));
      } else { return [new Feat()]; }
  }

  still_loading() {
      return (this.loading);
  }

  load_Skills(): Observable<String[]>{
      return this.http.get<String[]>('/assets/feats.json');
  }

  initialize() {
      if (!this.feats) {
      this.loading = true;
      this.load_Skills()
          .subscribe((results:String[]) => {
              this.loader = results;
              this.finish_loading()
          });
      }
  }

  finish_loading() {
      if (this.loader) {
          this.feats = this.loader.map(feat => Object.assign(new Feat(), feat));

          this.loader = [];
      }
      if (this.loading) {this.loading = false;}
  }
}
