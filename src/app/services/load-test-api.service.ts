// src/app/services/load-test-api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoadTestConfiguration } from '../models/load-test.models';

@Injectable({
  providedIn: 'root'
})
export class LoadTestApiService {
  private readonly API_BASE_URL = 'http://localhost:8080/api/load-tests';

  constructor(private http: HttpClient) {}

  runLoadTest(config: LoadTestConfiguration): Observable<any> {
    console.log('📤 POST /run load test', config);
    return this.http.post(`${this.API_BASE_URL}/run`, config);
  }
}