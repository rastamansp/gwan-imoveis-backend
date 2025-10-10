export interface McpExtension {
  enabled: boolean;
  toolName: string;
  description: string;
}

export interface ToolWithMetadata {
  name: string;
  description: string;
  inputSchema: any;
  httpMethod: string;
  httpPath: string;
  baseUrl: string;
}

export interface HttpToolOptions {
  baseUrl: string;
  authToken?: string;
  timeout?: number;
  requireAuth?: boolean;
}

export interface McpAuthInfo {
  token?: string;
  required: boolean;
}

export interface HttpToolResult {
  success: boolean;
  data?: any;
  error?: string;
  statusCode?: number;
}
