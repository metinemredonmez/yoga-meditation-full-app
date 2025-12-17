import { Client } from '@elastic/elasticsearch';
import { config } from '../utils/config';
import { logger } from '../utils/logger';

// ============================================
// Elasticsearch Configuration
// ============================================

const esConfig = {
  url: config.elasticsearch?.url || 'http://localhost:9200',
  indexPrefix: config.elasticsearch?.indexPrefix || 'yoga',
};

let client: Client | null = null;

// ============================================
// Index Names
// ============================================

export const INDICES = {
  PROGRAMS: `${esConfig.indexPrefix}_programs`,
  POSES: `${esConfig.indexPrefix}_poses`,
  USERS: `${esConfig.indexPrefix}_users`,
  INSTRUCTORS: `${esConfig.indexPrefix}_instructors`,
  LIVE_STREAMS: `${esConfig.indexPrefix}_live_streams`,
  CHALLENGES: `${esConfig.indexPrefix}_challenges`,
  LOGS: `${esConfig.indexPrefix}_logs`,
  ANALYTICS: `${esConfig.indexPrefix}_analytics`,
} as const;

export type IndexName = (typeof INDICES)[keyof typeof INDICES];

// ============================================
// Index Mappings
// ============================================

const INDEX_MAPPINGS = {
  [INDICES.PROGRAMS]: {
    properties: {
      id: { type: 'keyword' },
      title: { type: 'text', analyzer: 'standard', fields: { keyword: { type: 'keyword' } } },
      description: { type: 'text', analyzer: 'standard' },
      level: { type: 'keyword' },
      duration: { type: 'integer' },
      category: { type: 'keyword' },
      tags: { type: 'keyword' },
      instructorId: { type: 'keyword' },
      instructorName: { type: 'text', fields: { keyword: { type: 'keyword' } } },
      isPublished: { type: 'boolean' },
      isPremium: { type: 'boolean' },
      rating: { type: 'float' },
      enrollmentCount: { type: 'integer' },
      createdAt: { type: 'date' },
      updatedAt: { type: 'date' },
      suggest: { type: 'completion' },
    },
  },
  [INDICES.POSES]: {
    properties: {
      id: { type: 'keyword' },
      name: { type: 'text', analyzer: 'standard', fields: { keyword: { type: 'keyword' } } },
      sanskritName: { type: 'text', fields: { keyword: { type: 'keyword' } } },
      description: { type: 'text', analyzer: 'standard' },
      difficulty: { type: 'keyword' },
      category: { type: 'keyword' },
      benefits: { type: 'text' },
      contraindications: { type: 'text' },
      tags: { type: 'keyword' },
      muscleGroups: { type: 'keyword' },
      suggest: { type: 'completion' },
    },
  },
  [INDICES.USERS]: {
    properties: {
      id: { type: 'keyword' },
      email: { type: 'keyword' },
      firstName: { type: 'text', fields: { keyword: { type: 'keyword' } } },
      lastName: { type: 'text', fields: { keyword: { type: 'keyword' } } },
      fullName: { type: 'text', fields: { keyword: { type: 'keyword' } } },
      role: { type: 'keyword' },
      subscriptionTier: { type: 'keyword' },
      isActive: { type: 'boolean' },
      createdAt: { type: 'date' },
      lastLoginAt: { type: 'date' },
    },
  },
  [INDICES.INSTRUCTORS]: {
    properties: {
      id: { type: 'keyword' },
      userId: { type: 'keyword' },
      name: { type: 'text', analyzer: 'standard', fields: { keyword: { type: 'keyword' } } },
      bio: { type: 'text', analyzer: 'standard' },
      specializations: { type: 'keyword' },
      rating: { type: 'float' },
      totalStudents: { type: 'integer' },
      totalPrograms: { type: 'integer' },
      isVerified: { type: 'boolean' },
      location: { type: 'geo_point' },
      suggest: { type: 'completion' },
    },
  },
  [INDICES.LIVE_STREAMS]: {
    properties: {
      id: { type: 'keyword' },
      title: { type: 'text', analyzer: 'standard', fields: { keyword: { type: 'keyword' } } },
      description: { type: 'text', analyzer: 'standard' },
      type: { type: 'keyword' },
      status: { type: 'keyword' },
      instructorId: { type: 'keyword' },
      instructorName: { type: 'text', fields: { keyword: { type: 'keyword' } } },
      scheduledStartAt: { type: 'date' },
      scheduledEndAt: { type: 'date' },
      tags: { type: 'keyword' },
      level: { type: 'keyword' },
      maxParticipants: { type: 'integer' },
      currentParticipants: { type: 'integer' },
    },
  },
  [INDICES.CHALLENGES]: {
    properties: {
      id: { type: 'keyword' },
      title: { type: 'text', analyzer: 'standard', fields: { keyword: { type: 'keyword' } } },
      description: { type: 'text', analyzer: 'standard' },
      duration: { type: 'integer' },
      difficulty: { type: 'keyword' },
      category: { type: 'keyword' },
      participantCount: { type: 'integer' },
      startDate: { type: 'date' },
      endDate: { type: 'date' },
      isActive: { type: 'boolean' },
    },
  },
  [INDICES.LOGS]: {
    properties: {
      timestamp: { type: 'date' },
      level: { type: 'keyword' },
      message: { type: 'text' },
      service: { type: 'keyword' },
      userId: { type: 'keyword' },
      requestId: { type: 'keyword' },
      method: { type: 'keyword' },
      path: { type: 'keyword' },
      statusCode: { type: 'integer' },
      responseTime: { type: 'integer' },
      error: { type: 'object' },
    },
  },
  [INDICES.ANALYTICS]: {
    properties: {
      timestamp: { type: 'date' },
      eventName: { type: 'keyword' },
      userId: { type: 'keyword' },
      sessionId: { type: 'keyword' },
      properties: { type: 'object' },
      device: { type: 'keyword' },
      platform: { type: 'keyword' },
      version: { type: 'keyword' },
    },
  },
};

// ============================================
// Client Management
// ============================================

export function getClient(): Client {
  if (client) {
    return client;
  }

  client = new Client({
    node: esConfig.url,
    maxRetries: 3,
    requestTimeout: 30000,
    sniffOnStart: false,
  });

  logger.info({ url: esConfig.url }, 'Elasticsearch client initialized');
  return client;
}

// ============================================
// Index Management
// ============================================

export async function createIndex(index: IndexName): Promise<void> {
  const esClient = getClient();

  const exists = await esClient.indices.exists({ index });

  if (!exists) {
    await esClient.indices.create({
      index,
      mappings: INDEX_MAPPINGS[index] as any,
      settings: {
        number_of_shards: 1,
        number_of_replicas: 0,
        analysis: {
          analyzer: {
            standard: {
              type: 'standard',
            },
          },
        },
      },
    });

    logger.info({ index }, 'Elasticsearch index created');
  }
}

export async function createAllIndices(): Promise<void> {
  for (const index of Object.values(INDICES)) {
    await createIndex(index);
  }
  logger.info('All Elasticsearch indices created');
}

export async function deleteIndex(index: IndexName): Promise<void> {
  const esClient = getClient();

  const exists = await esClient.indices.exists({ index });

  if (exists) {
    await esClient.indices.delete({ index });
    logger.info({ index }, 'Elasticsearch index deleted');
  }
}

// ============================================
// Document Operations
// ============================================

export async function indexDocument<T extends Record<string, any>>(
  index: IndexName,
  id: string,
  document: T,
): Promise<void> {
  const esClient = getClient();

  await esClient.index({
    index,
    id,
    document: {
      ...document,
      indexedAt: new Date().toISOString(),
    },
    refresh: true,
  });

  logger.debug({ index, id }, 'Document indexed');
}

export async function bulkIndex<T extends Record<string, any>>(
  index: IndexName,
  documents: Array<{ id: string; document: T }>,
): Promise<void> {
  const esClient = getClient();

  const operations = documents.flatMap((doc) => [
    { index: { _index: index, _id: doc.id } },
    { ...doc.document, indexedAt: new Date().toISOString() },
  ]);

  const result = await esClient.bulk({ operations, refresh: true });

  if (result.errors) {
    const erroredDocs = result.items.filter((item) => item.index?.error);
    logger.error({ index, errors: erroredDocs }, 'Bulk index had errors');
  }

  logger.debug({ index, count: documents.length }, 'Bulk documents indexed');
}

export async function getDocument<T>(
  index: IndexName,
  id: string,
): Promise<T | null> {
  const esClient = getClient();

  try {
    const result = await esClient.get<T>({ index, id });
    return result._source || null;
  } catch (error: any) {
    if (error.meta?.statusCode === 404) {
      return null;
    }
    throw error;
  }
}

export async function updateDocument<T extends Record<string, any>>(
  index: IndexName,
  id: string,
  document: Partial<T>,
): Promise<void> {
  const esClient = getClient();

  await esClient.update({
    index,
    id,
    doc: {
      ...document,
      updatedAt: new Date().toISOString(),
    },
    refresh: true,
  });

  logger.debug({ index, id }, 'Document updated');
}

export async function deleteDocument(
  index: IndexName,
  id: string,
): Promise<void> {
  const esClient = getClient();

  try {
    await esClient.delete({ index, id, refresh: true });
    logger.debug({ index, id }, 'Document deleted');
  } catch (error: any) {
    if (error.meta?.statusCode !== 404) {
      throw error;
    }
  }
}

// ============================================
// Search Operations
// ============================================

export interface SearchOptions {
  from?: number;
  size?: number;
  sort?: Array<Record<string, 'asc' | 'desc'>>;
  filters?: Record<string, any>;
  highlight?: string[];
}

export interface SearchResult<T> {
  hits: Array<{
    id: string;
    score: number;
    source: T;
    highlight?: Record<string, string[]>;
  }>;
  total: number;
  took: number;
}

export async function search<T>(
  index: IndexName | IndexName[],
  query: string,
  options: SearchOptions = {},
): Promise<SearchResult<T>> {
  const esClient = getClient();

  const { from = 0, size = 20, sort, filters, highlight } = options;

  const body: any = {
    query: {
      bool: {
        must: [
          {
            multi_match: {
              query,
              fields: ['title^3', 'name^3', 'description^2', 'tags', '*'],
              fuzziness: 'AUTO',
            },
          },
        ],
        filter: [],
      },
    },
    from,
    size,
  };

  // Add filters
  if (filters) {
    for (const [field, value] of Object.entries(filters)) {
      if (Array.isArray(value)) {
        body.query.bool.filter.push({ terms: { [field]: value } });
      } else {
        body.query.bool.filter.push({ term: { [field]: value } });
      }
    }
  }

  // Add sorting
  if (sort) {
    body.sort = sort;
  }

  // Add highlighting
  if (highlight) {
    body.highlight = {
      fields: highlight.reduce((acc, field) => {
        acc[field] = {};
        return acc;
      }, {} as Record<string, any>),
      pre_tags: ['<mark>'],
      post_tags: ['</mark>'],
    };
  }

  const result = await esClient.search<T>({
    index: Array.isArray(index) ? index.join(',') : index,
    body,
  });

  return {
    hits: result.hits.hits.map((hit) => ({
      id: hit._id!,
      score: hit._score || 0,
      source: hit._source as T,
      highlight: hit.highlight,
    })),
    total: typeof result.hits.total === 'number'
      ? result.hits.total
      : result.hits.total?.value || 0,
    took: result.took,
  };
}

export async function searchPrograms(
  query: string,
  options: SearchOptions & {
    level?: string;
    category?: string;
    isPremium?: boolean;
  } = {},
): Promise<SearchResult<any>> {
  const filters: Record<string, any> = { isPublished: true };

  if (options.level) filters.level = options.level;
  if (options.category) filters.category = options.category;
  if (options.isPremium !== undefined) filters.isPremium = options.isPremium;

  return search(INDICES.PROGRAMS, query, {
    ...options,
    filters: { ...filters, ...options.filters },
    highlight: ['title', 'description'],
  });
}

export async function searchPoses(
  query: string,
  options: SearchOptions & {
    difficulty?: string;
    category?: string;
  } = {},
): Promise<SearchResult<any>> {
  const filters: Record<string, any> = {};

  if (options.difficulty) filters.difficulty = options.difficulty;
  if (options.category) filters.category = options.category;

  return search(INDICES.POSES, query, {
    ...options,
    filters: { ...filters, ...options.filters },
    highlight: ['name', 'sanskritName', 'description', 'benefits'],
  });
}

export async function searchInstructors(
  query: string,
  options: SearchOptions & {
    specializations?: string[];
    isVerified?: boolean;
  } = {},
): Promise<SearchResult<any>> {
  const filters: Record<string, any> = {};

  if (options.specializations) filters.specializations = options.specializations;
  if (options.isVerified !== undefined) filters.isVerified = options.isVerified;

  return search(INDICES.INSTRUCTORS, query, {
    ...options,
    filters: { ...filters, ...options.filters },
    highlight: ['name', 'bio'],
  });
}

// ============================================
// Autocomplete / Suggestions
// ============================================

export async function suggest(
  index: IndexName,
  prefix: string,
  size: number = 5,
): Promise<string[]> {
  const esClient = getClient();

  const result = await esClient.search({
    index,
    suggest: {
      suggestions: {
        prefix,
        completion: {
          field: 'suggest',
          size,
          skip_duplicates: true,
        },
      },
    },
  } as any);

  const suggestions = (result.suggest as any)?.suggestions as any[];
  if (!suggestions || !suggestions[0]) {
    return [];
  }

  return suggestions[0].options.map((opt: any) => opt.text);
}

// ============================================
// Aggregations
// ============================================

export async function getAggregations(
  index: IndexName,
  field: string,
  size: number = 10,
): Promise<Array<{ key: string; count: number }>> {
  const esClient = getClient();

  const result = await esClient.search({
    index,
    size: 0,
    aggs: {
      field_agg: {
        terms: {
          field,
          size,
        },
      },
    },
  } as any);

  const buckets = (result.aggregations?.field_agg as any)?.buckets || [];
  return buckets.map((bucket: any) => ({
    key: bucket.key,
    count: bucket.doc_count,
  }));
}

// ============================================
// Health Check
// ============================================

export async function checkElasticsearchHealth(): Promise<{
  healthy: boolean;
  status?: string;
  clusterName?: string;
}> {
  try {
    const esClient = getClient();
    const health = await esClient.cluster.health();

    return {
      healthy: health.status !== 'red',
      status: health.status,
      clusterName: health.cluster_name,
    };
  } catch {
    return { healthy: false };
  }
}

// ============================================
// Shutdown
// ============================================

export async function closeElasticsearch(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    logger.info('Elasticsearch client closed');
  }
}
