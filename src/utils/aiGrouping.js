const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

/**
 * Calls the Anthropic API to pick 3 focus tasks from the todo list.
 * Pass `fallback: true` (or leave apiKey null) to use rule-based selection instead.
 *
 * @param {{ tasks: Array, apiKey: string|null, fallback?: boolean }}
 * @returns {Promise<{ focusIds: string[], rationale: string }>}
 */
export async function groupTasksWithAI({ tasks, apiKey, fallback = false }) {
  // Explicit fallback flag: use rule-based selection without calling the API
  if (fallback) {
    return ruleBasedFocus(tasks);
  }

  if (!apiKey || !apiKey.trim()) throw new Error("Anthropic API key is required");

  const undone = tasks.filter((t) => !t.done);
  const taskList = undone
    .map((t) => `${t.id}: [${t.priority}] ${t.text}`)
    .join("\n");

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-calls": "true",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `You are helping a pregnant person organise their pre-baby todo list.
Here are their tasks:
${taskList}

Pick the 3 most actionable tasks right now. Prefer undone high-priority tasks. Aim for variety — ideally tasks from different life areas (nursery prep, admin/paperwork, health, shopping, relationships).
Return valid JSON only, no markdown:
{"focusIds":["id1","id2","id3"],"rationale":"one sentence explanation"}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  return JSON.parse(data.content[0].text);
}

/** Rule-based fallback: pick 1 high + 1 medium + 1 low priority undone task */
function ruleBasedFocus(tasks) {
  const undone = tasks.filter((t) => !t.done);
  const pick = (priority) => undone.find((t) => t.priority === priority);

  const high = pick("high");
  const medium = pick("medium");
  const low = pick("low");

  const focusIds = [high, medium, low]
    .filter(Boolean)
    .slice(0, 3)
    .map((t) => t.id);

  // Fill up to 3 if some priorities are missing
  if (focusIds.length < 3) {
    for (const t of undone) {
      if (!focusIds.includes(t.id)) focusIds.push(t.id);
      if (focusIds.length >= 3) break;
    }
  }

  return {
    focusIds,
    rationale: "Selected one task from each priority level to keep things manageable.",
  };
}
