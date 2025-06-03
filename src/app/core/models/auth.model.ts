export interface IAuthResponse {
    token_type: string;
    expires_in: number;
    access_token: string;
    refresh_token: string;
    roles: string;
    fecha_actual: string;
}