import axios, { AxiosInstance, AxiosResponse } from 'axios';

class API {
	private axiosInstance: AxiosInstance;

	constructor(baseURL: string) {
		this.axiosInstance = axios.create({
			baseURL,
			timeout: 5000,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}

	public async get<T>(url: string, params?: any): Promise<T> {
		const response: AxiosResponse<T> = await this.axiosInstance.get(url, { params });
		return response.data;
	}

	public async post<T>(url: string, data: any): Promise<T> {
		const response: AxiosResponse<T> = await this.axiosInstance.post(url, data);
		return response.data;
	}

	public async delete<T>(url: string): Promise<T> {
		const response: AxiosResponse<T> = await this.axiosInstance.delete(url);
		return response.data;
	}
}

export default API;
