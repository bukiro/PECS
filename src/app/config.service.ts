import { HttpClient, HttpHeaders, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ConfigService {

    public dbConnectionURL: string = "";
    private loading = false;

    constructor(
        private httpClient: HttpClient
    ) { }

    still_loading() {
        return this.loading;
    }

    initialize() {
        this.loading = true;

        let headers = new HttpHeaders().set('Cache-Control','no-cache').set('Pragma','no-cache');

        this.httpClient.request(new HttpRequest("HEAD", 'assets/config.json', headers))
            .toPromise()
            .then((response: HttpResponse<unknown>) => {
                if (response.status == 200) {
                    this.httpClient.get('assets/config.json', { headers } )
                        .toPromise()
                        .then(data => {
                            let config = JSON.parse(JSON.stringify(data));
                            this.dbConnectionURL = config.dbConnectionURL || ""
                        }).catch(err => {
                            throw err;
                        }).finally(() => {
                            this.loading = false;
                        })
                } else {
                    
                }
            }).catch(err => {
                if (err.status == 404) {
                    console.log("No config file was found. See assets/config.json.example for more information.")
                } else {
                    throw err;
                }
                this.loading = false;
            })
    }

}
