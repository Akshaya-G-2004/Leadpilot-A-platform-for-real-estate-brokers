# LeadPilot — “A real buddy for any real estate broker”

---

## 1. What Was Built
Real estate brokers receive dozens of messy inquiries daily across WhatsApp, portals, and phone calls. LeadPilot streamlines this entire workflow into an intuitive, high-velocity cockpit:

- **Dashboard**: High-level sales overview showing total leads, priority breakdown, urgent buyers, and upcoming visits.
- **Lead Intake (Popup)**: Form to add leads manually or paste messy text to auto-fill fields with AI in 1 click.
- **Lead Copilot**: Main 3-column daily workspace:
  - **Lead List (Left)**: Search and filter leads by priority (High, Medium, Low).
  - **Lead Center (Middle)**:
    - **Overview**: AI summary, signals, buyer objections, and 10-second voice brief.
    - **Call Prep**: 1-click WhatsApp dispatcher, tailored call questions, and Google Calendar scheduler.
    - **Call Outcome**: Log call status (Interested, Follow up, Visit scheduled).
  - **AI ChatBot (Right)**: Chat assistant grounded in the selected lead's budget and requirements.
- **Leads Directory**: Full CRM spreadsheet table to search and filter all leads for easy data managment
- **Calendar**: Month grid and agenda view of scheduled client site visits.

### Features :
- Intakes unstructured customer inquiries
- Analyzes buyer psychology, timelines, and budgets
- Ranks and prioritizes prospects
- Context-Aware AI Assistant Bot:
- 1-click personalized WhatsApp dispatcher
- Interactive site visit scheduling

---

## 2. Core Requirements Implemented
- **Lead Intake**: Form to collected the needed information along with a automatic form filling option
- **Comprehensive AI Analysis**:
  - Evaluates Lead Summary, Customer Intent, Key Requirements, Potential Objections, Recommended Next Action, and a Suggested Response.
  - Generates granular engagement signals: Intent Strength, Timeline Urgency, Budget Clarity, and Engagement Quality.
- **Context-Grounded Conversational AI Chatbot**:
  - Chat assistant with strict prompt grounding on the active lead detailes for customized answers
  - Quick prompt shortcuts (e.g. "What should I emphasize on the call?")
  - Chat history permanently stored in database.
- **Lead Prioritization & Persistence**:
  - Full persistence using Turso SQLite (libSQL).
  - Hybrid Lead Scoring Formula (0–100): `Score=round((Intent×0.30+Timeline×0.45+Budget×0.10+Engagement×0.15)×10)`
  - Color-coded priority tag for high ,low , medium

---

## 3. Own Features Included
- **🌟 Feature 1: 1-Click WhatsApp Dispatcher**
  - Generates a personalized opening message referencing their specific locality and BHK, leaving out awkward placeholders. And also about schedules about meeting
  - A one-click button launches WhatsApp directly with the drafted message pre-filled.
- **🌟 Feature 2: Smart Site Visit Scheduler + Google Calendar Sync**
  - Our website Automatically calculates recommended visit offsets . Provides a 1-click "Add to Google Calendar" button with property details pre-filled.
  - Dedicated interactive Calendar View in website along with a message that can be sent to whatsapp about reschedule with 1- click
- **🌟 Feature 3 : Leads Directory (Centralized CRM Table)**
  - A full CRM spreadsheet view allowing brokers to search, sort, and multi-filter all historical leads by priority status and tags for effortless pipeline data management.
- **🌟 Feature 4: Spoken Audio Brief Player**
  - Brokers spend half their day driving between client properties. Built-in text-to-speech audio player speaks a 10-second high-density brief of the customer's needs and objections.
- **🌟 Feature 5: Dynamic Discovery Questions Generator**
  - Generates 3 tailored, context-specific qualification questions per lead (e.g. asking about Vastu/direction if mentioned, loan pre-approval for urgent leads, or tech park proximity).

---

## 4. Architecture & Technical Stack

### Frontend & App Framework
- **Next.js 15 (App Router)**: Full-stack framework handling both the frontend UI and backend API routes in one place.
- **Turbopack**: High-speed bundler for instant development startup and sub-second page reloads.
- **React 19**: Builds the interactive broker dashboard, lead cards, and chat panels using state hooks.
- **TypeScript**: Ensures type safety across all database records, AI schemas, and UI components
- **Zod**: Schema validation library that strictly validates raw AI JSON responses to ensure no missing fields or malformed data reach the UI or database.
- **Tailwind CSS**: Quickly styles responsive dashboard layouts and UI design
- **Database & Persistence**: Turso Edge SQLite
- **AI Engine & Multi-Provider Fallback**:
  - **Primary**: Groq API openai/gpt-oss-120b model with JSON Mode
  - **Secondary**: Google Gemini Flash as gemini-2.0-flash Called directly via Google’s official REST API endpoint
- **Audio & Calendar**: Web Speech API Synthesis + RFC 5545 URL generation.

---

## 5. How to Run Locally (Step-by-Step)

```bash
# 1. Clone repository
git clone https://github.com/<your-username>/leadpilot.git
cd leadpilot

# 2. Install dependencies
npm install

# 3. Configure environment (.env.local)
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b
GEMINI_API_KEY=your_gemini_api_key
TURSO_DATABASE_URL=file:./data/chat.db

# 4. Start development server
npm run dev
```

---

## 6. Key Technical Decisions
- **Multi-Tier AI Fallback**: Real-time sales apps cannot freeze if one LLM provider hits rate limits. Groq provides blazing-fast 0.15s responses; Gemini provides deep reasoning backup; deterministic rules ensure zero downtime.
- **Database Choice: Turso (Cloud Edge SQLite)**: We chose Turso as our primary database with raw SQL instead of heavy ORMs , allowing easy local development without installing external database software.
- **Contextual RAG Chat via Structured Lead Record**: Every question asked in the chat sends the customer's full profile (budget, BHK, location, ..) directly to the AI, ensuring advice is tailored strictly to that specific deal rather than giving generic responses.

---

## 7. Future Improvements
- **AI Property & Site Recommendations**: Integrate real-time mapping and real-estate listings so the copilot can automatically recommend matching available properties near the required area .
- **Audio-to-Text Voice Note Intake (Speech-to-Text)**: Allow brokers on mobile to upload or record customer voice notes, transcribing .
- **Dynamic Timeline Aging & Auto-Prioritization**: Automatically upgrades leads from Medium to High priority as their planned moving month draws closer over time.
- **Make it mobile friendly**: Improve Features to handle on mobile and make it 100% mobile responsive

---

## 8. Known Limitations
- **Limited Rescheduling Options**: Generates 1-click Google Calendar visit links, but doesn't yet check for existing calendar schedule conflicts or automated customer rescheduling.
- **Not very mobile friendly**: the website is 80% good for mobile responsiveness but can be improved to 100%

---

## 9. AI Usage Disclosure
- **Claude & ChatGPT**: High-level system planning, initial  schema design, and foundational prompt engineering.
- **Google Antigravity**: Primary agentic AI coding assistant used during development end-to-end full-stack code implementation, Next.js UI component engineering, API routes, Turso / libSQL database integration, scoring logic refinement, bug fixing, and workflow features.
