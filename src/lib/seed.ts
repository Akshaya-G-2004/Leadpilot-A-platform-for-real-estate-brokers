// src/lib/seed.ts
import { v4 as uuidv4 } from "uuid";
import type { Lead, Analysis } from "./types";
import { deriveScores } from "./scoring";

/**
 * Helper to create a minimal Analysis object.
 * The values are illustrative – they satisfy the Zod schema.
 */
function makeAnalysis(overrides?: Partial<Analysis>): Analysis {
  const base: Analysis = {
    summary: "Customer is interested in a 2‑BHK near Whitefield, budget 80‑90 Lakh.",
    customer_intent: "Wants to buy within 3 months.",
    key_requirements: ["2 BHK", "near school", "good connectivity"],
    objections: [],
    recommended_next_action: "Send property list and schedule a site visit.",
    suggested_response: "Sure, I will share a shortlist of properties that match your criteria.",
    detected_language: "en",
    priority_reason: "High intent, clear budget and timeline.",
    signals: {
      intent_strength: 8,
      timeline_urgency: 7,
      budget_clarity: 9,
      engagement_quality: 8,
    },
    readiness: {
      budget: { status: "clear", note: "Exact budget provided" },
      location: { status: "clear", note: "Exact locality mentioned" },
      property_type: { status: "clear", note: "2 BHK required" },
      timeline: { status: "clear", note: "3‑month window" },
      decision_maker: { status: "clear", note: "Buyer is the decision maker" },
      questions_to_ask: ["Preferred floor?", "Ready to move?", "Financing options?"],
    },
    site_visit: {
      recommended: true,
      preferred_day_offsets: [2, 4, 7],
      preferred_time_of_day: "morning",
      reason: "Customer asked for a site visit soon.",
    },
    spoken_brief: "Rohit wants a 2 BHK near Whitefield within 3 months, watch out for budget ceiling, aim to confirm visit.",
    whatsapp_message: "Namaste Rohit, I have a few 2 BHK options near Whitefield that fit your budget. Shall we schedule a visit?",
  };
  return { ...base, ...overrides } as Analysis;
}

type LeadInput = {
  name: string;
  phone: string | null;
  location: string;
  property_requirement: string;
  budget: string;
  timeline: string;
  message: string;
  status: Lead["status"];
  analysis_json?: Analysis;
};

// Helper to build a lead with derived scores.
function makeLead(data: LeadInput): Lead {
  const analysis = data.analysis_json ?? makeAnalysis();
  const { score, tag, readiness_pct } = deriveScores(analysis.signals, analysis.readiness);
  return {
    id: uuidv4(),
    created_at: new Date().toISOString(),
    analysis_json: analysis,
    score,
    tag,
    readiness_pct,
    analysis_provider: "seed",
    name: data.name,
    phone: data.phone,
    location: data.location,
    property_requirement: data.property_requirement,
    budget: data.budget,
    timeline: data.timeline,
    message: data.message,
    status: data.status === "new" ? "New" : data.status,
  };
}

export const seedLeads: Lead[] = [
  makeLead({
    name: "Rohit Kumar",
    phone: "9876543210",
    location: "Whitefield, Bangalore",
    property_requirement: "2 BHK",
    budget: "85 Lakh",
    timeline: "3 months",
    message: "I am looking for a 2 BHK near Whitefield within 85 lakh. Can we schedule a visit?",
    status: "New",
    analysis_json: makeAnalysis({
      signals: { intent_strength: 8, timeline_urgency: 7, budget_clarity: 9, engagement_quality: 8 },
      readiness: {
        budget: { status: "clear", note: "85 Lakh budget stated" },
        location: { status: "clear", note: "Whitefield" },
        property_type: { status: "clear", note: "2 BHK" },
        timeline: { status: "clear", note: "3 months window" },
        decision_maker: { status: "clear", note: "Direct buyer" },
        questions_to_ask: ["Ready to move or under construction?", "Need parking space?"],
      },
      priority_reason: "High intent with clear budget and 3-month window.",
    }),
  }),
  makeLead({
    name: "Sneha Patel",
    phone: null,
    location: "HSR Layout, Bangalore",
    property_requirement: "3 BHK",
    budget: "1.2 Crore",
    timeline: "6 months",
    message: "Need a 3 BHK in HSR Layout, budget around 1.2 crore, not urgent.",
    status: "New",
    analysis_json: makeAnalysis({
      summary: "Customer looking for 3 BHK in HSR Layout, budget 1.2 Cr, flexible timeline.",
      signals: { intent_strength: 7, timeline_urgency: 5, budget_clarity: 8, engagement_quality: 6 },
      readiness: {
        budget: { status: "clear", note: "1.2 Crore" },
        location: { status: "clear", note: "HSR Layout" },
        property_type: { status: "clear", note: "3 BHK" },
        timeline: { status: "vague", note: "6 months (not urgent)" },
        decision_maker: { status: "vague", note: "Family co-decision" },
        questions_to_ask: ["Are you looking for gated community?", "Would you consider nearby areas?"],
      },
      priority_reason: "Clear budget and location, timeline flexible.",
    }),
  }),
  makeLead({
    name: "Anand Rao",
    phone: "9123456789",
    location: "Sarjapur Road",
    property_requirement: "Studio",
    budget: "45 Lakh",
    timeline: "Just exploring",
    message: "Can you show me any studio apartments? My budget is around 45 lakh.",
    status: "New",
    analysis_json: makeAnalysis({
      summary: "Exploring studio apartments on Sarjapur Road around 45 Lakh.",
      signals: {
        intent_strength: 5,
        timeline_urgency: 2,
        budget_clarity: 7,
        engagement_quality: 5,
      },
      readiness: {
        budget: { status: "clear", note: "45 Lakh" },
        location: { status: "clear", note: "Sarjapur Road" },
        property_type: { status: "clear", note: "Studio apartment" },
        timeline: { status: "missing", note: "Exploring phase, no timeline" },
        decision_maker: { status: "vague", note: "Evaluating investment" },
        questions_to_ask: ["Is this for investment or self-use?", "Expected rental yield?"],
      },
      priority_reason: "Medium intent, clear budget but vague timeline.",
    }),
  }),
  makeLead({
    name: "Lakshmi Devi",
    phone: "9988776655",
    location: "Electronic City",
    property_requirement: "1 BHK",
    budget: "30 Lakh",
    timeline: "Immediate",
    message: "I need a 1 BHK apartment, budget is 30 lakh, looking to visit soon.",
    status: "New",
    analysis_json: makeAnalysis({
      summary: "Immediate 1 BHK requirement in Electronic City within 30 Lakh.",
      signals: {
        intent_strength: 9,
        timeline_urgency: 9,
        budget_clarity: 8,
        engagement_quality: 7,
      },
      readiness: {
        budget: { status: "clear", note: "30 Lakh" },
        location: { status: "clear", note: "Electronic City" },
        property_type: { status: "clear", note: "1 BHK" },
        timeline: { status: "clear", note: "Immediate requirement" },
        decision_maker: { status: "clear", note: "Ready to visit" },
        questions_to_ask: ["Ready to move preferred?", "Can we visit this Saturday?"],
      },
      priority_reason: "Very high intent and immediate timeline.",
    }),
  }),
  makeLead({
    name: "Arun Sharma",
    phone: "9876501234",
    location: "Indiranagar",
    property_requirement: "2 BHK",
    budget: "1 Crore",
    timeline: "5-6 months",
    message: "Looking for a 2 BHK in Indiranagar, budget 1 Cr, maybe a visit.",
    status: "New",
    analysis_json: makeAnalysis({
      summary: "Looking for 2 BHK in Indiranagar within 1 Crore.",
      signals: { intent_strength: 7, timeline_urgency: 6, budget_clarity: 8, engagement_quality: 7 },
      readiness: {
        budget: { status: "clear", note: "1 Crore" },
        location: { status: "clear", note: "Indiranagar" },
        property_type: { status: "clear", note: "2 BHK" },
        timeline: { status: "vague", note: "5-6 months" },
        decision_maker: { status: "vague", note: "Evaluating options" },
        questions_to_ask: ["Do you prefer new launch or resale?", "Loan pre-approved?"],
      },
      priority_reason: "Premium locality inquiry with solid budget.",
    }),
  }),
  makeLead({
    name: "Priya Singh",
    phone: null,
    location: "Hebbal",
    property_requirement: "3 BHK",
    budget: "1.5 Crore",
    timeline: "12 months",
    message: "Just exploring options for 3 BHK in Hebbal, budget around 1.5 Cr.",
    status: "New",
    analysis_json: makeAnalysis({
      summary: "Long-term exploration for 3 BHK in Hebbal, 1.5 Cr budget.",
      signals: { intent_strength: 4, timeline_urgency: 3, budget_clarity: 7, engagement_quality: 4 },
      readiness: {
        budget: { status: "clear", note: "1.5 Crore" },
        location: { status: "clear", note: "Hebbal" },
        property_type: { status: "clear", note: "3 BHK" },
        timeline: { status: "missing", note: "12 months (long horizon)" },
        decision_maker: { status: "missing", note: "Early research phase" },
        questions_to_ask: ["When are you planning to visit Bangalore?", "Any preferred builder?"],
      },
      priority_reason: "Good budget but early exploration stage.",
    }),
  }),
  makeLead({
    name: "Vikram Patel",
    phone: "9123004567",
    location: "Whitefield",
    property_requirement: "2 BHK",
    budget: "80 Lakh",
    timeline: "Visit requested",
    message: "I would like to schedule a site visit for a 2 BHK in Whitefield next week.",
    status: "New",
    analysis_json: makeAnalysis({
      summary: "Site visit requested for 2 BHK in Whitefield, budget 80 Lakh.",
      signals: { intent_strength: 8, timeline_urgency: 8, budget_clarity: 8, engagement_quality: 8 },
      readiness: {
        budget: { status: "clear", note: "80 Lakh" },
        location: { status: "clear", note: "Whitefield" },
        property_type: { status: "clear", note: "2 BHK" },
        timeline: { status: "clear", note: "Next week visit requested" },
        decision_maker: { status: "clear", note: "Self decision" },
        questions_to_ask: ["Morning or afternoon slot?", "Will family be joining?"],
      },
      site_visit: {
        recommended: true,
        preferred_day_offsets: [1, 3],
        preferred_time_of_day: "afternoon",
        reason: "Customer explicitly asked for a visit.",
      },
      priority_reason: "Explicit visit request with clear budget.",
    }),
  }),
  makeLead({
    name: "Neha Joshi",
    phone: "9001122334",
    location: "Sarjapur Road",
    property_requirement: "3 BHK",
    budget: "1 Crore",
    timeline: "6 months",
    message: "Looking for a 3 BHK with good school nearby, budget 1 Cr, no major objections.",
    status: "New",
    analysis_json: makeAnalysis({
      summary: "Family looking for 3 BHK near schools in Sarjapur Road, 1 Cr budget.",
      signals: { intent_strength: 8, timeline_urgency: 6, budget_clarity: 8, engagement_quality: 7 },
      readiness: {
        budget: { status: "clear", note: "1 Crore" },
        location: { status: "clear", note: "Sarjapur Road" },
        property_type: { status: "clear", note: "3 BHK" },
        timeline: { status: "vague", note: "6 months" },
        decision_maker: { status: "clear", note: "Family decision with clear school criteria" },
        questions_to_ask: ["Which school curriculum preferred?", "Ready-to-move required?"],
      },
      priority_reason: "High intent family buyer with school proximity priority.",
    }),
  }),
];
