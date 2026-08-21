import { supabase, KnowledgeBaseEntry } from './supabase';
import { raceWithTimeout, DEFAULT_QUERY_TIMEOUT_MS } from './withFallbackTimeout';

const EDGE_FUNCTION_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''}/functions/v1/search-knowledge-base`;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export type SearchCandidate = {
  id: number;
  title: string;
  category: string;
};

export type SearchResult =
  | { result: 'match'; article: KnowledgeBaseEntry }
  | { result: 'candidates'; candidates: SearchCandidate[] }
  | { result: 'no_match' };

// Calls the search-knowledge-base Edge Function — the Anthropic key never
// touches the client, only this server-side function reads it. Employee
// identity is passed through so the function can log the query for
// supervisor review (kb_queries table).
export async function searchKnowledgeBase(
  question: string,
  identity?: { telegramChatId?: string | null; fullName?: string | null }
): Promise<SearchResult> {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      question,
      telegramChatId: identity?.telegramChatId ?? null,
      fullName: identity?.fullName ?? null,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error ?? 'Не удалось выполнить поиск. Попробуйте снова.');
  }

  if (data.result === 'match' && data.article) {
    return { result: 'match', article: data.article as KnowledgeBaseEntry };
  }

  if (data.result === 'candidates' && Array.isArray(data.candidates)) {
    return { result: 'candidates', candidates: data.candidates as SearchCandidate[] };
  }

  return { result: 'no_match' };
}

// The knowledge_base table stores fine-grained categories. The app groups
// them into 8 broad topics for browsing — this map defines that grouping.
export type KnowledgeTopic = {
  slug: string;
  label: string;
  categories: string[];
};

export const KNOWLEDGE_TOPICS: KnowledgeTopic[] = [
  {
    slug: 'shift',
    label: 'Приём и завершение смены',
    categories: ['Дисциплина смены'],
  },
  {
    slug: 'service-standards',
    label: 'Стандарты сервиса и общение с жителями',
    categories: ['Стандарты сервиса', 'Коммуникация', 'Корпкультура'],
  },
  {
    slug: 'visitors',
    label: 'Посетители, гости, курьеры',
    categories: ['Посетители и курьеры'],
  },
  {
    slug: 'parcels-requests',
    label: 'Посылки и заявки жителей',
    categories: ['Посылки', 'Заявки и замечания', 'Отчётность'],
  },
  {
    slug: 'workplace',
    label: 'Рабочее место, лобби, внешний вид',
    categories: ['Лобби и рабочее место', 'Внешний вид', 'Климат', 'Медиа и музыка'],
  },
  {
    slug: 'security',
    label: 'Безопасность, охрана, полиция, ЧП',
    categories: ['Безопасность', 'Видеонаблюдение'],
  },
  {
    slug: 'restrictions',
    label: 'Ограничения и запреты в работе',
    categories: [
      'Ограничения доступа',
      'Запрет на посторонние работы',
      'Конфиденциальность',
      'Ответственность',
    ],
  },
  {
    slug: 'equipment',
    label: 'Техника, оборудование, порядок на объекте',
    categories: ['Доступ и ключи', 'Контроль доступа'],
  },
];

export function getTopicBySlug(slug: string): KnowledgeTopic | undefined {
  return KNOWLEDGE_TOPICS.find((t) => t.slug === slug);
}

// Falls back to an empty list if the network stalls.
export async function getArticlesForTopic(topic: KnowledgeTopic): Promise<KnowledgeBaseEntry[]> {
  const result = await raceWithTimeout(
    supabase
      .from('knowledge_base')
      .select('*')
      .in('category', topic.categories)
      .eq('is_active', true)
      .order('priority', { ascending: true }),
    DEFAULT_QUERY_TIMEOUT_MS,
    'getArticlesForTopic'
  );

  if (result.timedOut) return [];
  if (result.error) throw result.error;
  return result.data ?? [];
}

// Falls back to `null` if the network stalls.
export async function getArticleById(id: number): Promise<KnowledgeBaseEntry | null> {
  const result = await raceWithTimeout(
    supabase.from('knowledge_base').select('*').eq('id', id).maybeSingle(),
    DEFAULT_QUERY_TIMEOUT_MS,
    'getArticleById'
  );

  if (result.timedOut) return null;
  if (result.error) throw result.error;
  return result.data;
}
