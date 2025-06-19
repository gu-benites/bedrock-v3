/**
 * State Normalization Engine
 * Comprehensive system for normalizing complex nested data structures
 */

import { produce } from 'immer';

// ============================================================================
// NORMALIZATION TYPES
// ============================================================================

export interface NormalizedEntity {
  id: string;
  [key: string]: any;
}

export interface NormalizedState<T = any> {
  entities: Record<string, T>;
  ids: string[];
}

export interface NormalizedStore {
  [entityType: string]: NormalizedState;
}

export interface EntityRelationship {
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  foreignKey: string;
  relatedEntity: string;
  relatedField?: string;
}

export interface EntitySchema {
  idField: string;
  relationships?: Record<string, EntityRelationship>;
  computedFields?: Record<string, (entity: any, store: NormalizedStore) => any>;
}

export interface NormalizationConfig {
  schemas: Record<string, EntitySchema>;
  preserveOriginal?: boolean;
  enableCaching?: boolean;
}

// ============================================================================
// NORMALIZATION ENGINE
// ============================================================================

export class NormalizationEngine {
  private config: NormalizationConfig;
  private cache: Map<string, any> = new Map();

  constructor(config: NormalizationConfig) {
    this.config = config;
  }

  /**
   * Normalize an array of entities
   */
  normalize<T extends NormalizedEntity>(
    entityType: string,
    entities: T[]
  ): NormalizedState<T> {
    const cacheKey = `${entityType}-${JSON.stringify(entities)}`;
    
    if (this.config.enableCaching && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const schema = this.config.schemas[entityType];
    if (!schema) {
      throw new Error(`No schema found for entity type: ${entityType}`);
    }

    const normalized: NormalizedState<T> = {
      entities: {},
      ids: []
    };

    entities.forEach(entity => {
      const id = entity[schema.idField];
      if (!id) {
        console.warn(`Entity missing ID field ${schema.idField}:`, entity);
        return;
      }

      normalized.entities[id] = entity;
      normalized.ids.push(id);
    });

    if (this.config.enableCaching) {
      this.cache.set(cacheKey, normalized);
    }

    return normalized;
  }

  /**
   * Denormalize entities back to array format
   */
  denormalize<T>(
    entityType: string,
    normalizedState: NormalizedState<T>,
    store?: NormalizedStore
  ): T[] {
    const schema = this.config.schemas[entityType];
    if (!schema) {
      throw new Error(`No schema found for entity type: ${entityType}`);
    }

    return normalizedState.ids.map(id => {
      const entity = normalizedState.entities[id];
      if (!entity) return null;

      // Apply computed fields if available
      if (schema.computedFields && store) {
        const computedEntity = { ...entity };
        Object.entries(schema.computedFields).forEach(([field, computeFn]) => {
          computedEntity[field] = computeFn(entity, store);
        });
        return computedEntity;
      }

      return entity;
    }).filter(Boolean) as T[];
  }

  /**
   * Add entity to normalized state
   */
  addEntity<T extends NormalizedEntity>(
    entityType: string,
    normalizedState: NormalizedState<T>,
    entity: T
  ): NormalizedState<T> {
    const schema = this.config.schemas[entityType];
    const id = entity[schema.idField];

    return produce(normalizedState, draft => {
      draft.entities[id] = entity;
      if (!draft.ids.includes(id)) {
        draft.ids.push(id);
      }
    });
  }

  /**
   * Update entity in normalized state
   */
  updateEntity<T extends NormalizedEntity>(
    entityType: string,
    normalizedState: NormalizedState<T>,
    id: string,
    updates: Partial<T>
  ): NormalizedState<T> {
    return produce(normalizedState, draft => {
      if (draft.entities[id]) {
        draft.entities[id] = { ...draft.entities[id], ...updates };
      }
    });
  }

  /**
   * Remove entity from normalized state
   */
  removeEntity<T>(
    entityType: string,
    normalizedState: NormalizedState<T>,
    id: string
  ): NormalizedState<T> {
    return produce(normalizedState, draft => {
      delete draft.entities[id];
      draft.ids = draft.ids.filter(entityId => entityId !== id);
    });
  }

  /**
   * Get entity by ID
   */
  getEntity<T>(
    normalizedState: NormalizedState<T>,
    id: string
  ): T | undefined {
    return normalizedState.entities[id];
  }

  /**
   * Get entities by IDs
   */
  getEntities<T>(
    normalizedState: NormalizedState<T>,
    ids: string[]
  ): T[] {
    return ids.map(id => normalizedState.entities[id]).filter(Boolean);
  }

  /**
   * Filter entities by predicate
   */
  filterEntities<T>(
    normalizedState: NormalizedState<T>,
    predicate: (entity: T) => boolean
  ): T[] {
    return normalizedState.ids
      .map(id => normalizedState.entities[id])
      .filter(predicate);
  }

  /**
   * Resolve relationships for an entity
   */
  resolveRelationships<T>(
    entityType: string,
    entity: T,
    store: NormalizedStore
  ): T & { [key: string]: any } {
    const schema = this.config.schemas[entityType];
    if (!schema.relationships) return entity;

    const resolved = { ...entity };

    Object.entries(schema.relationships).forEach(([field, relationship]) => {
      const relatedState = store[relationship.relatedEntity];
      if (!relatedState) return;

      switch (relationship.type) {
        case 'one-to-one':
          const relatedId = (entity as any)[relationship.foreignKey];
          if (relatedId) {
            resolved[field] = relatedState.entities[relatedId];
          }
          break;

        case 'one-to-many':
          const relatedIds = (entity as any)[relationship.foreignKey] || [];
          resolved[field] = relatedIds
            .map((id: string) => relatedState.entities[id])
            .filter(Boolean);
          break;

        case 'many-to-many':
          // Implementation depends on specific use case
          break;
      }
    });

    return resolved;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// ============================================================================
// RECIPE-SPECIFIC NORMALIZATION
// ============================================================================

/**
 * Recipe-specific entity schemas
 */
export const recipeEntitySchemas: Record<string, EntitySchema> = {
  causes: {
    idField: 'cause_id',
    relationships: {
      addressedByProperties: {
        type: 'one-to-many',
        foreignKey: 'cause_id',
        relatedEntity: 'properties',
        relatedField: 'addresses_cause_ids'
      }
    },
    computedFields: {
      isSelected: (entity, store) => {
        const selectedCauses = store.selectedCauses?.ids || [];
        return selectedCauses.includes(entity.cause_id);
      },
      addressingPropertiesCount: (entity, store) => {
        const properties = store.properties?.entities || {};
        return Object.values(properties).filter((prop: any) => 
          prop.addresses_cause_ids?.includes(entity.cause_id)
        ).length;
      }
    }
  },

  symptoms: {
    idField: 'symptom_id',
    relationships: {
      addressedByProperties: {
        type: 'one-to-many',
        foreignKey: 'symptom_id',
        relatedEntity: 'properties',
        relatedField: 'addresses_symptom_ids'
      }
    },
    computedFields: {
      isSelected: (entity, store) => {
        const selectedSymptoms = store.selectedSymptoms?.ids || [];
        return selectedSymptoms.includes(entity.symptom_id);
      },
      addressingPropertiesCount: (entity, store) => {
        const properties = store.properties?.entities || {};
        return Object.values(properties).filter((prop: any) => 
          prop.addresses_symptom_ids?.includes(entity.symptom_id)
        ).length;
      }
    }
  },

  properties: {
    idField: 'property_id',
    relationships: {
      addressedCauses: {
        type: 'one-to-many',
        foreignKey: 'addresses_cause_ids',
        relatedEntity: 'causes'
      },
      addressedSymptoms: {
        type: 'one-to-many',
        foreignKey: 'addresses_symptom_ids',
        relatedEntity: 'symptoms'
      },
      suggestedOils: {
        type: 'one-to-many',
        foreignKey: 'property_id',
        relatedEntity: 'oils',
        relatedField: 'property_id'
      }
    },
    computedFields: {
      relevancyScore: (entity) => {
        return entity.relevancy_score || entity.relevancy || 0;
      },
      totalAddressedItems: (entity, store) => {
        const causesCount = entity.addresses_cause_ids?.length || 0;
        const symptomsCount = entity.addresses_symptom_ids?.length || 0;
        return causesCount + symptomsCount;
      },
      oilsCount: (entity, store) => {
        const oils = store.oils?.entities || {};
        return Object.values(oils).filter((oil: any) => 
          oil.property_id === entity.property_id
        ).length;
      }
    }
  },

  oils: {
    idField: 'oil_id',
    relationships: {
      property: {
        type: 'one-to-one',
        foreignKey: 'property_id',
        relatedEntity: 'properties'
      }
    },
    computedFields: {
      relevancyScore: (entity) => {
        return entity.relevancy_to_property_score || entity.relevancy || 0;
      },
      displayName: (entity) => {
        return entity.name_localized || entity.name_english || entity.name_botanical;
      }
    }
  }
};

/**
 * Create recipe normalization engine
 */
export const createRecipeNormalizationEngine = () => {
  return new NormalizationEngine({
    schemas: recipeEntitySchemas,
    preserveOriginal: true,
    enableCaching: true
  });
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Normalize recipe data from API responses
 */
export const normalizeRecipeData = (data: {
  potentialCauses?: any[];
  selectedCauses?: any[];
  potentialSymptoms?: any[];
  selectedSymptoms?: any[];
  therapeuticProperties?: any[];
  suggestedOils?: any[];
}) => {
  const engine = createRecipeNormalizationEngine();
  const normalizedStore: NormalizedStore = {};

  // Normalize causes
  if (data.potentialCauses) {
    normalizedStore.causes = engine.normalize('causes', data.potentialCauses);
  }
  if (data.selectedCauses) {
    normalizedStore.selectedCauses = engine.normalize('causes', data.selectedCauses);
  }

  // Normalize symptoms
  if (data.potentialSymptoms) {
    normalizedStore.symptoms = engine.normalize('symptoms', data.potentialSymptoms);
  }
  if (data.selectedSymptoms) {
    normalizedStore.selectedSymptoms = engine.normalize('symptoms', data.selectedSymptoms);
  }

  // Normalize properties
  if (data.therapeuticProperties) {
    normalizedStore.properties = engine.normalize('properties', data.therapeuticProperties);
  }

  // Normalize oils (flatten from property oil suggestions)
  if (data.suggestedOils) {
    const allOils: any[] = [];
    data.suggestedOils.forEach((propertyOils: any) => {
      if (propertyOils.suggested_oils) {
        propertyOils.suggested_oils.forEach((oil: any) => {
          allOils.push({
            ...oil,
            property_id: propertyOils.property_id
          });
        });
      }
    });
    normalizedStore.oils = engine.normalize('oils', allOils);
  }

  return { normalizedStore, engine };
};

/**
 * Denormalize recipe data back to original format
 */
export const denormalizeRecipeData = (
  normalizedStore: NormalizedStore,
  engine: NormalizationEngine
) => {
  const denormalized: any = {};

  if (normalizedStore.causes) {
    denormalized.potentialCauses = engine.denormalize('causes', normalizedStore.causes, normalizedStore);
  }
  if (normalizedStore.selectedCauses) {
    denormalized.selectedCauses = engine.denormalize('causes', normalizedStore.selectedCauses, normalizedStore);
  }
  if (normalizedStore.symptoms) {
    denormalized.potentialSymptoms = engine.denormalize('symptoms', normalizedStore.symptoms, normalizedStore);
  }
  if (normalizedStore.selectedSymptoms) {
    denormalized.selectedSymptoms = engine.denormalize('symptoms', normalizedStore.selectedSymptoms, normalizedStore);
  }
  if (normalizedStore.properties) {
    denormalized.therapeuticProperties = engine.denormalize('properties', normalizedStore.properties, normalizedStore);
  }

  // Reconstruct property oil suggestions
  if (normalizedStore.properties && normalizedStore.oils) {
    const properties = engine.denormalize('properties', normalizedStore.properties, normalizedStore);
    denormalized.suggestedOils = properties.map(property => {
      const propertyOils = engine.filterEntities(normalizedStore.oils, 
        oil => oil.property_id === property.property_id
      );
      return {
        property_id: property.property_id,
        property_name: property.property_name_localized || property.property_name,
        property_name_in_english: property.property_name_english,
        description: property.description_contextual_localized || property.description,
        suggested_oils: propertyOils
      };
    });
  }

  return denormalized;
};

/**
 * Performance monitoring for normalization operations
 */
export class NormalizationPerformanceMonitor {
  private operationTimes = new Map<string, number[]>();
  private operationCounts = new Map<string, number>();

  recordOperation(operationName: string, duration: number): void {
    // Update counts
    const currentCount = this.operationCounts.get(operationName) || 0;
    this.operationCounts.set(operationName, currentCount + 1);

    // Track timing
    const times = this.operationTimes.get(operationName) || [];
    times.push(duration);
    if (times.length > 100) times.shift();
    this.operationTimes.set(operationName, times);

    // Log slow operations
    if (duration > 10 && process.env.NODE_ENV === 'development') {
      console.warn(`🐌 Slow normalization: ${operationName} took ${duration.toFixed(2)}ms`);
    }
  }

  getReport(): {
    operationName: string;
    totalOperations: number;
    averageTime: number;
    maxTime: number;
  }[] {
    const report: any[] = [];

    for (const [operationName, count] of this.operationCounts) {
      const times = this.operationTimes.get(operationName) || [];
      const averageTime = times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : 0;
      const maxTime = times.length > 0 ? Math.max(...times) : 0;

      report.push({
        operationName,
        totalOperations: count,
        averageTime,
        maxTime
      });
    }

    return report.sort((a, b) => b.averageTime - a.averageTime);
  }

  clearMetrics(): void {
    this.operationTimes.clear();
    this.operationCounts.clear();
  }
}

// Global normalization performance monitor
export const normalizationPerformanceMonitor = new NormalizationPerformanceMonitor();

/**
 * Higher-order function to add monitoring to normalization operations
 */
export const withNormalizationMonitoring = <T>(
  operationName: string,
  operation: () => T
): T => {
  const startTime = performance.now();
  const result = operation();
  const duration = performance.now() - startTime;

  normalizationPerformanceMonitor.recordOperation(operationName, duration);
  return result;
};

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).recipeNormalizationEngine = createRecipeNormalizationEngine();
  (window as any).normalizationPerformanceMonitor = normalizationPerformanceMonitor;
}
