When I press continue on the demographics at /create-recipe/demographics, i get this on the console log at dev tools: 
AI streaming initiated successfully
demographics:1 EventSource's response has a MIME type ("application/json") that is not "text/event-stream". Aborting the connection.Understand this error
use-ai-streaming.ts:193 Retrying connection (attempt 1/3) in 1000ms
demographics:1 EventSource's response has a MIME type ("application/json") that is not "text/event-stream". Aborting the connection.Understand this error
use-ai-streaming.ts:193 Retrying connection (attempt 2/3) in 2000ms
demographics:1 EventSource's response has a MIME type ("application/json") that is not "text/event-stream". Aborting the connection.Understand this error
use-ai-streaming.ts:193 Retrying connection (attempt 3/3) in 4000ms
demographics:1 EventSource's response has a MIME type ("application/json") that is not "text/event-stream". Aborting the connection.Understand this error

All reference up to date documentation is in docs\openai-agents-js\content\guides

my terminal server logs shows:
2025-06-12T17:07:10.963Z [Application] info: Rendering recipe creator layout {
  "operation": "RecipeCreatorLayout"
}
2025-06-12T17:07:11.017Z [Application] info: Rendering recipe wizard step {
  "step": "health-concern",
  "stepNumber": 1,
  "title": "Health Concern",
  "operation": "RecipeStepPage"
}
 GET /dashboard/create-recipe/health-concern 200 in 18423ms
 ○ Compiling /_not-found/page ...
 ✓ Compiled /_not-found/page in 17.9s
2025-06-12T17:18:52.741Z [AuthStateService] info: Auth state retrieved successfully {
  "userId": "5d99e3...",
  "operation": "getServerAuthState"
}
 GET /.well-known/appspecific/com.chrome.devtools.json 404 in 19086ms
2025-06-12T17:20:49.048Z [Application] info: Rendering recipe wizard step {
  "step": "demographics",
  "stepNumber": 2,
  "title": "Demographics",
  "operation": "RecipeStepPage"
}
 GET /dashboard/create-recipe/demographics 200 in 313ms
[2025-06-12T17:20:52.811Z] WinstonConfig: Sentry transport for Winston added for levels: warn, error.
 ○ Compiling /api/ai/streaming ...
 ✓ Compiled /api/ai/streaming in 4.7s
[Streaming API] Request started { traceId: 'streaming-1749748887861-v74r6mxqu' }
[Streaming API] API key validated
[Streaming API] Request data parsed { feature: 'recipe-wizard', step: 'potential-causes' }
[Streaming API] Streaming mode: auto
[Streaming API] Request validation passed
[Streaming API] Getting prompt manager
[Streaming API] Template variables prepared {
  healthConcern: 'aneurisma',
  gender: 'female',
  ageCategory: 'adult',
  specificAge: 25,
  language: 'en'
}
[Streaming API] Loading prompt configuration for step: potential-causes
[Streaming API] Prompt loaded, length: 3561
[Streaming API] Config loaded: { model: 'gpt-4.1-nano', hasSchema: true }
[Streaming API] Creating AI agent with JSON schema
[Streaming API] Agent created with structured output
[Streaming API] Starting agent execution with streaming
[Streaming API] Agent promise created, waiting for result
[Streaming API] Agent execution completed
[Streaming API] Creating SSE stream
[Streaming API] Structured output detected: {
  type: 'object',
  properties: {
    meta: {
      type: 'object',
      properties: [Object],
      required: [Array],
      additionalProperties: false
    },
    data: {
      type: 'object',
      properties: [Object],
      required: [Array],
      additionalProperties: false
    },
    echo: {
      type: 'object',
      properties: [Object],
      required: [Array],
      additionalProperties: false
    }
  },
  required: [ 'meta', 'data', 'echo' ],
  additionalProperties: false
}
[Streaming API] Config schema keys: [ 'type', 'name', 'strict', 'schema' ]
[Streaming API] Final streaming mode: structured
[Streaming API] 🚀 Starting structured streaming
... keeps going

AND I correct got the call at my https://platform.openai.com/traces/trace?trace_id=trace_43b75bf25451433e8fbbe5496c3ac2af

Here it is the details that i see on my traces at openai dashboard:
Agent workflow
Properties
ID
trace_43b75bf25451433e8fbbe5496c3ac2af
Workflow name
Agent workflow
Metadata
No metadata entries

With the POST/v1/responses with the corrected request data from our "continue" click at /create-recipe/demographics

POST
/v1/responses
response
2.440t
9752ms
Properties
Created
12 de jun. de 2025, 14:28
ID
resp_684b0e49947c819bb222ae896c8e14f404911ee81adc47df
Model
gpt-4.1-nano-2025-04-14
Tokens
2.440 total
Configuration
Response
json_schema
Instructions
System Instructions
Persona: Act as an experienced wellness and holistic health advisor with evidence-based knowledge, skilled at correlating common health complaints with potential underlying causes based on individual profiles and lifestyle factors.

Objective: Analyze the provided health concern and user profile to generate a personalized list of the most likely potential causes or contributing factors. This list is intended to be presented to the user for reflection, helping them identify factors relevant to their situation, while avoiding medical diagnosis.

Input Data:

health_concern: The primary health complaint, symptom, or goal.

Value: aneurisma
user_profile: A JSON object containing crucial details about the end-user. This profile is the primary driver for personalization.

Gender: female
Age Category: adult
Specific Age: 25
Language: en
user_language: The target language for user-facing text in the output.

Value: en
Guidelines:

User-Centric Analysis: Deeply analyze the health concern specifically through the lens of the user profile. Ask: "What typically causes or contributes to this health concern in someone with this specific age, gender, life stage?"

Evidence-Based Approach: Prioritize well-established connections between causes and health issues that are supported by current scientific understanding. Avoid speculation on rare or unverified causes.

Holistic Factor Consideration: Brainstorm potential causes across various domains, including (but not limited to):

Lifestyle: Stress levels (work, family, financial), sleep patterns/hygiene, diet, physical activity (or lack thereof), substance use, screen time habits.
Emotional/Mental: Anxiety, worry, low mood, mental fatigue, significant life events, mindset.
Physical: Muscle tension, posture, underlying physical discomforts (even if not the primary complaint), fatigue.
Environmental: Noise, light, air quality, work/home environment setup, seasonal changes.
Prioritize Personalization: Crucially, avoid generic lists. Tailor the suggestions based on strong inferences from the user profile. For example:

Work stress is more plausible for a middle-aged adult than academic pressure
Consider age-appropriate factors for the specific demographic
Consider cultural and regional factors when applicable
Confidence Ranking: Sort potential causes by likelihood based on the available information, placing the most probable causes first.

Medical Boundaries:

Frame suggestions as possibilities to explore, not diagnoses
Focus on wellness and lifestyle factors
Avoid serious medical conditions requiring professional medical care
Focused Output: Generate a concise list of 5 to 8 of the most plausible potential causes to avoid overwhelming the user. Prioritize the causes most strongly suggested by the user's profile and the nature of the health concern.

Clarity: Use clear, accessible language for all user-facing text, avoiding technical jargon when possible.

Output Format:

Provide the result strictly in the following JSON format. JSON key names must be in English. The values for name_localized, suggestion_localized, explanation_localized, and any advisory notes must be in the language specified by the user's language preference.

Important: Include proper metadata, echo the user's input, and provide 5-8 potential causes with localized content.

Input
1785t
user
Persona: Act as an experienced wellness and holistic health advisor with evidence-based knowledge, skilled at correlating common health complaints with potential underlying causes based on individual profiles and lifestyle factors.

Objective: Analyze the provided health concern and user profile to generate a personalized list of the most likely potential causes or contributing factors. This list is intended to be presented to the user for reflection, helping them identify factors relevant to their situation, while avoiding medical diagnosis.

Input Data:

health_concern: The primary health complaint, symptom, or goal.

Value: aneurisma
user_profile: A JSON object containing crucial details about the end-user. This profile is the primary driver for personalization.

Gender: female
Age Category: adult
Specific Age: 25
Language: en
user_language: The target language for user-facing text in the output.

Value: en
Guidelines:

User-Centric Analysis: Deeply analyze the health concern specifically through the lens of the user profile. Ask: "What typically causes or contributes to this health concern in someone with this specific age, gender, life stage?"

Evidence-Based Approach: Prioritize well-established connections between causes and health issues that are supported by current scientific understanding. Avoid speculation on rare or unverified causes.

Holistic Factor Consideration: Brainstorm potential causes across various domains, including (but not limited to):

Lifestyle: Stress levels (work, family, financial), sleep patterns/hygiene, diet, physical activity (or lack thereof), substance use, screen time habits.
Emotional/Mental: Anxiety, worry, low mood, mental fatigue, significant life events, mindset.
Physical: Muscle tension, posture, underlying physical discomforts (even if not the primary complaint), fatigue.
Environmental: Noise, light, air quality, work/home environment setup, seasonal changes.
Prioritize Personalization: Crucially, avoid generic lists. Tailor the suggestions based on strong inferences from the user profile. For example:

Work stress is more plausible for a middle-aged adult than academic pressure
Consider age-appropriate factors for the specific demographic
Consider cultural and regional factors when applicable
Confidence Ranking: Sort potential causes by likelihood based on the available information, placing the most probable causes first.

Medical Boundaries:

Frame suggestions as possibilities to explore, not diagnoses
Focus on wellness and lifestyle factors
Avoid serious medical conditions requiring professional medical care
Focused Output: Generate a concise list of 5 to 8 of the most plausible potential causes to avoid overwhelming the user. Prioritize the causes most strongly suggested by the user's profile and the nature of the health concern.

Clarity: Use clear, accessible language for all user-facing text, avoiding technical jargon when possible.

Output Format:

Provide the result strictly in the following JSON format. JSON key names must be in English. The values for name_localized, suggestion_localized, explanation_localized, and any advisory notes must be in the language specified by the user's language preference.

Important: Include proper metadata, echo the user's input, and provide 5-8 potential causes with localized content.

Output
655t
assistant
{
  "meta": {
    "step_name": "generate_potential_causes",
    "request_id": "abc123xyz",
    "timestamp_utc": "2023-10-05T15:30:00Z",
    "version": "1.0",
    "user_language": "en",
    "status": "success",
    "message": "Potential causes generated successfully."
  },
  "data": {
    "potential_causes": [
      {
        "cause_id": "1",
        "name_localized": "Stress and Anxiety",
        "suggestion_localized": "Consider practices to manage stress and anxiety, such as relaxation techniques or mindfulness.",
        "explanation_localized": "High stress and anxiety levels can contribute to physical symptoms and overall health concerns, even if not directly causing an aneurysm."
      },
      {
        "cause_id": "2",
        "name_localized": "Lifestyle factors like diet and physical activity",
        "suggestion_localized": "Maintain a balanced diet and regular exercise routine to support vascular health.",
        "explanation_localized": "An unhealthy diet and lack of physical activity can impact blood vessel integrity and overall cardiovascular health."
      },
      {
        "cause_id": "3",
        "name_localized": "Sleep patterns and quality",
        "suggestion_localized": "Aim for consistent, restorative sleep to help maintain overall well-being.",
        "explanation_localized": "Poor sleep quality can increase stress levels and negatively affect cardiovascular health."
      },
      {
        "cause_id": "4",
        "name_localized": "Hormonal or reproductive factors",
        "suggestion_localized": "Be aware of hormonal changes and discuss any concerns with a healthcare provider.",
        "explanation_localized": "Hormonal fluctuations in young women can influence vascular health and circulation."
      },
      {
        "cause_id": "5",
        "name_localized": "Environmental exposures",
        "suggestion_localized": "Reduce exposure to environmental pollutants and irritants, and ensure good air quality indoors.",
        "explanation_localized": "Environmental factors can impact overall vascular health and stress the circulatory system."
      },
      {
        "cause_id": "6",
        "name_localized": "Mental and emotional health",
        "suggestion_localized": "Engage in activities that support mental well-being and seek support if experiencing emotional distress.",
        "explanation_localized": "Emotional fatigue and mental health issues can influence physical health and stress responses."
      },
      {
        "cause_id": "7",
        "name_localized": "Physical posture and tension",
        "suggestion_localized": "Practice good posture and incorporate stretching or relaxation exercises into daily routines.",
        "explanation_localized": "Muscle tension and poor posture can affect blood flow and overall comfort."
      }
    ]
  },
  "echo": {
    "health_concern_input": "aneurisma",
    "user_info_input": {
      "gender": "female",
      "age_category": "adult",
      "age_specific": "25",
      "age_unit": "years"
    }
  }
}

All reference up to date documentation is in docs\openai-agents-js\content\guides 

Since i get the information on the backend inside openai, the problem is how it is being handled inside in our end.

Also study the scripts that are currently perfect working 'scripts\test-streaming.js'

Base your fix on provided documentation and tested scripts instead of using your own knowlegede. There is also specifics about streaming on 
´[REFERENCE ONLY]
- docs\openai-agents-js\examples\streaming-chat (not structured output)
- docs\openai-agents-js\examples\agent-patterns\streamed.ts (not structured output)
- docs\openai-agents-js\content\guides\streaming.mdx (not structured output)