import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/interfaces/api-response.interface';

export interface ChatResponse {
  text: string;
  saleData?: any;
}

@Injectable({ providedIn: 'root' })
export class ChatbotApiService {
  private baseUrl = `${environment.apiUrl}/chatbot`;
  constructor(private http: HttpClient) {}

  sendMessage(message: string): Observable<ApiResponse<ChatResponse>> {
    return this.http.post<ApiResponse<ChatResponse>>(this.baseUrl, { message });
  }
}
