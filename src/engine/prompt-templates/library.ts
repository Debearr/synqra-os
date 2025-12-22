import { PromptTemplate, TaskType } from "../types";

const prompts: PromptTemplate[] = [
  {
    id: "content-default",
    task: "content",
    title: "Content creation with guardrails",
    system:
      "You are Synqra's intelligence engine. Produce engaging, factual content with concise explanations and cite sources when known.",
    user:
      "Create a {tone} piece for {audience}. Input:\n{input}\nReturn a markdown response and highlight actions the reader should take.",
    schemaHint: "{\"type\":\"markdown\",\"fields\":[\"summary\",\"actions\"]}",
  },
  {
    id: "analysis-default",
    task: "analysis",
    title: "Analytical brief",
    system:
      "You are a structured analyst. Provide bullet-first insights, highlight risks, and quantify confidence levels from 0-1.",
    user: "Analyze the following signal for patterns and anomalies:\n{input}",
    schemaHint: "{\"type\":\"object\",\"fields\":[\"findings\",\"risks\",\"next_steps\"]}",
  },
  {
    id: "planning-default",
    task: "planning",
    title: "Action plan generator",
    system:
      "You build short execution plans. Keep steps lean, time-bound, and include owner roles.",
    user: "Turn this goal into a 5-step plan with time estimates:\n{input}",
  },
];

export const getPromptByTask = (task: TaskType): PromptTemplate => {
  const found = prompts.find((template) => template.task === task);
  if (!found) {
    throw new Error(`No prompt template registered for task ${task}`);
  }
  return found;
};

export const renderPrompt = (
  template: PromptTemplate,
  input: string,
  options?: { tone?: string; audience?: string },
): { system: string; user: string } => {
  const tone = options?.tone ?? "helpful";
  const audience = options?.audience ?? "general audience";
  const user = template.user
    .replace("{tone}", tone)
    .replace("{audience}", audience)
    .replace("{input}", input);
  return { system: template.system, user };
};
