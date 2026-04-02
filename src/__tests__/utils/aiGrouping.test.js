import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { groupTasksWithAI } from "../../utils/aiGrouping.js";

const MOCK_TASKS = [
  { id: "t1", text: "Buy crib", priority: "high", done: false },
  { id: "t2", text: "Pack hospital bag", priority: "medium", done: false },
  { id: "t3", text: "Install car seat", priority: "high", done: false },
  { id: "t4", text: "Write birth plan", priority: "low", done: false },
];

const MOCK_RESPONSE = {
  content: [{ text: '{"focusIds":["t1","t2","t4"],"rationale":"Covering nursery, health, and paperwork areas."}' }],
};

function mockFetch(body = MOCK_RESPONSE, status = 200) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
}

describe("groupTasksWithAI", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls the Anthropic API endpoint", async () => {
    mockFetch();
    await groupTasksWithAI({ tasks: MOCK_TASKS, apiKey: "sk-test" });
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.anthropic.com/v1/messages",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("sends the correct anthropic-version header", async () => {
    mockFetch();
    await groupTasksWithAI({ tasks: MOCK_TASKS, apiKey: "sk-test" });
    const [, options] = global.fetch.mock.calls[0];
    const headers = options.headers;
    expect(headers["anthropic-version"]).toBe("2023-06-01");
  });

  it("sends the api key as x-api-key header", async () => {
    mockFetch();
    await groupTasksWithAI({ tasks: MOCK_TASKS, apiKey: "sk-ant-123" });
    const [, options] = global.fetch.mock.calls[0];
    expect(options.headers["x-api-key"]).toBe("sk-ant-123");
  });

  it("includes task ids, priorities, and text in the prompt", async () => {
    mockFetch();
    await groupTasksWithAI({ tasks: MOCK_TASKS, apiKey: "sk-test" });
    const [, options] = global.fetch.mock.calls[0];
    const body = JSON.parse(options.body);
    const prompt = body.messages[0].content;
    expect(prompt).toContain("t1");
    expect(prompt).toContain("high");
    expect(prompt).toContain("Buy crib");
  });

  it("returns parsed focusIds array and rationale string", async () => {
    mockFetch();
    const result = await groupTasksWithAI({ tasks: MOCK_TASKS, apiKey: "sk-test" });
    expect(result.focusIds).toEqual(["t1", "t2", "t4"]);
    expect(result.rationale).toContain("nursery");
  });

  it("throws when apiKey is missing or empty", async () => {
    await expect(groupTasksWithAI({ tasks: MOCK_TASKS, apiKey: "" })).rejects.toThrow();
    await expect(groupTasksWithAI({ tasks: MOCK_TASKS })).rejects.toThrow();
  });

  it("throws when the API returns a non-200 status", async () => {
    mockFetch({ error: { message: "Unauthorized" } }, 401);
    await expect(
      groupTasksWithAI({ tasks: MOCK_TASKS, apiKey: "sk-bad" })
    ).rejects.toThrow();
  });

  it("falls back to rule-based selection when no apiKey provided", async () => {
    // Rule-based: no fetch called, picks 1 high + 1 medium + 1 low
    const tasks = [
      { id: "h1", text: "High task", priority: "high", done: false },
      { id: "m1", text: "Medium task", priority: "medium", done: false },
      { id: "l1", text: "Low task", priority: "low", done: false },
    ];
    const result = await groupTasksWithAI({ tasks, apiKey: null, fallback: true });
    expect(result.focusIds).toHaveLength(3);
    expect(result.focusIds).toContain("h1");
    expect(result.focusIds).toContain("m1");
    expect(result.focusIds).toContain("l1");
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
