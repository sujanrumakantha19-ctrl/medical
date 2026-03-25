import { apiClient } from './api-client';
import type { ApiResponse } from '@/types';

export const helloService = {
  async getMessage(name?: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.get(`/api/hello${name ? `?name=${name}` : ''}`);
  },
};
