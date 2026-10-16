// Shared by the agents that wake alone (ADR 0005, 0006): one model call, GitHub calls, one
// comment. No dependencies: Node 22's fetch is enough.

// Anthropic's Messages API, or any OpenAI-compatible chat endpoint. Default: Google AI Studio's
// free tier (README).
const BASE_URL = (process.env.MODEL_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai').replace(/\/$/, '');
export const MODEL = process.env.MODEL_NAME || 'gemini-flash-lite-latest';
const ANTHROPIC = BASE_URL.includes('api.anthropic.com');

function request(key, system, user) {
  if (ANTHROPIC) {
    return fetch(`${BASE_URL}/v1/messages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODEL, max_tokens: 4000, system, messages: [{ role: 'user', content: user }] }),
    });
  }
  return fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
}

export async function ask(system, user, { tries = 4 } = {}) {
  const key = process.env.MODEL_API_KEY;
  if (!key) throw new Error('no model key (secret MODEL_API_KEY is empty)');
  let last;
  for (let i = 0; i < tries; i++) {
    const res = await request(key, system, user);
    if (res.ok) {
      const j = await res.json();
      const text = ANTHROPIC
        ? j.content?.filter((b) => b.type === 'text').map((b) => b.text).join('')
        : j.choices?.[0]?.message?.content;
      if (typeof text === 'string' && text.trim()) return text;
      last = 'model returned no text';
    } else {
      last = `model HTTP ${res.status}: ${(await res.text()).slice(0, 200).replace(/\s+/g, ' ')}`;
      if (res.status !== 429 && res.status < 500) break;
    }
    await new Promise((r) => setTimeout(r, 2000 * 2 ** i));
  }
  throw new Error(last);
}

export async function gh(path, init = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${process.env.GH_TOKEN}`,
      'x-github-api-version': '2022-11-28',
      ...(init.body ? { 'content-type': 'application/json' } : {}),
    },
  });
  if (!res.ok) throw new Error(`GitHub ${init.method ?? 'GET'} ${path.split('?')[0]}: HTTP ${res.status}`);
  return res.status === 204 ? null : res.json();
}

export function comment(repo, number, body) {
  return gh(`/repos/${repo}/issues/${number}/comments`, { method: 'POST', body: JSON.stringify({ body }) });
}
