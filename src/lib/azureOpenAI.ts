// Azure OpenAI client configuration
import { OpenAI } from 'openai';

// Initialize Azure OpenAI client
const azureOpenAI = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
  defaultQuery: { 'api-version': '2024-02-15-preview' },
  defaultHeaders: {
    'api-key': process.env.AZURE_OPENAI_API_KEY,
  },
});

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
  subject?: string;
  userContext?: string; // ADHD-specific context
}

export async function generateTaskBreakdown(
  request: TaskBreakdownRequest
): Promise<TaskBreakdownStep[]> {
  const systemPrompt = `You are an ADHD-specialized task breakdown expert and supportive friend. Your job is to break down overwhelming tasks into tiny, manageable micro-steps that work specifically for ADHD brains, while being warm, encouraging, and understanding.

ADHD-Specific Principles:
1. Start with VERY easy steps (5-10 min) to overcome executive dysfunction
2. Build momentum gradually - easy steps first, harder ones later
3. Include strategic breaks and dopamine rewards
4. Make each step specific and concrete (no vague instructions)
5. Add clear completion criteria for each step
6. Consider energy levels and attention spans

Difficulty Ratings:
- EASY (🟢): 5-15 minutes, low mental energy, clear completion
- MEDIUM (🟡): 15-30 minutes, moderate focus required
- HARD (🔴): 30+ minutes, high focus, complex thinking

EMOTIONAL INTELLIGENCE RULES:
- Use warm, encouraging language like a supportive friend
- Add motivational phrases: "you've got this!", "almost there!", "great job!"
- Include permission to be imperfect: "just write badly", "rough draft is fine"
- Add ADHD-specific encouragement: "your brain works differently and that's okay"
- Use emojis sparingly but meaningfully
- Acknowledge the struggle: "this part might feel hard, but..."
- Celebrate small wins: "completing this will feel amazing!"

Return a JSON array with 6-10 steps, each having:
{
  "step": "Warm, encouraging action with supportive language",
  "difficulty": "EASY|MEDIUM|HARD", 
  "estimatedMinutes": number,
  "order": number,
  "completionCriteria": "Encouraging completion criteria",
  "encouragement": "Extra motivational message for this step"
}

IMPORTANT: Always start with 2-3 EASY steps to build momentum! Make every step feel achievable and supported.`;

  const userPrompt = `Break down this task for someone with ADHD:

Task: "${request.title}"
${request.description ? `Description: ${request.description}` : ''}
${request.deadline ? `Deadline: ${request.deadline}` : ''}
${request.subject ? `Subject: ${request.subject}` : ''}
${request.userContext ? `Additional context: ${request.userContext}` : ''}

Create 6-10 micro-steps that will help overcome task paralysis and build momentum. Remember: start easy, build up gradually, be specific.`;

  try {
    const response = await azureOpenAI.chat.completions.create({
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
      throw new Error('No response from Azure OpenAI');
    }

    const parsed = JSON.parse(content);
    
    // Ensure we have a steps array
    const steps = parsed.steps || parsed.breakdown || parsed;
    
    if (!Array.isArray(steps)) {
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

  } catch (error) {
    console.error('Azure OpenAI API error:', error);
    throw new Error('Failed to generate task breakdown');
  }
}

// Test function for development
export async function testAzureOpenAI() {
  try {
    const testBreakdown = await generateTaskBreakdown({
      title: "Write a 5-page research paper on climate change",
      description: "Need to research, outline, and write a paper for environmental science class",
      deadline: "Next Friday",
      subject: "Environmental Science"
    });
    
    console.log('Test breakdown:', testBreakdown);
    return testBreakdown;
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
}