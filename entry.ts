import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";

function extractJson(text) {
  if (!text) return {};
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return {};
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return {};
  }
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const languageName = body.language_name || "English";
    const strings = body.strings && typeof body.strings === "object" ? body.strings : {};

    const prompt = `You are a professional translator. Translate the following app interface labels into ${languageName}. Return ONLY a valid JSON object that maps each original key to its translation in ${languageName}. Do not include any explanation, only the JSON object. Keep translations natural, concise, and appropriate for a simple care app used by elderly users. Do not translate the keys, only the values.\n\nLabels to translate (JSON):\n${JSON.stringify(strings)}`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
    });

    const translations = typeof result === "string" ? extractJson(result) : result || {};
    return Response.json({ translations });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}