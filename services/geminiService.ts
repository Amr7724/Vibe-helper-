import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { FileNode, ClipboardItem, PlanNode } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API Key is missing.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

// --- Main Project Chat ---

export const explainSqlCode = async (sqlContent: string): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "عذراً، لم يتم العثور على مفتاح API.";

  try {
    const truncatedContent = sqlContent.length > 30000 
      ? sqlContent.substring(0, 30000) + "\n... (truncated)" 
      : sqlContent;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an expert Database Administrator. Analyze this SQL code concisely in Arabic:\n\n${truncatedContent}`,
    });

    return response.text || "لم يتم استلام رد.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "حدث خطأ أثناء التحليل.";
  }
};

export const createProjectChat = (hasFiles: boolean, knowledgeBase: string = "") => {
  const ai = getAiClient();
  if (!ai) return null;

  let systemInstruction = `
    أنت "VibeCode AI"، خبير تقني ومهندس برمجيات محترف (Senior Software Engineer).
    
    مهمتك الأساسية: مساعدة المستخدم في بناء وإدارة مشروعه البرمجي بناءً على "المعرفة" (Knowledge Base) المقدمة.

    القواعد:
    1. Knowledge Base هي المصدر الأساسي للحقيقة. إذا كانت تحتوي على تفاصيل، اعتمد عليها تماماً في توليد الكود أو الإجابة.
    2. إذا لم يتم رفع ملفات (No Files)، اعتمد كلياً على Knowledge Base وتصرف كأنك تبني المشروع من الصفر (Vibe Coding).
    3. إذا تم رفع ملفات، ادمج فهمك للملفات مع الـ Knowledge Base.
    4. تحدث باللغة العربية بأسلوب تقني.
  `;

  if (knowledgeBase) {
    systemInstruction += `\n\n=== Project Knowledge Base (معلومات المشروع) ===\n${knowledgeBase}\n==============================================`;
  } else {
    systemInstruction += `\n\nتنبيه: لم يقم المستخدم بإدخال Knowledge Base بعد. اسأله عن تفاصيل المشروع للبدء.`;
  }

  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction,
    },
  });
};

export const sendMessageToChat = async (
  chat: Chat, 
  message: string, 
  activeFile?: FileNode,
  knowledgeBase?: string
): Promise<string> => {
  try {
    let prompt = message;
    
    // Construct Context
    let context = "";
    if (knowledgeBase) {
      context += `Current Knowledge Base context: ${knowledgeBase.substring(0, 2000)}\n`;
    }

    if (activeFile && activeFile.content) {
      const truncatedContent = activeFile.content.length > 20000 
        ? activeFile.content.substring(0, 20000) + "... (truncated)"
        : activeFile.content;
      context += `Current Open File (${activeFile.path}):\n\`\`\`\n${truncatedContent}\n\`\`\`\n`;
    }

    if (context) {
      prompt = `${context}\nUser Question: ${message}`;
    }

    const response: GenerateContentResponse = await chat.sendMessage({ message: prompt });
    return response.text || "لا يوجد رد.";
  } catch (error) {
    console.error("Chat Error:", error);
    return "حدث خطأ في الاتصال بالذكاء الاصطناعي.";
  }
};

// --- Clipboard Intelligence API ---

export const analyzeClipboardContent = async (text: string, knowledgeBase?: string): Promise<ClipboardItem | null> => {
  const ai = getAiClient();
  if (!ai) return null;

  let contextInfo = "";
  if (knowledgeBase) {
    contextInfo = `Consider this project context when analyzing: ${knowledgeBase.substring(0, 1000)}`;
  }

  const prompt = `
    Analyze the following text/link for a Developer Tool ("VibeCode").
    ${contextInfo}
    
    Determine if it is:
    - idea: A project idea or feature request.
    - prompt_tool: A prompt meant to be input into an AI tool.
    - prompt_helper: A prompt meant to help build the project structure.
    - link_tool: A URL to a software tool/library.
    - link_article: A URL to a relevant article/doc.
    - link_video: A URL to a video.
    - video_tutorial: Specifically a tutorial video relevant to coding.
    - irrelevant: Not useful for coding/projects.

    Also determine the pipeline stage (backend, frontend, design, deployment, planning).
    Assess relevance (high, medium, low).

    Text to Analyze:
    """
    ${text.substring(0, 5000)}
    """

    Return ONLY raw JSON. Structure:
    { "type": "string", "summary": "Short arabic summary", "relevance": "string", "pipelineStage": "string", "isUrl": boolean }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    const jsonStr = response.text?.replace(/```json|```/g, '').trim();
    if (!jsonStr) return null;
    
    const result = JSON.parse(jsonStr);

    return {
      id: crypto.randomUUID(),
      content: text,
      type: result.type,
      summary: result.summary,
      relevance: result.relevance,
      timestamp: new Date(),
      pipelineStage: result.pipelineStage,
      metadata: {
        url: result.isUrl ? text : undefined
      }
    };
  } catch (e) {
    console.error("Clipboard Analysis Failed", e);
    return {
      id: crypto.randomUUID(),
      content: text,
      type: 'irrelevant',
      summary: 'فشل التحليل الآلي',
      relevance: 'low',
      timestamp: new Date()
    };
  }
};

// --- Plan & Ideas Tools ---

export const generateProjectPlan = async (chatHistory: string, projectFilesSummary: string, knowledgeBase: string): Promise<PlanNode[]> => {
  const ai = getAiClient();
  if (!ai) return [];

  const prompt = `
    You are a Technical Project Manager. Create a hierarchical Project Plan (Tree Structure).
    
    Knowledge Base (Project Description):
    ${knowledgeBase.substring(0, 8000)}
    
    Current Files Context:
    ${projectFilesSummary.substring(0, 2000)}
    
    Recent Discussions:
    ${chatHistory.substring(0, 2000)}

    Return a JSON array of nodes. Each node: { id, title (Arabic), description (Arabic), status (pending/in_progress/completed), type (feature/structure/task), children: [] }
    Do NOT use Markdown. Just JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    const jsonStr = response.text?.replace(/```json|```/g, '').trim();
    return jsonStr ? JSON.parse(jsonStr) : [];
  } catch (e) {
    console.error("Plan Generation Failed", e);
    return [];
  }
};

export const analyzeIdeaImpact = async (ideaText: string, projectContext: string, knowledgeBase: string): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "Error analyzing idea.";

  const prompt = `
    Analyze this feature idea based on the Knowledge Base and File Context.
    
    Idea: ${ideaText}
    
    Knowledge Base: ${knowledgeBase.substring(0, 3000)}
    Project Context (Files): ${projectContext.substring(0, 2000)}

    Provide an Arabic report covering:
    1. Feasibility.
    2. Where it fits in the architecture.
    3. Implementation steps.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "";
  } catch (e) {
    return "Error connecting to AI.";
  }
};

export const analyzeFullProject = async (fileTree: string, knowledgeBase: string): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "";

  const prompt = `
    Analyze this project structure and knowledge base deeply.
    
    Knowledge Base:
    ${knowledgeBase}

    File Structure:
    ${fileTree}

    Report in Arabic:
    1. Project Type & Goal (Based on Knowledge Base).
    2. Key Technologies (Based on Files).
    3. Gap Analysis (What is in Knowledge Base but missing in Files?).
    4. Structural Recommendations.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "";
  } catch (e) { return ""; }
}