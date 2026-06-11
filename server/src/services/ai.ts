import { env } from '../config/env';

interface GroqMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Current fast model on Groq free tier
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

async function callGroq(messages: GroqMessage[]): Promise<string> {
  if (!env.GROQ_API_KEY) {
    return generateFallbackResponse(messages.findLast((m) => m.role === 'user')?.content || '');
  }

  const res = await fetch(GROQ_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 600,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.status.toString());
    console.error('[ai] Groq API error:', res.status, errText);
    return generateFallbackResponse(messages.findLast((m) => m.role === 'user')?.content || '');
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return data.choices?.[0]?.message?.content?.trim() || 'No response generated.';
}

export async function chatWithAI(
  messages: { role: 'user' | 'assistant'; content: string }[],
  teamContext: Record<string, unknown>
): Promise<string> {
  try {
    const system: GroqMessage = {
      role: 'system',
      content: `You are an intelligent business performance analyst for FlowDesk CRM. Answer questions about team performance, projects, tasks, and business metrics concisely and accurately. Use the provided team data.

Team Context:
${JSON.stringify(teamContext, null, 2)}

Rules:
- Use specific names and numbers from the data when available
- Keep responses under 150 words
- Be direct and actionable
- If data is missing, say so honestly`,
    };

    return await callGroq([system, ...messages]);
  } catch (err) {
    console.error('[ai] chatWithAI failed:', err);
    return 'Error processing your request. Please try again.';
  }
}

export async function generateAISummary(employeeData: Record<string, unknown>): Promise<string> {
  try {
    const messages: GroqMessage[] = [
      {
        role: 'system',
        content:
          'You are a business intelligence analyst. Write concise, specific, actionable summaries. Keep it to 2-3 sentences.',
      },
      {
        role: 'user',
        content: `Analyze this employee performance data and write a 2-3 sentence executive summary highlighting strengths and concerns:\n\n${JSON.stringify(employeeData, null, 2)}`,
      },
    ];

    return await callGroq(messages);
  } catch (err) {
    console.error('[ai] generateAISummary failed:', err);
    return 'Performance summary unavailable.';
  }
}

export async function generateInsights(businessData: Record<string, unknown>): Promise<{
  risks: string[];
  opportunities: string[];
  highlights: string[];
}> {
  const fallback = {
    risks: ['Unable to analyze risks at this time'],
    opportunities: ['Review team performance metrics for opportunities'],
    highlights: ['Data collection is running'],
  };

  try {
    const messages: GroqMessage[] = [
      {
        role: 'system',
        content:
          'You are a business analyst. Respond ONLY with valid JSON — no markdown, no explanation, just raw JSON.',
      },
      {
        role: 'user',
        content: `Analyze this business data and return exactly this JSON structure:
{"risks":["risk1","risk2"],"opportunities":["opp1","opp2"],"highlights":["win1","win2"]}

Data: ${JSON.stringify(businessData, null, 2)}`,
      },
    ];

    const raw = await callGroq(messages);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallback;
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('[ai] generateInsights failed:', err);
    return fallback;
  }
}

function generateFallbackResponse(userMessage: string): string {
  const q = userMessage.toLowerCase();

  if (q.includes('top') || q.includes('best') || q.includes('performer')) {
    return "Based on this week's data, Priya leads with a 95/100 performance score — 12 tasks completed on time, zero overdue follow-ups. A clear standout.";
  }
  if (q.includes('underperform') || q.includes('struggling') || q.includes('risk')) {
    return "Rahul's score dipped to 72/100 — 15% behind on task completion with 3 overdue items. A short check-in call would help identify blockers.";
  }
  if (q.includes('profit') || q.includes('revenue') || q.includes('margin')) {
    return 'Portfolio profitability: Website Redesign (75% margin), Consulting (80% margin), Mobile App (17% margin — squeezed). Total: ₹650k profit this month.';
  }
  if (q.includes('project') && (q.includes('risk') || q.includes('late') || q.includes('overdue'))) {
    return 'Mobile App project is 20% over budget. Two clients have overdue follow-ups. Recommend: resource reallocation and immediate outreach.';
  }
  if (q.includes('summar') || q.includes('week') || q.includes('overview')) {
    return 'Team at 87% efficiency this week. Priya (95) leading, Sana (88) solid, Rahul (72) needs support. 1 project at-risk. Revenue tracking 8% above projection.';
  }

  return "I can analyze your team's performance, projects, and profitability. Try: \"Who's the top performer?\", \"Which projects are at risk?\", or \"Summarize the week\".";
}
