import {
	CredentialTemplate,
	CreateTemplateRequest,
	UpdateTemplateRequest,
	ListTemplatesResponse,
	ValidationResponse,
	TemplateUsageStats,
	ValidateSchemaRequest,
	ValidateCredentialDataRequest,
	TemplateExportResponse,
	TemplateImportRequest,
	TemplateVersionsResponse,
	TemplateFilters
} from '@/types/template';
import apiClient from '@/lib/apiClient';

const API_BASE_URL = '/api/v1/credentials/templates';

class TemplateService {
	// Template CRUD Operations
	async createTemplate(request: CreateTemplateRequest): Promise<CredentialTemplate> {
		const response = await apiClient.post<CredentialTemplate>(API_BASE_URL, request);
		return response.data;
	}

	async getTemplate(id: string): Promise<CredentialTemplate> {
		const response = await apiClient.get<CredentialTemplate>(`${API_BASE_URL}/${id}`);
		return response.data;
	}

	async listTemplates(filters?: TemplateFilters): Promise<ListTemplatesResponse> {
		const params = new URLSearchParams();

		if (filters) {
			if (filters.page) params.append('page', filters.page.toString());
			if (filters.limit) params.append('limit', filters.limit.toString());
			if (filters.search) params.append('search', filters.search);
			if (filters.type) params.append('type', filters.type);
			if (filters.userID) params.append('userID', filters.userID);
			if (filters.issuerDID) params.append('issuerDID', filters.issuerDID);
			if (filters.active !== undefined) params.append('active', filters.active.toString());
			if (filters.tags && filters.tags.length > 0) params.append('tags', filters.tags.join(','));
			if (filters.category) params.append('category', filters.category);
			if (filters.version) params.append('version', filters.version);
		}

		const url = params.toString() ? `${API_BASE_URL}?${params}` : API_BASE_URL;
		const response = await apiClient.get<ListTemplatesResponse>(url);
		return response.data;
	}

	async updateTemplate(id: string, request: UpdateTemplateRequest): Promise<CredentialTemplate> {
		const response = await apiClient.put<CredentialTemplate>(`${API_BASE_URL}/${id}`, request);
		return response.data;
	}

	async deleteTemplate(id: string): Promise<void> {
		await apiClient.delete(`${API_BASE_URL}/${id}`);
	}

	// Template Validation
	async validateTemplateSchema(request: ValidateSchemaRequest): Promise<ValidationResponse> {
		const response = await apiClient.post<ValidationResponse>(`${API_BASE_URL}/validate-schema`, request);
		return response.data;
	}

	async validateCredentialData(id: string, request: ValidateCredentialDataRequest): Promise<ValidationResponse> {
		const response = await apiClient.post<ValidationResponse>(`${API_BASE_URL}/${id}/validate-data`, request);
		return response.data;
	}

	// Template Analytics
	async getTemplateUsageStats(id: string): Promise<TemplateUsageStats> {
		const response = await apiClient.get<TemplateUsageStats>(`${API_BASE_URL}/${id}/usage-stats`);
		return response.data;
	}

	// Template Export/Import
	async exportTemplate(id: string, format: string = 'json'): Promise<TemplateExportResponse> {
		const response = await apiClient.get<TemplateExportResponse>(`${API_BASE_URL}/${id}/export?format=${format}`);
		return response.data;
	}

	async importTemplate(request: TemplateImportRequest): Promise<CredentialTemplate> {
		const response = await apiClient.post<CredentialTemplate>(`${API_BASE_URL}/import`, request);
		return response.data;
	}

	// Template Versioning
	async getTemplateVersions(name: string): Promise<TemplateVersionsResponse> {
		const response = await apiClient.get<TemplateVersionsResponse>(`${API_BASE_URL}/versions/${encodeURIComponent(name)}`);
		return response.data;
	}

	async getLatestTemplateVersion(name: string): Promise<CredentialTemplate> {
		const response = await apiClient.get<CredentialTemplate>(`${API_BASE_URL}/latest/${encodeURIComponent(name)}`);
		return response.data;
	}

	// Utility methods
	async downloadTemplateExport(id: string, format: string = 'json'): Promise<void> {
		const exportData = await this.exportTemplate(id, format);

		const blob = new Blob([JSON.stringify(exportData, null, 2)], {
			type: format === 'yaml' ? 'application/x-yaml' : 'application/json',
		});

		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `template-${exportData.template.name}-${exportData.template.version}.${format}`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}

	async uploadTemplateImport(file: File, overwriteID: boolean = false): Promise<CredentialTemplate> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();

			reader.onload = async (event) => {
				try {
					const content = event.target?.result as string;
					const templateData = JSON.parse(content);

					const request: TemplateImportRequest = {
						template: templateData.template || templateData,
						format: file.name.endsWith('.yaml') || file.name.endsWith('.yml') ? 'yaml' : 'json',
						overwriteID,
					};

					const result = await this.importTemplate(request);
					resolve(result);
				} catch (error) {
					reject(new Error(`Failed to parse template file: ${error}`));
				}
			};

			reader.onerror = () => reject(new Error('Failed to read file'));
			reader.readAsText(file);
		});
	}

	async listTemplatesByUser(userID: string, page?: number, limit?: number): Promise<ListTemplatesResponse> {
		const params = new URLSearchParams();

		if (page) params.append('page', page.toString());
		if (limit) params.append('limit', limit.toString());

		const url = params.toString() ? `${API_BASE_URL}/user/${userID}?${params}` : `${API_BASE_URL}/user/${userID}`;
		const response = await apiClient.get<ListTemplatesResponse>(url);
		return response.data;
	}
}

export const templateService = new TemplateService();
export default templateService;
