import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = "google/gemma-4-31b-it:free";

const SYSTEM_PROMPT = `You are StudyForge AI — an expert study plan architect. Your job is to create detailed, structured study plans for competitions and exams.

When the user gives you information about a competition, exam, or learning goal, you must:

1. Analyze the scope, topics, and difficulty level.
2. Create a day-by-day study plan that fits within the user's timeline.
3. Break down complex topics into manageable daily tasks.
4. Include review sessions, practice tests, and rest days.
5. Prioritize topics by importance and difficulty.

IMPORTANT: You MUST respond with valid JSON in this exact format:
{
  "title": "Study Plan for [Competition Name]",
  "summary": "A brief 1-2 sentence overview of the plan.",
  "totalDays": <number>,
  "startDate": "<YYYY-MM-DD>",
  "endDate": "<YYYY-MM-DD>",
  "tasks": [
    {
      "day": 1,
      "date": "<YYYY-MM-DD>",
      "title": "Short task title",
      "description": "Detailed description of what to study and how",
      "category": "study | review | practice | rest",
      "priority": "high | medium | low",
      "estimatedHours": <number>
    }
  ]
}

Rules:
- Start from today's date unless the user specifies otherwise.
- Allocate rest days every 5-6 days of study.
- Include review/practice sessions before the competition date.
- Keep each day's workload between 2-6 hours unless user specifies.
- Respond ONLY with the JSON object. No markdown, no extra text, no code fences.`;

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "OpenRouter API key not configured" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const prompt = formData.get("prompt") as string;
    const pdfText = formData.get("pdfText") as string | null;
    const language = formData.get("language") as string || "English";

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    let userMessage = prompt;
    if (pdfText) {
      userMessage += `\n\n--- UPLOADED DOCUMENT CONTENT ---\n${pdfText}`;
    }

    // Add language instruction and today's date for context
    const today = new Date().toISOString().split("T")[0];
    userMessage += `\n\nCRITICAL INSTRUCTION: You MUST generate the ENTIRE response (including title, summary, task titles, and task descriptions) in the ${language} language. However, the 'category' and 'priority' fields MUST remain in English to match the exact schema enums (study, review, practice, rest / high, medium, low).`;
    userMessage += `\n\nToday's date is ${today}.`;

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": request.headers.get("origin") || "https://studyforge.app",
          "X-Title": "StudyForge",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userMessage },
          ],
          temperature: 0.7,
          max_tokens: 8000,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenRouter error:", errorData);
      return NextResponse.json(
        { error: "AI service error. Please try again." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content;

    if (!aiContent) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 502 }
      );
    }

    // Parse the JSON response from the AI
    let studyPlan;
    try {
      // Try to extract JSON from the response (handle possible markdown wrapping)
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        studyPlan = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch {
      console.error("Failed to parse AI response:", aiContent);
      return NextResponse.json(
        {
          error: "AI response was not in the expected format. Please try again.",
          raw: aiContent,
        },
        { status: 422 }
      );
    }

    // Save to Supabase
    const { data: savedPlan, error: dbError } = await supabase
      .from("study_plans")
      .insert({
        user_id: user.id,
        title: studyPlan.title,
        summary: studyPlan.summary,
        prompt: prompt,
        plan_data: studyPlan,
        start_date: studyPlan.startDate,
        end_date: studyPlan.endDate,
        total_days: studyPlan.totalDays,
      })
      .select()
      .single();

    if (dbError) {
      console.error("DB error:", dbError);
      // Still return the plan even if saving failed
      return NextResponse.json({
        plan: studyPlan,
        saved: false,
        warning: "Plan generated but could not be saved to database.",
      });
    }

    return NextResponse.json({
      plan: studyPlan,
      saved: true,
      id: savedPlan.id,
    });
  } catch (err) {
    console.error("Generate error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
