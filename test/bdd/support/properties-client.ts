import axios, { AxiosError } from 'axios';

export interface Property {
  id: string;
  title: string;
  description: string;
  type: string;
  purpose: string;
  price: number;
  neighborhood: string;
  city: string;
  bedrooms?: number;
  bathrooms?: number;
  area: number;
  garageSpaces?: number;
  hasPool: boolean;
  hasJacuzzi: boolean;
  oceanFront: boolean;
  hasGarden: boolean;
  hasGourmetArea: boolean;
  furnished: boolean;
  realtorId: string;
  coverImageUrl?: string;
  createdAt: string;
  updatedAt: string;
  realtor?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    profile?: {
      businessName?: string;
      contactName?: string;
      phone?: string;
      email?: string;
      instagram?: string;
      facebook?: string;
      linkedin?: string;
      whatsappBusiness?: string;
    };
  };
}

export interface CreatePropertyDto {
  title: string;
  description: string;
  type: string;
  purpose?: string;
  price: number;
  neighborhood: string;
  city: string;
  bedrooms?: number;
  bathrooms?: number;
  area: number;
  garageSpaces?: number;
  hasPool?: boolean;
  hasJacuzzi?: boolean;
  oceanFront?: boolean;
  hasGarden?: boolean;
  hasGourmetArea?: boolean;
  furnished?: boolean;
}

export interface UpdatePropertyDto {
  title?: string;
  description?: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  garageSpaces?: number;
  hasPool?: boolean;
  hasJacuzzi?: boolean;
  oceanFront?: boolean;
  hasGarden?: boolean;
  hasGourmetArea?: boolean;
  furnished?: boolean;
}

/**
 * Cliente HTTP para testes da API de Properties
 */
export class PropertiesTestClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3009') {
    this.baseUrl = baseUrl;
  }

  /**
   * Listar propriedades (público)
   */
  public async listProperties(filters?: {
    city?: string;
    type?: string;
    purpose?: string;
    minPrice?: number;
    maxPrice?: number;
    realtorId?: string;
  }): Promise<{ properties: Property[]; status: number }> {
    try {
      const params = new URLSearchParams();
      if (filters?.city) params.append('city', filters.city);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.purpose) params.append('purpose', filters.purpose);
      if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
      if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
      if (filters?.realtorId) params.append('realtorId', filters.realtorId);

      const response = await axios.get<Property[]>(
        `${this.baseUrl}/api/properties${params.toString() ? `?${params.toString()}` : ''}`,
        {
          timeout: 30000,
        },
      );

      return {
        properties: response.data,
        status: response.status,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string }>;
        throw new Error(
          axiosError.response?.data?.message ||
            axiosError.message ||
            'Erro ao listar propriedades',
        );
      }
      throw error;
    }
  }

  /**
   * Obter propriedade por ID (público)
   */
  public async getPropertyById(id: string): Promise<{ property: Property; status: number }> {
    try {
      const response = await axios.get<Property>(`${this.baseUrl}/api/properties/${id}`, {
        timeout: 30000,
      });

      return {
        property: response.data,
        status: response.status,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string }>;
        // Preservar o status HTTP no erro para que os steps possam verificar
        const status = axiosError.response?.status || 500;
        const errorMessage = axiosError.response?.data?.message ||
          axiosError.message ||
          'Erro ao obter propriedade';
        const customError = new Error(errorMessage) as any;
        customError.status = status;
        customError.response = axiosError.response;
        throw customError;
      }
      throw error;
    }
  }

  /**
   * Criar propriedade (requer autenticação)
   */
  public async createProperty(
    data: CreatePropertyDto,
    token: string,
  ): Promise<{ property: Property; status: number }> {
    try {
      const response = await axios.post<Property>(`${this.baseUrl}/api/properties`, data, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        timeout: 30000,
      });

      return {
        property: response.data,
        status: response.status,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string }>;
        throw new Error(
          axiosError.response?.data?.message ||
            axiosError.message ||
            'Erro ao criar propriedade',
        );
      }
      throw error;
    }
  }

  /**
   * Atualizar propriedade (requer autenticação)
   */
  public async updateProperty(
    id: string,
    data: UpdatePropertyDto,
    token: string,
  ): Promise<{ property: Property; status: number }> {
    try {
      const response = await axios.put<Property>(`${this.baseUrl}/api/properties/${id}`, data, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        timeout: 30000,
      });

      return {
        property: response.data,
        status: response.status,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string }>;
        throw new Error(
          axiosError.response?.data?.message ||
            axiosError.message ||
            'Erro ao atualizar propriedade',
        );
      }
      throw error;
    }
  }

  /**
   * Deletar propriedade (requer autenticação)
   */
  public async deleteProperty(id: string, token: string): Promise<{ status: number }> {
    try {
      const response = await axios.delete(`${this.baseUrl}/api/properties/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 30000,
      });

      return {
        status: response.status,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string }>;
        throw new Error(
          axiosError.response?.data?.message ||
            axiosError.message ||
            'Erro ao deletar propriedade',
        );
      }
      throw error;
    }
  }

  /**
   * Listar minhas propriedades (requer autenticação)
   */
  public async listMyProperties(token: string): Promise<{ properties: Property[]; status: number }> {
    try {
      const response = await axios.get<Property[]>(`${this.baseUrl}/api/properties/my-properties`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 30000,
      });

      return {
        properties: response.data,
        status: response.status,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string }>;
        // Preservar o status HTTP no erro para que os steps possam verificar
        const status = axiosError.response?.status || 500;
        const errorMessage = axiosError.response?.data?.message ||
          axiosError.message ||
          'Erro ao listar minhas propriedades';
        const customError = new Error(errorMessage) as any;
        customError.status = status;
        customError.response = axiosError.response;
        throw customError;
      }
      throw error;
    }
  }

  /**
   * Fazer login para obter token
   */
  public async login(email: string, password: string): Promise<{ token: string; status: number }> {
    try {
      const response = await axios.post<{ access_token: string }>(
        `${this.baseUrl}/api/auth/login`,
        {
          email,
          password,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      return {
        token: response.data.access_token,
        status: response.status,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string }>;
        throw new Error(
          axiosError.response?.data?.message ||
            axiosError.message ||
            'Erro ao fazer login',
        );
      }
      throw error;
    }
  }
}

