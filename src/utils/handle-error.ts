import { AxiosError } from 'axios';
import type { ApiError } from '../types/api';

/**
 * Extrai a mensagem de erro de uma requisição Axios ou retorna um fallback.
 * Isso evita repetir o cast de 'unknown' em toda tela.
 */
export function getErrorMessage(err: unknown): string {
  const axiosError = err as AxiosError<ApiError>;
  
  return axiosError.response?.data?.message 
    || (err instanceof Error ? err.message : 'Erro inesperado no servidor.');
}