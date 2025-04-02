import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  private URL = "http://localhost:4000/api/categories";

  constructor(public http: HttpClient) { }

  getAllCategories(): Observable<any> {
    return this.http
      .get<{ data: { categories: any } }>(`${this.URL}`)
      .pipe(map((response): any => response.data));
  }

}
