// Supabase Edge Function: search-knowledge-base
//
// Accepts a free-text employee question, sends it along with the full set of
// active knowledge_base entries to Claude, and asks it to identify the most
// relevant entry (or entries) by meaning — mirroring the existing n8n/Telegram
// bot's semantic search. The Anthropic API key never leaves this server-side
// function.

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type KbRow = {
  id: number;
  category: string;
  title: string;
  question: string;
  answer: string;
  forbidden: string | null;
  example_good: string | null;
  example_bad: string | null;
  keywords: string;
  priority: number;
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) {
      return json({ error: 'ANTHROPIC_API_KEY is not configured' }, 500);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) {
      return json({ error: 'Supabase server credentials are not configured' }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const question: string = (body?.question ?? '').toString().trim();
    const telegramChatId: string | null = body?.telegramChatId ? String(body.telegramChatId) : null;
    const fullName: string | null = body?.fullName ? String(body.fullName) : null;

    if (!question) {
      return json({ error: 'question is required' }, 400);
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const logQuery = async (status: 'matched' | 'ambiguous' | 'no_match', matchedTitle: string | null) => {
      try {
        await supabase.from('kb_queries').insert({
          telegram_chat_id: telegramChatId,
          full_name: fullName,
          question,
          matched_title: matchedTitle,
          status,
        });
      } catch {
        // Logging failures must never break the actual search response.
      }
    };

    const { data: rows, error } = await supabase
      .from('knowledge_base')
      .select('id, category, title, question, answer, forbidden, example_good, example_bad, keywords, priority')
      .eq('is_active', true)
      .order('priority', { ascending: true });

    if (error) {
      return json({ error: `Failed to load knowledge base: ${error.message}` }, 500);
    }

    const entries = (rows ?? []) as KbRow[];

    if (entries.length === 0) {
      await logQuery('no_match', null);
      return json({ result: 'no_match' });
    }

    // Compact catalogue for the model — id + searchable fields only, answer
    // text kept short so the prompt stays small; full content is re-fetched
    // by id afterwards so nothing has to be reproduced by the model.
    const catalogue = entries.map((e) => ({
      id: e.id,
      category: e.category,
      title: e.title,
      question: e.question,
      keywords: e.keywords,
      priority: e.priority,
    }));

    const systemPrompt = `Ты — помощник службы безопасности и сервиса премиум жилого комплекса. Твоя задача — найти в базе знаний статью (или несколько), которая по смыслу отвечает на вопрос сотрудника. Сопоставляй по смыслу, а не по точному совпадению текста.

Правила ответа:
- Если есть ОДНА статья, которая уверенно и точно отвечает на вопрос — верни её id как единственного кандидата с высокой уверенностью.
- Если вопрос слишком общий или подходят НЕСКОЛЬКО статей примерно одинаково — верни до 4 кандидатов.
- Если ни одна статья не относится к вопросу по смыслу — верни пустой список кандидатов.

Ответь СТРОГО в формате JSON без пояснений и без markdown-разметки, в виде:
{"candidates": [{"id": число, "confidence": "high" | "medium"}]}

Если ничего не подходит: {"candidates": []}`;

    const userPrompt = `Вопрос сотрудника: "${question}"\n\nСтатьи базы знаний (JSON):\n${JSON.stringify(catalogue)}`;

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!claudeResponse.ok) {
      const errText = await claudeResponse.text();
      return json({ error: `Claude API error: ${errText}` }, 502);
    }

    const claudeData = await claudeResponse.json();
    const textBlock = claudeData?.content?.[0]?.text ?? '{}';

    let parsed: { candidates?: { id: number; confidence: string }[] };
    try {
      const cleaned = textBlock.trim().replace(/^```json\s*|\s*```$/g, '');
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { candidates: [] };
    }

    const candidateIds = (parsed.candidates ?? [])
      .map((c) => c.id)
      .filter((id) => entries.some((e) => e.id === id));

    if (candidateIds.length === 0) {
      await logQuery('no_match', null);
      return json({ result: 'no_match' });
    }

    const highConfidenceSingle =
      candidateIds.length === 1 &&
      parsed.candidates?.[0]?.confidence === 'high';

    if (highConfidenceSingle || candidateIds.length === 1) {
      const match = entries.find((e) => e.id === candidateIds[0]);
      await logQuery('matched', match?.title ?? null);
      return json({ result: 'match', article: match });
    }

    const candidates = candidateIds
      .map((id) => entries.find((e) => e.id === id))
      .filter(Boolean)
      .map((e) => ({ id: e!.id, title: e!.title, category: e!.category }));

    await logQuery('ambiguous', candidates.map((c) => c.title).join(', '));
    return json({ result: 'candidates', candidates });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}
