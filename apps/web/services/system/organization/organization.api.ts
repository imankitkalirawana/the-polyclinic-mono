import { User } from '@repo/store';
import type {
  CreateOrganizationInput,
  UpdateOrganizationInput,
} from './organization.types';
import type { Organization } from '@repo/store';

import { apiRequest } from '@/libs/axios';

export class OrganizationApi {
  private static readonly API_BASE = '/system/organizations';
  static async getAll() {
    return await apiRequest<Organization[]>({
      url: this.API_BASE,
    });
  }

  // Get organization by ID
  static async getById(organizationId: string) {
    return await apiRequest<{
      organization: Organization;
      users: User[];
    }>({
      url: `${this.API_BASE}/${organizationId}`,
    });
  }

  // Create organization
  static async create(organization: CreateOrganizationInput) {
    return await apiRequest<Organization>({
      url: this.API_BASE,
      method: 'POST',
      data: organization,
    });
  }

  // Update organization
  static async update(organizationId: string, organization: UpdateOrganizationInput) {
    return await apiRequest<unknown>({
      url: `${this.API_BASE}/${organizationId}`,
      method: 'PUT',
      data: organization,
    });
  }

  // Delete organization
  static async delete(organizationId: string) {
    return await apiRequest<Organization>({
      url: `${this.API_BASE}/${organizationId}`,
      method: 'DELETE',
    });
  }

  // Toggle organization status
  static async toggleStatus(organizationId: string, status: 'active' | 'inactive') {
    return await apiRequest<Organization>({
      url: `${this.API_BASE}/${organizationId}/status`,
      method: 'PUT',
      data: { status },
    });
  }
}
