// Azure OpenAI client configuration
import { OpenAI } from 'openai';

// Lazy initialization of Azure OpenAI client
let azureOpenAI: OpenAI | null = null;

function getAzureOpenAIClient(): OpenAI {
  if (!azureOpenAI) {
    // Check if required environment variables are available
    if (!process.env.AZURE_OPENAI_API_KEY || !process.env.AZURE_OPENAI_ENDPOINT || !process.env.AZURE_OPENAI_DEPLOYMENT_NAME) {
      throw new Error('Azure OpenAI configuration is missing. Please check your environment variables.');
    }

    azureOpenAI = new OpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
      defaultQuery: { 'api-version': '2024-02-15-preview' },
      defaultHeaders: {
        'api-key': process.env.AZURE_OPENAI_API_KEY,
      },
    });
  }
  return azureOpenAI;
}

export interface TaskBreakdownStep {
  step: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  estimatedMinutes: number;
  order: number;
  completionCriteria: string;
  encouragement?: string;
}

export interface TaskBreakdownRequest {
  title: string;
  description?: string;
  deadline?: string;
  subject?: string; // kept as 'subject' internally — maps to DB column
  userContext?: string;
}

export async function generateTaskBreakdown(
  request: TaskBreakdownRequest
): Promise<TaskBreakdownStep[]> {
  const systemPrompt = `You are a productivity expert who helps professionals break down complex tasks into clear, actionable steps. Your job is to transform overwhelming work into a structured execution plan.

Core Principles:
1. Start with quick-win steps (5-15 min) to build momentum
2. Progress from setup/research → execution → review
3. Make each step specific and concrete — no vague instructions
4. Include clear completion criteria ("done when...")
5. Consider dependencies between steps
6. Estimate time realistically

Difficulty Ratings:
- EASY: 5-15 minutes, low cognitive load, clear outcome
- MEDIUM: 15-30 minutes, moderate focus required
- HARD: 30+ minutes, deep work, complex thinking

Return a JSON array with 6-10 steps, each having:
{
  "step": "Clear action statement",
  "difficulty": "EASY|MEDIUM|HARD", 
  "estimatedMinutes": number,
  "order": number,
  "completionCriteria": "Specific done-when criteria"
}

IMPORTANT: Always start with 2-3 EASY steps. Make every step feel achievable.`;

  const userPrompt = `Break down this task into actionable steps:

Task: "${request.title}"
${request.description ? `Description: ${request.description}` : ''}
${request.deadline ? `Deadline: ${request.deadline}` : ''}
${request.subject ? `Project: ${request.subject}` : ''}
${request.userContext ? `Additional context: ${request.userContext}` : ''}

Create 6-10 concrete steps. Start easy, build up gradually, be specific.`;

  try {
    const client = getAzureOpenAIClient();
    
    const response = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error('No content in Azure OpenAI response');
      throw new Error('No response from Azure OpenAI');
    }

    const parsed = JSON.parse(content);
    
    // Ensure we have a steps array
    const steps = parsed.steps || parsed.breakdown || parsed;
    
    if (!Array.isArray(steps)) {
      console.error('Invalid response format:', parsed);
      throw new Error('Invalid response format from AI');
    }

    // Validate and format the response
    return steps.map((step: any, index: number) => ({
      step: step.step || step.title || step.description,
      difficulty: step.difficulty || 'MEDIUM',
      estimatedMinutes: step.estimatedMinutes || step.minutes || 15,
      order: step.order || index + 1,
      completionCriteria: step.completionCriteria || step.completion || 'Task completed',
      encouragement: step.encouragement || ''
    }));

  } catch (error: any) {
    console.error('Azure OpenAI API error details:', {
      message: error.message,
      status: error.status,
      type: error.type,
      code: error.code
    });
    throw new Error(`Failed to generate task breakdown: ${error.message || 'Unknown error'}`);
  }
}

// Test function for development
export async function testAzureOpenAI() {
  try {
    const testBreakdown = await generateTaskBreakdown({
      title: "Prepare quarterly business review presentation",
      description: "Need to compile Q2 metrics, create slides, and prepare talking points for leadership team",
      deadline: "Next Friday",
      subject: "Business Operations"
    });
    
    return testBreakdown;
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
}