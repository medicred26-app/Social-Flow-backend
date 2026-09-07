import { AI_CONFIG } from './ai.config.js';
import { createLogger } from '../middleware/logger.js';

const logger = createLogger('AIProvider');

export class AiConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AiConfigError';
  }
}

export class AiApiError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'AiApiError';
    this.statusCode = statusCode;
  }
}

function requireApiKey() {
  const apiKey = AI_CONFIG.apiKey;
  if (!apiKey || apiKey.includes('your-') || apiKey === 'YOUR_AI_API_KEY') {
    throw new AiConfigError('Gemini is not configured. Add GEMINI_API_KEY to backend/.env.');
  }
  return apiKey;
}

function parseJsonContent(content) {
  if (!content) throw new AiApiError('AI Provider returned an empty response.');
  if (typeof content === 'object') return content;
  const cleaned = String(content)
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new AiApiError('AI Provider response was not valid JSON.');
  }
}

function geminiHeaders(apiKey) {
  return {
    'Content-Type': 'application/json',
    'x-goog-api-key': apiKey,
  };
}

async function callGeminiContent({ systemPrompt, userPrompt, responseFormat = 'json', model, extraParts = [] }) {
  const apiKey = requireApiKey();
  const endpoint = `${AI_CONFIG.baseUrl}/models/${model || AI_CONFIG.model}:generateContent`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_CONFIG.timeoutMs);

  const body = {
    systemInstruction: { parts: [{ text: systemPrompt || 'You are a helpful social media assistant.' }] },
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }, ...extraParts],
      },
    ],
    generationConfig: {
      temperature: 0.7,
    },
  };

  if (responseFormat === 'json') {
    body.generationConfig.responseMimeType = 'application/json';
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: geminiHeaders(apiKey),
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const raw = await res.text();
    if (!res.ok) {
      logger.error(`Gemini HTTP ${res.status}:`, raw.slice(0, 500));
      throw mapHttpError(res.status);
    }

    const data = JSON.parse(raw);
    const parts = data.candidates?.[0]?.content?.parts || [];
    const text = parts.map((p) => p.text || '').join('\n').trim();
    const images = parts
      .filter((p) => p.inlineData?.data)
      .map((p) => `data:${p.inlineData.mimeType || 'image/png'};base64,${p.inlineData.data}`);

    if (responseFormat === 'json') {
      return parseJsonContent(text);
    }
    return { text, images, raw: data };
  } catch (err) {
    clearTimeout(timeoutId);
    throw wrapProviderError(err);
  }
}

async function callOpenAiCompatible({ systemPrompt, userPrompt, responseFormat = 'json' }) {
  const apiKey = requireApiKey();
  const endpoint = `${AI_CONFIG.baseUrl}/chat/completions`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_CONFIG.timeoutMs);

  const payload = {
    model: AI_CONFIG.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
  };
  if (responseFormat === 'json') {
    payload.response_format = { type: 'json_object' };
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      logger.error(`AI HTTP ${res.status}:`, errText.slice(0, 500));
      throw mapHttpError(res.status);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    return responseFormat === 'json' ? parseJsonContent(content) : content;
  } catch (err) {
    clearTimeout(timeoutId);
    throw wrapProviderError(err);
  }
}

function mapHttpError(status) {
  if (status === 401 || status === 403) {
    return new AiApiError('Invalid GEMINI_API_KEY. Check the key in backend/.env.', status);
  }
  if (status === 429) {
    return new AiApiError('Gemini rate limit exceeded. Try again in a moment.', status);
  }
  if (status === 404) {
    return new AiApiError('Gemini model was not found for this API key.', status);
  }
  return new AiApiError(`Gemini error (${status}): unable to complete the request.`, status);
}

function wrapProviderError(err) {
  if (err.name === 'AbortError') {
    return new AiApiError('AI request timed out. Please try again.');
  }
  if (err instanceof AiConfigError || err instanceof AiApiError) {
    return err;
  }
  logger.error('Unexpected AI provider error:', err);
  return new AiApiError(err.message || 'Failed to connect to Gemini.');
}

export async function callLlmProvider({ systemPrompt, userPrompt, responseFormat = 'json' }) {
  if (AI_CONFIG.provider === 'gemini') {
    return callGeminiContent({ systemPrompt, userPrompt, responseFormat });
  }
  return callOpenAiCompatible({ systemPrompt, userPrompt, responseFormat });
}

export async function generateGeminiImage({ prompt, aspectRatio = '1:1' }) {
  const models = [
    AI_CONFIG.imageModel,
    'gemini-2.5-flash-image',
    'gemini-2.0-flash-preview-image-generation',
    'gemini-2.0-flash-exp-image-generation',
  ];
  let lastError;
  for (const model of [...new Set(models)]) {
    try {
      const result = await callGeminiContent({
        systemPrompt:
          'You generate a single high-quality social media image. Prefer photorealistic marketing visuals. Do not include watermarks.',
        userPrompt: `Create a social media ${aspectRatio} image for: ${prompt}`,
        responseFormat: 'text',
        model,
      });
      if (result.images?.[0]) {
        return { imageUrl: result.images[0], model, prompt };
      }
    } catch (err) {
      lastError = err;
      logger.warn(`Image model ${model} failed: ${err.message}`);
    }
  }
  throw lastError || new AiApiError('Gemini image generation is not available for this API key.');
}

export async function generateGeminiVideo({ prompt, aspectRatio = '9:16', durationSeconds = 8 }) {
  const apiKey = requireApiKey();
  const models = [
    AI_CONFIG.videoModel,
    'veo-3.1-fast-generate-preview',
    'veo-3.1-generate-preview',
    'veo-2.0-generate-001',
  ];
  const seconds = [4, 6, 8].includes(Number(durationSeconds)) ? Number(durationSeconds) : 8;
  let lastError;

  for (const model of [...new Set(models)]) {
    try {
      const start = await fetch(`${AI_CONFIG.baseUrl}/models/${model}:predictLongRunning`, {
        method: 'POST',
        headers: geminiHeaders(apiKey),
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: {
            aspectRatio,
            durationSeconds: seconds,
            sampleCount: 1,
          },
        }),
      });
      const startText = await start.text();
      if (!start.ok) {
        lastError = mapHttpError(start.status);
        logger.warn(`Veo model ${model} failed: ${startText.slice(0, 300)}`);
        continue;
      }

      const started = JSON.parse(startText);
      const operationName = started.name;
      if (!operationName) {
        lastError = new AiApiError('Gemini video start did not return an operation.');
        continue;
      }

      const deadline = Date.now() + AI_CONFIG.videoTimeoutMs;
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 4000));
        const poll = await fetch(`${AI_CONFIG.baseUrl}/${operationName}`, {
          headers: geminiHeaders(apiKey),
        });
        const pollData = await poll.json();
        if (pollData.error) {
          throw new AiApiError(pollData.error.message || 'Gemini video generation failed.');
        }
        if (!pollData.done) continue;

        const sample =
          pollData.response?.generateVideoResponse?.generatedSamples?.[0] ||
          pollData.response?.generatedSamples?.[0];
        const uri = sample?.video?.uri || sample?.video?.url;
        const b64 = sample?.video?.bytesBase64Encoded;

        if (b64) {
          return {
            videoUrl: `data:video/mp4;base64,${b64}`,
            model,
            prompt,
            aspectRatio,
            durationSeconds: seconds,
          };
        }
        if (uri) {
          return {
            videoUrl: `/api/ai/media/proxy?uri=${encodeURIComponent(uri)}`,
            sourceUri: uri,
            model,
            prompt,
            aspectRatio,
            durationSeconds: seconds,
          };
        }
        throw new AiApiError('Gemini finished video generation but returned no file.');
      }
      throw new AiApiError('Gemini video generation timed out. Try a shorter prompt.');
    } catch (err) {
      lastError = wrapProviderError(err);
    }
  }

  throw lastError || new AiApiError('Gemini Veo video is not enabled for this API key.');
}

export async function proxyGeminiMedia(uri) {
  const apiKey = requireApiKey();
  const res = await fetch(uri, { headers: { 'x-goog-api-key': apiKey } });
  if (!res.ok) {
    throw new AiApiError('Could not download generated Gemini media.', res.status);
  }
  const contentType = res.headers.get('content-type') || 'video/mp4';
  const buffer = Buffer.from(await res.arrayBuffer());
  return { contentType, buffer };
}
