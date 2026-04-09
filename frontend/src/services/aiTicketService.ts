import type { TicketAudience, TicketCategory } from "./ticketService";

type ChatRole = "user" | "assistant";

export interface TicketDraftResult {
  subject: string;
  message: string;
  category?: TicketCategory;
  audience?: TicketAudience;
  detectedLanguage?: string;
  assistantReply: string;
  source?: "openai" | "fallback";
}

export interface DraftTicketParams {
  userInput: string;
  conversation?: Array<{
    role: ChatRole;
    content: string;
  }>;
  currentForm?: {
    category?: TicketCategory;
    audience?: TicketAudience;
    subject?: string;
    message?: string;
  };
}

const DEFAULT_MODEL = import.meta.env.VITE_OPENAI_MODEL || "gpt-4.1-mini";
const OPENAI_API_URL =
  import.meta.env.VITE_OPENAI_API_URL || "https://api.openai.com/v1/chat/completions";

const ticketCategories: TicketCategory[] = [
  "IT_SUPPORT",
  "FACILITIES",
  "ACADEMIC",
  "ROOM_BOOKING",
  "GENERAL_INQUIRY",
];

const ticketAudiences: TicketAudience[] = ["STUDENT", "STAFF"];

const SYSTEM_INSTRUCTION = `You are an AI assistant for a university support portal.
You help users write better support tickets from multilingual input, including code-mixed language (for example Sinhala + English, Tamil + English, Hinglish, etc.).

Rules:
1) Understand the user text even when mixed-language.
2) Always rewrite output in professional English.
3) Produce a clear, concise ticket subject.
4) Produce a simple, clean ticket message in plain professional English.
5) Do not copy raw user text as-is when it is informal or mixed-language; rewrite it cleanly.
6) Avoid repetition in both subject and message.
5) Infer category and audience only from the allowed values. If uncertain, choose GENERAL_INQUIRY and STUDENT.
6) Include a short assistant-style response telling the user what was prepared.
7) Output valid JSON only, no markdown and no code fences.

Allowed category values: IT_SUPPORT, FACILITIES, ACADEMIC, ROOM_BOOKING, GENERAL_INQUIRY
Allowed audience values: STUDENT, STAFF

Return JSON object with exactly these keys:
{
  "subject": string,
  "message": string,
  "category": "IT_SUPPORT" | "FACILITIES" | "ACADEMIC" | "ROOM_BOOKING" | "GENERAL_INQUIRY",
  "audience": "STUDENT" | "STAFF",
  "detectedLanguage": string,
  "assistantReply": string
}`;

const truncate = (value: string, maxLength: number): string => {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
};

const normalizeText = (value: string): string => value.replace(/\r\n/g, "\n").trim();

const buildContextText = (params: DraftTicketParams): string => {
  const conversationUsers = (params.conversation || [])
    .filter((item) => item.role === "user")
    .map((item) => item.content.trim())
    .filter(Boolean)
    .slice(-3);

  return [...conversationUsers, params.userInput.trim()].filter(Boolean).join("\n");
};

const getLatestUserText = (params: DraftTicketParams): string => {
  const input = params.userInput?.trim();
  if (input) {
    return input;
  }

  const fromConversation = [...(params.conversation || [])]
    .reverse()
    .find((item) => item.role === "user" && item.content.trim().length > 0);

  return fromConversation?.content.trim() || "Need support assistance";
};

const toSentenceCase = (value: string): string => {
  const cleaned = value.trim().replace(/\s+/g, " ");
  if (!cleaned) {
    return "";
  }
  return `${cleaned.charAt(0).toUpperCase()}${cleaned.slice(1)}`;
};

const collapseRepeatedText = (value: string): string => {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "";
  }

  const words = normalized.split(" ");
  if (words.length >= 6 && words.length % 2 === 0) {
    const half = words.length / 2;
    const firstHalf = words.slice(0, half).join(" ").toLowerCase();
    const secondHalf = words.slice(half).join(" ").toLowerCase();
    if (firstHalf === secondHalf) {
      return words.slice(0, half).join(" ");
    }
  }

  return normalized;
};

const normalizeRomanizedToEnglish = (value: string): string => {
  let output = collapseRepeatedText(value);

  const replacements: Array<[RegExp, string]> = [
    [/\b(ennaku|enaku|enakku|enaka)\b/gi, "I"],
    [/\b(venum|venam|want|needu)\b/gi, "need"],
    [/\b(naaliku|naliku|naalaiku|tomoro|tmrw)\b/gi, "tomorrow"],
    [/\b(leavu|leaveu|leevu)\b/gi, "leave"],
    [/\b(exam ku|examkku|for exam)\b/gi, "for the exam"],
    [/\b(vara madden|vara mudiyathu|vara mudiyala|cannot come|cant come)\b/gi, "cannot attend"],
    [/\b(enna panna|enna pananum|what to do|how to do)\b/gi, "how to proceed"],
    [/\b(login issue|log in issue|login problem)\b/gi, "login issue"],
    [/\b(machan|bro|pls|plz)\b/gi, ""],
  ];

  replacements.forEach(([pattern, replacement]) => {
    output = output.replace(pattern, replacement);
  });

  return collapseRepeatedText(output);
};

const buildDetailsLine = (normalizedInput: string, category: TicketCategory): string => {
  const q = normalizedInput.toLowerCase();

  if (/leave/.test(q) && /exam|class|lecture/.test(q)) {
    return "I am requesting leave for tomorrow because I am unable to attend the exam.";
  }

  if (/login issue|unable to log in|cannot log in|log in/.test(q) && category === "IT_SUPPORT") {
    return "I am unable to log in to the university portal and cannot access my account.";
  }

  return toSentenceCase(normalizedInput) || "The user reported a support issue and requested assistance.";
};

const inferIssueHeadline = (text: string, category?: TicketCategory): string => {
  const q = text.toLowerCase();

  if (/leave/.test(q) && /exam|class|lecture/.test(q)) {
    return "Leave Request for Academic Activity";
  }

  if (/login|log in|sign in|signin|can't log|cannot log|unable to log/.test(q)) {
    return "Unable to Log In to the Portal";
  }
  if (/password|reset password|otp/.test(q)) {
    return "Password Access Issue";
  }
  if (/wifi|internet|network/.test(q)) {
    return "Internet Connectivity Issue on Campus";
  }
  if (/room|hall|classroom|reservation|booking/.test(q)) {
    return "Room Booking Support Request";
  }
  if (/exam|assignment|grade|module|lecture|academic/.test(q)) {
    return "Academic Support Request";
  }
  if (/ac|air|water|electric|maintenance|facility|toilet|door|fan/.test(q)) {
    return "Facilities Maintenance Request";
  }

  switch (category) {
    case "IT_SUPPORT":
      return "IT Support Request";
    case "ROOM_BOOKING":
      return "Room Booking Assistance Needed";
    case "ACADEMIC":
      return "Academic Issue Support Request";
    case "FACILITIES":
      return "Facilities Support Request";
    default:
      return "General Support Request";
  }
};

const inferImpactLine = (category: TicketCategory): string => {
  switch (category) {
    case "IT_SUPPORT":
      return "This issue is preventing access to required systems and affecting normal study/work activities.";
    case "ROOM_BOOKING":
      return "This issue is affecting scheduling and availability of required campus spaces.";
    case "ACADEMIC":
      return "This issue is affecting coursework, class participation, or academic progress.";
    case "FACILITIES":
      return "This issue is affecting the safety, comfort, or usability of campus facilities.";
    default:
      return "This issue is affecting normal university activities and requires support.";
  }
};

const buildProfessionalBody = (input: string, category: TicketCategory): string => {
  const normalizedInput = normalizeRomanizedToEnglish(input);
  const detailsLine = buildDetailsLine(normalizedInput, category);

  const requestLine = /leave/.test(normalizedInput.toLowerCase())
    ? "Please guide me on the leave approval process and required next steps."
    : "Please investigate this issue and provide the required resolution steps.";

  return [
    `Issue: ${inferIssueHeadline(normalizedInput, category)}.`,
    "",
    `Details: ${detailsLine}`,
    "",
    `Impact: ${inferImpactLine(category)}`,
    "",
    `Request: ${requestLine}`,
  ].join("\n");
};

const isLowQualityDraft = (subject: string, message: string, sourceInput: string): boolean => {
  const normalizedInput = sourceInput.toLowerCase().replace(/\s+/g, " ").trim();
  const normalizedSubject = subject.toLowerCase().replace(/\s+/g, " ").trim();
  const normalizedMessage = message.toLowerCase().replace(/\s+/g, " ").trim();

  const lines = message
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const uniqueLineCount = new Set(lines.map((line) => line.toLowerCase())).size;

  const copiesInput =
    normalizedInput.length > 0 &&
    (normalizedSubject === normalizedInput || normalizedMessage.includes(normalizedInput));

  const repeatedMessage = lines.length >= 2 && uniqueLineCount <= 2;
  const tooShort = subject.trim().length < 8 || message.trim().length < 40;

  return copiesInput || repeatedMessage || tooShort;
};

const looksLikeErrorPayload = (value: string): boolean => {
  const q = value.toLowerCase();
  return (
    q.includes('"error"') ||
    q.includes("resource_exhausted") ||
    q.includes("insufficient_quota") ||
    q.includes("rate_limit_exceeded") ||
    q.includes("quota") ||
    q.includes("rate limit") ||
    q.includes("you exceeded your current quota")
  );
};

const pickCategoryFromText = (
  text: string,
  fallbackCategory: TicketCategory = "GENERAL_INQUIRY"
): TicketCategory => {
  const q = text.toLowerCase();

  if (/wifi|internet|network|system|portal|login|password|computer|software|printer/.test(q)) {
    return "IT_SUPPORT";
  }
  if (/room|hall|classroom|lab booking|reservation|reserve/.test(q)) {
    return "ROOM_BOOKING";
  }
  if (/lecture|course|exam|assignment|module|grade|academic|timetable/.test(q)) {
    return "ACADEMIC";
  }
  if (/clean|electric|water|ac|air|fan|door|maintenance|facility|building|toilet/.test(q)) {
    return "FACILITIES";
  }

  return fallbackCategory;
};

const pickAudienceFromText = (
  text: string,
  fallbackAudience: TicketAudience = "STUDENT"
): TicketAudience => {
  const q = text.toLowerCase();
  if (/staff|lecturer|admin office|non academic|faculty/.test(q)) {
    return "STAFF";
  }
  if (/student|undergrad|postgrad/.test(q)) {
    return "STUDENT";
  }
  return fallbackAudience;
};

const buildFallbackDraft = (
  params: DraftTicketParams,
  options?: { reason?: string; aiText?: string }
): TicketDraftResult => {
  const input = normalizeText(getLatestUserText(params));
  const form = params.currentForm || {};
  const normalizedInput = normalizeRomanizedToEnglish(input);

  const category = pickCategoryFromText(input, form.category || "GENERAL_INQUIRY");
  const audience = pickAudienceFromText(input, form.audience || "STUDENT");
  const subject =
    truncate(inferIssueHeadline(normalizedInput || input, category), 80) || "General Support Request";

  const isQuotaIssue =
    (options?.reason || "").toLowerCase().includes("quota") ||
    (options?.aiText ? looksLikeErrorPayload(options.aiText) : false);

  const messageSource =
    options?.aiText &&
    options.aiText.trim().length > 30 &&
    !looksLikeErrorPayload(options.aiText)
      ? options.aiText.trim()
      : normalizedInput || input;

  const message = buildProfessionalBody(messageSource || "User requested support.", category);

  const assistantReply = isQuotaIssue
    ? "OpenAI quota is currently exceeded. I created a local draft from your message, please review and submit."
    : options?.reason
      ? "I prepared a ticket draft from your message. AI response was temporarily unstable, so please review and submit."
      : "I prepared a ticket draft from your message. Please review and submit.";

  return {
    subject,
    message,
    category,
    audience,
    detectedLanguage: "auto",
    assistantReply,
    source: "fallback",
  };
};

const cleanJsonText = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed.startsWith("```") && !trimmed.endsWith("```")) {
    return trimmed;
  }

  return trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
};

const safeJsonParse = (value: string): Record<string, unknown> | null => {
  try {
    return JSON.parse(cleanJsonText(value));
  } catch {
    return null;
  }
};

const tryExtractJson = (value: string): Record<string, unknown> | null => {
  const direct = safeJsonParse(value);
  if (direct) {
    return direct;
  }

  const cleaned = cleanJsonText(value);
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return safeJsonParse(cleaned.slice(firstBrace, lastBrace + 1));
  }

  return null;
};

const asTicketCategory = (value: unknown): TicketCategory | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }
  return ticketCategories.includes(value as TicketCategory)
    ? (value as TicketCategory)
    : undefined;
};

const asTicketAudience = (value: unknown): TicketAudience | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }
  return ticketAudiences.includes(value as TicketAudience)
    ? (value as TicketAudience)
    : undefined;
};

const buildPrompt = (params: DraftTicketParams): string => {
  const conversation = (params.conversation || [])
    .slice(-8)
    .map((item) => `${item.role.toUpperCase()}: ${item.content}`)
    .join("\n");

  return [
    SYSTEM_INSTRUCTION,
    "",
    "Current ticket form values:",
    JSON.stringify(params.currentForm || {}, null, 2),
    "",
    "Recent conversation:",
    conversation || "(no conversation yet)",
    "",
    "Latest user request:",
    params.userInput,
  ].join("\n");
};

const getCandidateText = (data: any): string | null => {
  const content = data?.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content.trim() || null;
  }

  if (Array.isArray(content)) {
    const text = content
      .map((part: any) => (typeof part?.text === "string" ? part.text : ""))
      .join("\n")
      .trim();

    return text || null;
  }

  return null;
};

export const aiTicketService = {
  async draftTicket(params: DraftTicketParams): Promise<TicketDraftResult> {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (!apiKey) {
      return buildFallbackDraft(params, { reason: "Missing OpenAI API key" });
    }

    try {
      const response = await fetch(
        OPENAI_API_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: DEFAULT_MODEL,
            messages: [
              { role: "system", content: SYSTEM_INSTRUCTION },
              { role: "user", content: buildPrompt(params) },
            ],
            temperature: 0.25,
            response_format: { type: "json_object" },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        const reason =
          response.status === 429 || looksLikeErrorPayload(errorText)
            ? "OpenAI quota exceeded"
            : "OpenAI request failed";

        return buildFallbackDraft(params, {
          reason,
        });
      }

      const data = await response.json();
      const rawText = getCandidateText(data);
      if (!rawText) {
        return buildFallbackDraft(params, {
          reason: "OpenAI returned empty content",
        });
      }

      const parsed = tryExtractJson(rawText);
      if (!parsed) {
        return buildFallbackDraft(params, {
          reason: "OpenAI returned non-JSON content",
          aiText: rawText,
        });
      }

      const subject = typeof parsed.subject === "string" ? parsed.subject.trim() : "";
      const message = typeof parsed.message === "string" ? parsed.message.trim() : "";

      if (!subject || !message || subject.length < 4 || message.length < 15) {
        return buildFallbackDraft(params, {
          reason: "OpenAI JSON missed required fields",
          aiText: rawText,
        });
      }

      const assistantReply =
        typeof parsed.assistantReply === "string" && parsed.assistantReply.trim().length > 0
          ? parsed.assistantReply.trim()
          : "I drafted a ticket summary for you. Please review and submit.";

      const contextInput = normalizeText(buildContextText(params) || params.userInput || "");
      const cleanedInput = normalizeRomanizedToEnglish(contextInput || getLatestUserText(params));
      const finalCategory = asTicketCategory(parsed.category) || pickCategoryFromText(cleanedInput);
      const finalSubject = isLowQualityDraft(subject, message, contextInput)
        ? truncate(inferIssueHeadline(cleanedInput, finalCategory), 80)
        : subject;
      const finalMessage = isLowQualityDraft(subject, message, contextInput)
        ? buildProfessionalBody(cleanedInput, finalCategory)
        : message;

      return {
        subject: finalSubject,
        message: finalMessage,
        category: asTicketCategory(parsed.category),
        audience: asTicketAudience(parsed.audience),
        detectedLanguage:
          typeof parsed.detectedLanguage === "string" ? parsed.detectedLanguage : undefined,
        assistantReply,
        source: "openai",
      };
    } catch {
      return buildFallbackDraft(params, {
        reason: "Network or parsing failure",
      });
    }
  },
};

export default aiTicketService;