// src/lib/types.ts
export type SignalSet = {
  intent_strength: number; // 0-10
  timeline_urgency: number; // 0-10
  budget_clarity: number; // 0-10
  engagement_quality: number; // 0-10
};

export type ReadinessField = {
  status: "clear" | "vague" | "missing";
  note: string;
};

export type Readiness = {
  budget: ReadinessField;
  location: ReadinessField;
  property_type: ReadinessField;
  timeline: ReadinessField;
  decision_maker: ReadinessField;
  questions_to_ask: string[];
};

export type SiteVisit = {
  recommended: boolean;
  preferred_day_offsets: number[]; // 1-14 if recommended
  preferred_time_of_day: string;
  reason: string;
};

export type Analysis = {
  summary: string;
  customer_intent: string;
  key_requirements: string[];
  objections: string[];
  recommended_next_action: string;
  suggested_response: string;
  detected_language: string;
  priority_reason: string;
  signals: SignalSet;
  readiness: Readiness;
  site_visit: SiteVisit;
  spoken_brief: string;
  whatsapp_message: string;
  notes?: string;
  scheduled_visit?: {
    dateString: string;
    timeString: string;
    isoStart: string;
    label: string;
  };
};

export type Lead = {
  id: string;
  created_at: string; // ISO string
  name: string;
  phone: string | null;
  location: string;
  property_requirement: string;
  budget: string;
  timeline: string;
  message: string;
  notes?: string | null;
  analysis_json: Analysis | null;
  score: number;
  tag: "high" | "medium" | "low" | "hot" | "warm" | "cold";
  readiness_pct: number;
  status: string;
  analysis_provider: "gemini" | "groq" | "seed";
};

