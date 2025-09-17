export interface N8NFlow { // Renamed from N8NWorkflow for consistency with frontend usage
  name: string;
  nodes: N8NNode[];
  connections: { [key: string]: { main: N8NConnection[][] } };
  active: boolean;
  settings: { executionOrder: string };
  versionId: string;
  meta: { [key: string]: any }; // Can be more specific if needed
  id: string;
  tags: string[];
  pinData?: { [key: string]: any }; // Optional, based on your example
}

export interface N8NNode { // Renamed from N8NNodeActual
  parameters: N8NParameters;
  type: string;
  typeVersion: number;
  position: [number, number];
  id: string;
  name: string;
  webhookId?: string; // For webhook nodes
  retryOnFail?: boolean; // For HTTP Request nodes
  ui?: UIComponent[]; // Added for UI components within a node
  true_branch?: N8NNode[]; // Added for 'if' node true branch
  false_branch?: N8NNode[]; // Added for 'if' node false branch
  default_case?: N8NNode[]; // Added for 'switch' node default case
  cases?: N8NCase[]; // Added for 'switch' node cases
}

export interface UIComponent {
  label: string;
  value: string;
  // Add other properties if known from N8N UI components
}

export interface N8NCase {
  branch: N8NNode[];
  case: string; // Added for switch node cases
  // Add other properties if known from N8N case structures
}

export interface N8NParameters {
  [key: string]: any; // Parameters are highly dynamic based on node type
  // Examples of common parameters, can be expanded:
  conditions?: { // For 'if' node
    options: { caseSensitive: boolean; leftValue: string; typeValidation: string; version: number };
    conditions: N8NCondition[];
    combinator: string;
  };
  assignments?: { // For 'set' node
    assignments: N8NAssignment[];
    includeOtherFields: boolean;
    options: {};
  };
  httpMethod?: string; // For 'webhook' node
  path?: string; // For 'webhook' node
  responseMode?: string; // For 'webhook' node
  url?: string; // For 'httpRequest' node
  sendHeaders?: boolean;
  specifyHeaders?: string;
  jsonHeaders?: string;
  sendBody?: boolean;
  specifyBody?: string;
  jsonBody?: string;
  jsCode?: string; // For 'code' node
  operation?: string; // For 'extractFromFile' node
}

export interface N8NCondition {
  id: string;
  leftValue: string;
  rightValue: string;
  operator: { type: string; operation: string; name: string; singleValue?: boolean };
}

export interface N8NAssignment {
  id: string;
  name: string;
  value: string;
  type: string;
}

export interface N8NConnection {
  node: string;
  type: string;
  index: number;
}
