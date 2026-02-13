
import { GoogleGenAI, Chat, GenerateContentResponse, Type } from "@google/genai";
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
    أنت "VibeCode AI"، مهندس برمجيات محترف وخبير في منهجية "Vibe Coding".
    
    مهمتك: مساعدة المستخدم في بناء وتعديل مشروعه البرمجي بالكامل.
    
    قدراتك (Bolt.new Style):
    1. يمكنك تحليل المشروع بالكامل من خلال السياق المقدم.
    2. يمكنك اقتراح تعديلات على الملفات الموجودة أو إنشاء ملفات جديدة.
    3. إذا طلب المستخدم تعديل الكود، قم بالرد بالشرح ثم ألحق الكود بتنسيق خاص ليتمكن التطبيق من تطبيقه تلقائياً.
    
    تنسيق تعديل الملفات:
    عند رغبتك في تعديل ملف أو إنشائه، استخدم قالب JSON التالي في نهاية ردك (داخل وسم <file_changes>):
    <file_changes>
    [
      { "path": "path/to/file.js", "content": "محتوى الملف الكامل الجديد هنا", "action": "update" }
    ]
    </file_changes>

    القواعد:
    1. اعتمد على Knowledge Base كمصدر أساسي للمتطلبات.
    2. تحدث باللغة العربية التقنية بأسلوب "فايب كود" (سريع، ذكي، ومبدع).
    3. دائماً حاول فهم السياق الكامل للمشروع قبل اقتراح تغييرات جذرية.
  `;

  if (knowledgeBase) {
    systemInstruction += `\n\n=== Project Knowledge Base ===\n${knowledgeBase}\n============================`;
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
  knowledgeBase?: string,
  fullProjectContext?: string
): Promise<string> => {
  try {
    let prompt = message;
    
    // Construct Context
    let context = "";
    if (fullProjectContext) {
      context += `FULL PROJECT CONTEXT:\n${fullProjectContext.substring(0, 50000)}\n\n`;
    } else if (activeFile && activeFile.content) {
      context += `Current File (${activeFile.path}):\n${activeFile.content.substring(0, 20000)}\n\n`;
    }

    if (context) {
      prompt = `${context}User Request: ${message}`;
    }

    const response: GenerateContentResponse = await chat.sendMessage({ message: prompt });
    return response.text || "لا يوجد رد.";
  } catch (error) {
    console.error("Chat Error:", error);
    return "حدث خطأ في الاتصال بالذكاء الاصطناعي.";
  }
};

// --- Clipboard & Tools ---

export const analyzeClipboardContent = async (text: string, knowledgeBase?: string): Promise<ClipboardItem | null> => {
  const ai = getAiClient();
  if (!ai) return null;

  const prompt = `
    Analyze this text for a developer tool. Determine its type and relevance.
    Text: "${text.substring(0, 5000)}"
    Return ONLY JSON: { "type": "idea|prompt_tool|link_tool|irrelevant", "summary": "Arabic summary", "relevance": "high|medium|low", "pipelineStage": "frontend|backend|design|planning", "isUrl": boolean }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const result = JSON.parse(response.text);
    return {
      id: crypto.randomUUID(),
      content: text,
      type: result.type,
      summary: result.summary,
      relevance: result.relevance,
      timestamp: new Date(),
      pipelineStage: result.pipelineStage,
      metadata: { url: result.isUrl ? text : undefined }
    };
  } catch (e) {
    return null;
  }
};

export const analyzeFullProject = async (fileTree: string, knowledgeBase: string): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "";

  const prompt = `Analyze this project structure and goals in Arabic:\nGoals: ${knowledgeBase}\nStructure: ${fileTree}`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "";
  } catch (e) { return ""; }
}

export const analyzeIdeaImpact = async (ideaText: string, projectContext: string, knowledgeBase: string): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "";
  const prompt = `Analyze this idea: ${ideaText}\nContext: ${projectContext}\nBase: ${knowledgeBase}\nResponse in Arabic.`;
  const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
  return response.text || "";
};

export const generateProjectPlan = async (history: string, summary: string, kb: string): Promise<PlanNode[]> => {
  const ai = getAiClient();
  if (!ai) return [];
  const prompt = `Create a project plan as JSON array of nodes. Nodes: {id, title, description, status, type, children[]}. Arabic titles.`;
  const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt, config: { responseMimeType: "application/json" } });
  return JSON.parse(response.text);
};
