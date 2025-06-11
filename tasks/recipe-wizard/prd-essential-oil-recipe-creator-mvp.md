# Product Requirements Document: Essential Oil Recipe Creator MVP

## 1. Introduction/Overview

The Essential Oil Recipe Creator is an AI-powered, multi-step wizard that guides users through a personalized journey to discover essential oils that may help with their specific health concerns. This MVP covers the complete user journey from initial health concern input through suggested oils discovery (steps 1-6), providing a foundation for future expansion.

The system transforms a user's health concern into personalized essential oil recommendations through a structured workflow that combines **specialized AI agents** using OpenAI Agents JS SDK with user input validation. Each step is powered by domain-specific agents optimized for medical analysis, symptom correlation, therapeutic properties assessment, and oil recommendations. The feature is designed as a dashboard-integrated experience with mobile-first responsive design.

**Problem Statement:** Users seeking natural wellness solutions often struggle to identify which essential oils might help their specific health concerns, lacking the expertise to understand the connection between symptoms, causes, therapeutic properties, and appropriate oils.

**Solution Goal:** Provide an intelligent, guided experience that translates user health concerns into actionable essential oil recommendations through specialized AI agents with domain expertise.

## 2. Goals

### Primary Goals
1. **User Education & Empowerment:** Enable users to understand the holistic connections between their health concerns, potential causes, symptoms, and therapeutic approaches
2. **Personalized Recommendations:** Deliver tailored essential oil suggestions based on individual user profiles and specific health situations through specialized AI agents
3. **Technical Foundation:** Establish a scalable, maintainable architecture using specialized OpenAI Agents with domain expertise and YAML-based prompt management
4. **User Experience Excellence:** Provide an intuitive, mobile-first wizard experience integrated seamlessly into the dashboard

### Success Metrics
- **User Engagement:** 80% completion rate from health concern input to suggested oils
- **Technical Performance:** <2 second response times for AI-powered steps with specialized agents
- **User Satisfaction:** 4.5+ star rating for the guided experience
- **Data Quality:** 95% valid structured responses from specialized AI agents

## 3. User Stories

### Primary User Journey
**As a wellness-conscious user,** I want to discover essential oils that may help with my specific health concern, so that I can explore natural wellness options tailored to my situation.

### Detailed User Stories

#### Step 1: Health Concern Input
**As a user,** I want to describe my health concern in natural language, so that the system can understand my specific situation and provide relevant guidance.

#### Step 2: Demographics Collection
**As a user,** I want to provide my basic demographic information (age, gender), so that recommendations can be personalized to my profile.

#### Step 3: Potential Causes Selection
**As a user,** I want to review and select from AI-suggested potential causes for my health concern, so that I can help the system understand the underlying factors that may be contributing to my situation.

#### Step 4: Symptoms Identification
**As a user,** I want to identify relevant symptoms from an AI-generated list, so that the system can better understand my complete health picture.

#### Step 5: Therapeutic Properties Review
**As a user,** I want to understand what therapeutic properties are needed to address my situation, so that I can learn about the holistic approach to my health concern.

#### Step 6: Suggested Oils Discovery
**As a user,** I want to see all suggested essential oils for each therapeutic property, so that I can explore the complete range of options available to me.

## 4. Functional Requirements

### FR1: Health Concern Input System
1.1. The system must provide a chat-style input interface for health concern description
1.2. The system must validate minimum 3-character input length
1.3. The system must store health concern data in session state
1.4. The system must support multiple languages (initially Portuguese and English)

### FR2: Demographics Collection
2.1. The system must collect user gender (Male/Female options only)
2.2. The system must collect age category (Child, Teen, Adult, Senior)
2.3. The system must collect specific age value
2.4. The system must validate all demographic inputs before proceeding

### FR3: AI-Powered Potential Causes Generation
3.1. The system must generate 5-8 personalized potential causes using a specialized Medical Analysis Agent optimized for conservative, evidence-based analysis
3.2. The system must allow users to select multiple relevant causes
3.3. The system must provide detailed explanations for each potential cause
3.4. The system must support progressive disclosure for additional cause information

### FR4: AI-Powered Symptoms Identification
4.1. The system must generate 5-10 relevant symptoms based on selected causes using a specialized Symptom Correlation Agent
4.2. The system must allow multi-selection of applicable symptoms
4.3. The system must provide clear symptom descriptions and explanations
4.4. The system must link symptoms back to previously selected causes
4.5. The system must cross-reference symptoms with external medical databases for accuracy validation

### FR5: Therapeutic Properties Analysis
5.1. The system must identify 5-8 required therapeutic properties using a specialized Therapeutic Properties Agent with conservative temperature settings
5.2. The system must display properties as informational content (no user selection required)
5.3. The system must show relevancy scoring for each property
5.4. The system must explain how each property addresses specific causes/symptoms
5.5. The system must provide research citations for therapeutic property claims when available

### FR6: Essential Oils Suggestions
6.1. The system must generate 5-8 suggested oils for each therapeutic property using a specialized Oil Recommendation Agent
6.2. The system must display ALL suggested oils (not filtered subsets)
6.3. The system must provide detailed oil descriptions, relevancy scores, and safety information
6.4. The system must organize oils by their corresponding therapeutic properties
6.5. The system must integrate external oil databases for quality ratings and sourcing information
6.6. The system must include contraindication warnings and age-appropriate recommendations

### FR7: Session Management & Data Persistence
7.1. The system must maintain user session state across all steps
7.2. The system must support backward navigation with data preservation
7.3. The system must implement automatic session recovery
7.4. The system must clear subsequent step data when navigating backwards

### FR8: Responsive Design & Accessibility
8.1. The system must implement mobile-first responsive design
8.2. The system must support tablet and desktop breakpoints
8.3. The system must meet WCAG AA accessibility standards
8.4. The system must provide keyboard navigation support

## 5. Non-Goals (Out of Scope)

### Explicitly Excluded from MVP
- **Recipe Formulation:** Specific oil blending instructions and protocols (Steps 7-8)
- **Safety Constraints Analysis:** Detailed safety filtering and contraindications
- **Final Oil Selection:** User selection of final oils for recipe creation
- **E-commerce Integration:** Oil purchasing or vendor recommendations
- **User Account Profiles:** Saved preferences or historical recommendations
- **Advanced Personalization:** Integration with health tracking apps or devices
- **Multi-language Support:** Beyond Portuguese and English
- **Offline Functionality:** App must require internet connection
- **Medical Advice:** Any diagnostic or treatment recommendations

### Future Considerations (Post-MVP)
- Daily protocol generation with morning/day/night recommendations
- Safety constraint analysis and filtering
- Oil synergy analysis and final selection
- Integration with essential oil suppliers
- User preference learning and recommendation improvement

## 6. Design Considerations

### Mobile-First Responsive Design
- **Primary Breakpoint:** 375px (mobile)
- **Secondary Breakpoints:** 768px (tablet), 1024px (desktop)
- **Touch Targets:** Minimum 44px for all interactive elements
- **Typography:** 16px base font size for mobile readability

### Dashboard Integration
- **Entry Point:** Simplified layout for health concern step (no breadcrumbs/sidebar)
- **Subsequent Steps:** Full dashboard layout with progress indicators and navigation
- **Navigation:** Breadcrumb navigation for steps 2-6
- **Progress Tracking:** Visual progress indicator showing completion percentage

### Information Architecture
- **Step Progression:** Linear wizard flow with backward navigation support
- **Data Hierarchy:** Health Concern → Demographics → Causes → Symptoms → Properties → Oils
- **Content Organization:** Progressive disclosure for detailed information
- **Visual Hierarchy:** Clear step titles, descriptions, and action buttons

## 7. Technical Considerations

### Specialized AI Agents Architecture
- **Multi-Agent System:** Four specialized agents with domain-specific expertise and optimized model settings
- **Medical Analysis Agent:** Conservative temperature (0.3) for evidence-based potential causes analysis
- **Symptom Correlation Agent:** Moderate temperature (0.4) for symptom identification and correlation
- **Therapeutic Properties Agent:** Low temperature (0.2) for accurate therapeutic properties assessment
- **Oil Recommendation Agent:** Balanced temperature (0.5) for creative yet safe oil suggestions
- **Code Orchestration:** Frontend-controlled agent execution maintaining linear wizard flow
- **External Tool Integration:** Safety databases, research APIs, and oil quality databases

### Prompt Management System
```
src/features/recipe-wizard/prompts/
├── potential-causes.yaml
├── potential-symptoms.yaml
├── therapeutic-properties.yaml
└── suggested-oils.yaml
```

Each YAML file contains all necessary configuration in a single file:
- **template:** Multi-line prompt template with variable placeholders
- **config:** Model settings, temperature, tokens, and versioning
- **schema:** JSON schema for response validation

### API Endpoint Design
- **POST /api/recipe-wizard/analyze** - Unified endpoint for all AI analysis steps
- **Request Format:** Step-specific payload with user context
- **Response Format:** Structured JSON matching predefined schemas
- **Authentication:** Supabase session-based authentication

### Enhanced Data Flow Architecture
```
User Input → Session Store → API Request → Agent Selection → YAML Prompt Loading →
Specialized Agent Execution → External Tool Integration → Response Validation →
Safety Check → Session Update → UI Refresh
```

### Enhanced Component Architecture
- **WizardContainer:** Main orchestration component with agent selection logic
- **StepComponents:** Individual step implementations with enhanced safety displays
- **AgentOrchestrator:** Manages specialized agent selection and execution
- **SpecializedAgents:** Domain-specific agents (Medical, Symptom, Properties, Oil)
- **ExternalToolsService:** Integration with safety databases and research APIs
- **SessionStore:** Zustand-based state management with enhanced context
- **PromptManager:** YAML-based prompt configuration with agent-specific settings

## 8. Success Metrics

### User Experience Metrics
- **Completion Rate:** 80% of users complete all 6 steps
- **Time to Complete:** Average 8-12 minutes for full journey
- **User Satisfaction:** 4.5+ star rating via post-completion survey
- **Return Usage:** 40% of users return within 30 days

### Technical Performance Metrics
- **API Response Time:** <2 seconds for AI-powered steps
- **Error Rate:** <1% for AI API calls
- **Session Recovery:** 95% successful session restoration
- **Mobile Performance:** <3 second initial load time

### Business Metrics
- **Feature Adoption:** 60% of dashboard users try the recipe creator
- **Engagement Depth:** Average 4.5 steps completed per session
- **Knowledge Transfer:** 70% of users report learning something new
- **Conversion Intent:** 50% express interest in trying suggested oils

## 9. Open Questions

### Technical Implementation
1. **Specialized Agent Performance:** How should we optimize different temperature settings across agents for best results?
2. **External API Integration:** What's the priority order for integrating safety databases, research APIs, and oil quality databases?
3. **Agent Orchestration:** Should we implement parallel agent execution for performance optimization?
4. **Tool Integration Strategy:** How should we handle external API failures while maintaining user experience?
5. **Response Caching:** Should we cache specialized agent responses and external tool data separately?

### User Experience
5. **Step Validation:** Should users be required to select minimum items in each step?
6. **Progress Saving:** How long should we maintain incomplete sessions?
7. **Educational Content:** Should we provide additional learning resources for each step?
8. **Accessibility:** What additional accessibility features are needed beyond WCAG AA?

### Business Logic
9. **Content Moderation:** How should we handle inappropriate health concern inputs?
10. **Data Privacy:** What user data should be logged for improvement purposes?
11. **Internationalization:** What's the priority order for additional language support?
12. **Integration Points:** How will this connect to future e-commerce or provider features?

---

## 10. Technical Architecture Deep Dive

### Data Flow Diagrams

#### Enhanced System Data Flow
```
[User Input] → [Session Store] → [API Gateway] → [Agent Selection] → [YAML Prompt Load] → [Specialized Agent] → [External Tools] → [Response Validator] → [Safety Check] → [Session Update] → [UI Refresh]
     ↓              ↓              ↓                    ↓                ↓                    ↓                  ↓                ↓                 ↓              ↓              ↓
[Form Data]    [Zustand Store] [/api/analyze]    [Domain Agent]    [YAML Config]    [Optimized Model]    [Safety APIs]    [Schema Check]    [Warning Check] [State Update] [Enhanced Display]
```

#### Step-by-Step Enhanced Data Flow

**Step 1-2: User Input Collection**
```
Health Concern Input → Demographics Form → Session Storage → User Context Building
                                        ↓                           ↓
                                   Ready for AI Analysis    Enhanced Personalization
```

**Step 3-6: Specialized AI-Powered Analysis Loop**
```
Previous Step Data → Agent Selection → YAML Prompt Load → Template Processing → Specialized Agent → External Tool Calls → Structured Response → Safety Validation → UI Display
        ↓                  ↓               ↓                ↓                    ↓                   ↓                    ↓                   ↓                  ↓
   Session Context    Domain Expert    YAML Config    Dynamic Prompt    Optimized Model    Research/Safety APIs    JSON Schema    Warning Generation    Enhanced UI
```

### API Endpoint Specifications

#### POST /api/recipe-wizard/analyze
**Purpose:** Unified endpoint for all AI-powered analysis steps

**Request Schema:**
```json
{
  "step": "PotentialCauses | PotentialSymptoms | MedicalProperties | SuggestedOils",
  "sessionId": "uuid",
  "healthConcern": "string",
  "demographics": {
    "gender": "male | female",
    "ageCategory": "child | teen | adult | senior",
    "ageSpecific": "number"
  },
  "previousSelections": {
    "selectedCauses": "array",
    "selectedSymptoms": "array",
    "therapeuticProperties": "array"
  },
  "language": "PT_BR | EN_US"
}
```

**Response Schema:**
```json
{
  "success": "boolean",
  "step": "string",
  "sessionId": "string",
  "data": {
    // Step-specific structured data
  },
  "metadata": {
    "processingTime": "number",
    "model": "string",
    "promptVersion": "string"
  },
  "error": "string | null"
}
```

### Component Architecture

#### Core Components Hierarchy
```
WizardContainer
├── ProgressIndicator
├── StepRenderer
│   ├── HealthConcernChatInput
│   ├── DemographicsForm
│   ├── CausesSelection
│   ├── SymptomsSelection
│   ├── PropertiesDisplay
│   └── SuggestedOilsDisplay
├── NavigationControls
└── ErrorBoundary
```

#### Enhanced Service Layer Architecture
```
EnhancedAIService (Specialized Agents System)
├── AgentOrchestrator
│   ├── MedicalAnalysisAgent (temp: 0.3)
│   ├── SymptomCorrelationAgent (temp: 0.4)
│   ├── TherapeuticPropertiesAgent (temp: 0.2)
│   └── OilRecommendationAgent (temp: 0.5)
├── ExternalToolsService
│   ├── SafetyDatabaseTool
│   ├── ResearchAPITool
│   ├── OilQualityTool
│   └── ContraindicationTool
├── PromptManager
│   ├── YAMLLoader
│   ├── TemplateProcessor
│   └── AgentConfigValidator
├── ResponseProcessor
│   ├── JSONValidator
│   ├── SafetyValidator
│   ├── ErrorHandler
│   └── DataEnhancer
└── SessionManager
    ├── StateManager (Zustand)
    ├── ContextBuilder
    ├── PersistenceLayer
    └── NavigationController
```

### Prompt Management System Details

#### YAML Configuration Structure
**Example: src/features/recipe-wizard/prompts/potential-causes.yaml**
```yaml
template: |
  # Potential Causes Analysis Prompt

  **Persona:** Act as an experienced wellness advisor with evidence-based knowledge,
  skilled at correlating common health complaints with potential underlying causes
  based on individual profiles and lifestyle factors.

  **Objective:** Analyze the provided health concern and demographics to generate
  personalized potential causes.

  **Input Variables:**
  - {{healthConcern}}: User's described health issue
  - {{demographics}}: User's age, gender, and category
  - {{language}}: Target language for response

  **Instructions:**
  1. Analyze health concern through demographic lens
  2. Generate 5-8 evidence-based potential causes
  3. Prioritize by relevance to user profile
  4. Provide clear explanations for each cause

  **Output Format:**
  Structured JSON matching the defined schema with localized content.

config:
  model: "gpt-4"
  temperature: 0.3  # Conservative for medical analysis
  maxTokens: 2000
  responseFormat:
    type: "json_schema"
    json_schema:
      name: "potential_causes_response"
  systemMessage: "You are a conservative medical analysis specialist..."
  version: "1.0.0"
  lastUpdated: "2024-01-15"
  agentType: "medical_analysis"
  tools:
    - "safety_database_tool"
    - "research_lookup_tool"

schema:
  type: "object"
  properties:
    potential_causes:
      type: "array"
      items:
        type: "object"
        properties:
          cause_name:
            type: "string"
            description: "Short label for the potential cause"
          cause_suggestion:
            type: "string"
            description: "Clear description of the potential cause"
          explanation:
            type: "string"
            description: "Justification for relevance to user's situation"
        required: ["cause_name", "cause_suggestion", "explanation"]
  required: ["potential_causes"]
```

### Implementation Strategy

#### Enhanced Development Approach
The Essential Oil Recipe Creator will be built from the ground up using modern web technologies with a specialized multi-agent AI system. The implementation follows a modular architecture with domain-specific agents and external tool integrations for enhanced safety and research validation.

#### Enhanced Technology Stack
- **Frontend:** React with TypeScript for type safety
- **State Management:** Zustand for session and wizard state with enhanced context management
- **AI Integration:** OpenAI Agents JS SDK with specialized domain agents and optimized model settings
- **External APIs:** Safety databases, research APIs, and essential oil quality databases
- **Authentication:** Supabase for user session management
- **Styling:** Tailwind CSS for responsive design with enhanced safety UI components
- **API Layer:** Next.js API routes with agent orchestration and external tool integration

### Error Handling & Resilience

#### Enhanced Error Scenarios & Responses
1. **Specialized Agent Unavailable:** Fallback to general agent with appropriate warnings
2. **External Tool API Failures:** Graceful degradation with cached safety data and user notifications
3. **Rate Limit Exceeded:** Intelligent queuing with agent priority (medical analysis first)
4. **Invalid JSON Response:** Agent-specific retry logic with temperature adjustment
5. **Safety Database Unavailable:** Display general safety warnings and recommend professional consultation
6. **Session Timeout:** Automatic session recovery with enhanced context preservation

#### Enhanced Monitoring & Alerting
- Specialized agent performance tracking by domain
- External tool API response time and success rate monitoring
- Safety warning generation and display tracking
- User completion funnel analysis with agent-specific metrics
- Research citation accuracy and availability monitoring
- Agent temperature optimization tracking

---

## 11. Implementation Roadmap

### Week 1-2: Enhanced Foundation Setup
- OpenAI Agents JS SDK integration with specialized agent configuration
- YAML-based prompt management system with agent-specific settings
- External tools integration (safety databases, research APIs)
- Enhanced session management with context building
- Agent orchestration service development

### Week 3-4: Specialized Agents Development
- Medical Analysis Agent implementation (conservative temperature: 0.3)
- Symptom Correlation Agent implementation (moderate temperature: 0.4)
- Therapeutic Properties Agent implementation (low temperature: 0.2)
- Oil Recommendation Agent implementation (balanced temperature: 0.5)
- External tool integration for each agent
- Enhanced response validation with safety checks

### Week 5-6: Integration & Enhanced Features
- Dashboard integration with enhanced safety displays
- Agent orchestration and performance optimization
- External API integration testing and fallback mechanisms
- Enhanced accessibility compliance with safety warnings
- User experience testing with specialized agent outputs

### Week 7-8: Launch Preparation & Quality Assurance
- Production deployment with specialized agent monitoring
- Enhanced monitoring and alerting for multi-agent system
- Safety validation and external tool reliability testing
- User feedback collection with agent performance metrics
- Comprehensive documentation for specialized agent architecture

This enhanced PRD provides the foundation for implementing the Essential Oil Recipe Creator MVP with a sophisticated multi-agent system, ensuring superior personalization, safety validation, and research-backed recommendations while maintaining an intuitive user experience.
