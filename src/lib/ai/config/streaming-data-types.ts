/**
 * Configuration for different data types in AI streaming responses
 * This file defines validation rules and processing logic for each supported data type
 */

export interface DataTypeConfig {
  /** The field name that serves as the unique identifier for items of this type */
  idField: string;
  /** Required fields that must be present and non-empty for an item to be considered complete */
  requiredFields: string[];
  /** Minimum character lengths for required fields */
  minLengths: Record<string, number>;
  /** Optional fields that should be included if present */
  optionalFields: string[];
  /** Human-readable name for logging */
  displayName: string;
}

/**
 * Configuration for all supported streaming data types
 * Add new data types here to automatically support them in streaming
 */
export const STREAMING_DATA_TYPES: Record<string, DataTypeConfig> = {
  potential_causes: {
    idField: 'cause_id',
    requiredFields: ['name_localized', 'suggestion_localized', 'explanation_localized'],
    minLengths: { 
      name_localized: 10, 
      suggestion_localized: 20, 
      explanation_localized: 30 
    },
    optionalFields: ['confidence', 'tags'],
    displayName: 'Potential Cause'
  },

  potential_symptoms: {
    idField: 'symptom_id',
    requiredFields: ['name_localized', 'suggestion_localized', 'explanation_localized'],
    minLengths: { 
      name_localized: 5, 
      suggestion_localized: 10, 
      explanation_localized: 15 
    },
    optionalFields: [],
    displayName: 'Potential Symptom'
  },

  therapeutic_properties: {
    idField: 'property_id',
    requiredFields: ['property_name_localized', 'description_contextual_localized'],
    minLengths: {
      property_name_localized: 5,
      description_contextual_localized: 15
    },
    optionalFields: ['property_name_english', 'relevancy_score', 'addresses_cause_ids', 'addresses_symptom_ids'],
    displayName: 'Therapeutic Property'
  },

  essential_oils: {
    idField: 'oil_id',
    requiredFields: ['name_localized', 'description_localized'],
    minLengths: { 
      name_localized: 3, 
      description_localized: 10 
    },
    optionalFields: ['relevancy', 'properties'],
    displayName: 'Essential Oil'
  },

  suggested_oils: {
    idField: 'oil_id',
    requiredFields: ['name_english', 'name_local_language', 'oil_description'],
    minLengths: { 
      name_english: 3, 
      name_local_language: 3, 
      oil_description: 10 
    },
    optionalFields: ['relevancy'],
    displayName: 'Suggested Oil'
  },

  medical_properties: {
    idField: 'property_id',
    requiredFields: ['property_name', 'description'],
    minLengths: { 
      property_name: 5, 
      description: 15 
    },
    optionalFields: ['causes_addressed', 'symptoms_addressed', 'relevancy'],
    displayName: 'Medical Property'
  }
};

/**
 * Validate if an item is complete based on its data type configuration
 */
export function isItemComplete(item: any, config: DataTypeConfig): boolean {
  if (!item || typeof item !== 'object' || !item[config.idField]) {
    return false;
  }

  // Check all required fields exist and meet minimum length requirements
  for (const field of config.requiredFields) {
    const value = item[field];
    if (!value || typeof value !== 'string') {
      return false;
    }

    const minLength = config.minLengths[field] || 1;
    if (value.length < minLength || value.endsWith('...')) {
      return false;
    }
  }

  return true;
}

/**
 * Clean item data based on its configuration, including only relevant fields
 */
export function cleanItemData(item: any, config: DataTypeConfig): any {
  const cleanData: any = {};

  // Add ID field
  cleanData[config.idField] = item[config.idField];

  // Add required fields (trimmed)
  for (const field of config.requiredFields) {
    cleanData[field] = item[field].trim();
  }

  // Add optional fields if present
  for (const field of config.optionalFields) {
    if (item[field] !== undefined && item[field] !== null) {
      cleanData[field] = item[field];
    }
  }

  return cleanData;
}

/**
 * Get configuration for a specific data type
 */
export function getDataTypeConfig(dataType: string): DataTypeConfig | null {
  return STREAMING_DATA_TYPES[dataType] || null;
}

/**
 * Get all supported data type names
 */
export function getSupportedDataTypes(): string[] {
  return Object.keys(STREAMING_DATA_TYPES);
}

/**
 * Check if a data type is supported
 */
export function isDataTypeSupported(dataType: string): boolean {
  return dataType in STREAMING_DATA_TYPES;
}

/**
 * Auto-detect data types present in a response object
 */
export function detectDataTypes(responseData: any): string[] {
  if (!responseData?.data || typeof responseData.data !== 'object') {
    return [];
  }

  const detectedTypes: string[] = [];
  
  for (const dataType of getSupportedDataTypes()) {
    if (Array.isArray(responseData.data[dataType])) {
      detectedTypes.push(dataType);
    }
  }

  return detectedTypes;
}

/**
 * Get the primary display field for a data type (used for logging and UI)
 */
export function getPrimaryDisplayField(dataType: string): string {
  const config = getDataTypeConfig(dataType);
  if (!config) return 'unknown';
  
  // Prefer name_localized, then the first required field
  if (config.requiredFields.includes('name_localized')) {
    return 'name_localized';
  }
  
  return config.requiredFields[0] || config.idField;
}

/**
 * Validate streaming response structure
 */
export function validateStreamingResponse(response: any): {
  isValid: boolean;
  detectedTypes: string[];
  errors: string[];
} {
  const errors: string[] = [];
  const detectedTypes = detectDataTypes(response);

  if (!response) {
    errors.push('Response is null or undefined');
    return { isValid: false, detectedTypes: [], errors };
  }

  if (!response.data) {
    errors.push('Response missing data field');
    return { isValid: false, detectedTypes: [], errors };
  }

  if (detectedTypes.length === 0) {
    errors.push('No supported data types found in response');
    return { isValid: false, detectedTypes: [], errors };
  }

  return {
    isValid: errors.length === 0,
    detectedTypes,
    errors
  };
}

/**
 * Transform streaming data for frontend consumption
 */
export function transformStreamingData(
  items: any[], 
  dataType: string,
  transformFn?: (item: any) => any
): any[] {
  const config = getDataTypeConfig(dataType);
  if (!config) {
    console.warn(`Unknown data type: ${dataType}`);
    return items;
  }

  return items
    .filter(item => isItemComplete(item, config))
    .map(item => {
      const cleanedItem = cleanItemData(item, config);
      return transformFn ? transformFn(cleanedItem) : cleanedItem;
    });
}
