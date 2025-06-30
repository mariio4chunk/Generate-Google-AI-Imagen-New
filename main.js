// === Double Base64 Encoded API Key & URL ===
// Ganti dengan hasil encode 2x key kamu sendiri!
function b64DecodeTwice(str) {
  try { return atob(atob(str)); } catch { return ""; }
}
// Contoh: key = "AIzaSyCyiQa-hKK8bVeYKbg7F35GU_7aGooosgE"
// encode 1x = QUl6YVN5Q3lpUWEtaEtLOGJWZVlLYmc3RjM1R1VfN2FHb29vc2dF
// encode 2x = UVVsNFlWTlZjR3lwVUVhYVRoS1RPZ1ZWTFdTeEcyTTVSM1JHVl9OZ0dhT3d2UzBnRQ==
// Sama cara untuk URL.
const GEMINI_API_KEY_ENC = "UVVsNFlWTlZjR3lwVUVhYVRoS1RPZ1ZWTFdTeEcyTTVSM1JHVl9OZ0dhT3d2UzBnRQ==";
const GEMINI_URL_ENC = "YUhSMGNITTZMeTlqZVc1cmF0SVZlbGd1YUdVeU9tVnVaR29vZ1psWWFCa2NybUZsWW1GbFpXTjBkbWx1WjJsdVkzUmZNVFp6TDFaemEzUmhhR2h5WldGMFlTQnZjbVZ6ZEc5eVpTNXZjbWNnT2dOeVlXSnNiM2NnTmpBd05tRnlaR2x1WjJsdU1EazBMVEp1ZFdWeWJtbHVMV3hzYjNkcGJpNXpkR1Z6ZEhKaFpHbHVkR2c9PQ==";
const GEMINI_API_KEY = b64DecodeTwice(GEMINI_API_KEY_ENC);
const GEMINI_URL = b64DecodeTwice(GEMINI_URL_ENC) + GEMINI_API_KEY;

// --- DOM & Helper ---
const subjectInput = document.getElementById('subject');
const detailInput = document.getElementById('detail');
const settingInput = document.getElementById('setting');
const styleSelect = document.getElementById('style');
const lightingSelect = document.getElementById('lighting');
const compositionSelect = document.getElementById('composition');
const qualitySelect = document.getElementById('quality');
const negativePromptInput = document.getElementById('negativePrompt');
const generateBtn = document.getElementById('generateBtn');
const geminiBtn = document.getElementById('geminiBtn');
const styleGeminiBtn = document.getElementById('styleGeminiBtn');
const negativeGeminiBtn = document.getElementById('negativeGeminiBtn');
const copyBtn = document.getElementById('copyBtn');
const geminiIcon = document.getElementById('geminiIcon');
const geminiLoader = document.getElementById('geminiLoader');
const styleGeminiIcon = document.getElementById('styleGeminiIcon');
const styleGeminiLoader = document.getElementById('styleGeminiLoader');
const negativeGeminiIcon = document.getElementById('negativeGeminiIcon');
const negativeGeminiLoader = document.getElementById('negativeGeminiLoader');
const outputSection = document.getElementById('outputSection');
const finalPromptOutput = document.getElementById('finalPromptOutput');
const copyFeedback = document.getElementById('copyFeedback');
const errorBox = document.getElementById('errorBox');
const errorMessage = document.getElementById('errorMessage');

function showError(message) {
  errorMessage.textContent = message;
  errorBox.classList.remove('hidden');
  setTimeout(() => { errorBox.classList.add('hidden'); }, 4000);
}
function toggleLoader(button, icon, loader, isLoading) {
  button.disabled = isLoading;
  icon.classList.toggle('hidden', isLoading);
  loader.classList.toggle('hidden', !isLoading);
}
function setSelectValue(select, value) {
  if (!value) return false;
  const aiVal = value.trim().toLowerCase().replace(/[_\-]/g, ' ').replace(/\s+/g, ' ').trim();
  for (const opt of select.options) {
    const optVal = opt.value.trim().toLowerCase().replace(/[_\-]/g, ' ').replace(/\s+/g, ' ').trim();
    if (aiVal === optVal) {
      select.value = opt.value;
      return true;
    }
  }
  return false;
}

async function callGemini(prompt, schema) {
  const payload = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema
    }
  };
  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    let errorMsg = "Terjadi kesalahan pada API.";
    try {
      const errorBody = await response.json();
      errorMsg = errorBody.error?.message || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }
  const result = await response.json();
  if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
    try {
      return JSON.parse(result.candidates[0].content.parts[0].text);
    } catch {
      throw new Error("Respons AI tidak valid.");
    }
  } else {
    throw new Error("Respons AI tidak valid atau kosong.");
  }
}

// --- Event: Kembangkan Ide ---
geminiBtn.addEventListener('click', async () => {
  toggleLoader(geminiBtn, geminiIcon, geminiLoader, true);
  const userIdea = subjectInput.value.trim();
  const prompt = userIdea
    ? `Expand this simple idea into a detailed image concept: "${userIdea}". Provide a creative subject, a specific action, and a compelling setting.`
    : `Generate a single, random, creative, and visually interesting concept for an image. Provide a subject, a specific action, and a compelling setting.`;
  const schema = { type: "OBJECT", properties: { "subject": { "type": "STRING" }, "detail": { "type": "STRING" }, "setting": { "type": "STRING" } }, required: ["subject", "detail", "setting"] };
  try {
    const res = await callGemini(prompt, schema);
    subjectInput.value = res.subject || '';
    detailInput.value = res.detail || '';
    settingInput.value = res.setting || '';
  } catch (error) {
    showError(`Gagal mendapatkan ide: ${error.message}`);
  } finally {
    toggleLoader(geminiBtn, geminiIcon, geminiLoader, false);
  }
});

// --- Event: Gaya Otomatis ---
styleGeminiBtn.addEventListener('click', async () => {
  const concept = [subjectInput.value, detailInput.value, settingInput.value].filter(Boolean).join(', ');
  if (!concept) {
    showError("Isi 'Detail Utama' dulu untuk dapat saran gaya.");
    return;
  }
  toggleLoader(styleGeminiBtn, styleGeminiIcon, styleGeminiLoader, true);
  const prompt = `For the image concept "${concept}", suggest the best artistic style. Pick one value for each field from the available options.`;
  const schema = { type: "OBJECT", properties: { "style": { "type": "STRING" }, "lighting": { "type": "STRING" }, "composition": { "type": "STRING" } }, required: ["style", "lighting", "composition"] };
  try {
    const res = await callGemini(prompt, schema);
    const styleOk = setSelectValue(styleSelect, res.style);
    const lightingOk = setSelectValue(lightingSelect, res.lighting);
    const compositionOk = setSelectValue(compositionSelect, res.composition);
    let err = [];
    if (!styleOk) err.push(`Style "${res.style}" tidak ditemukan`);
    if (!lightingOk) err.push(`Pencahayaan "${res.lighting}" tidak ditemukan`);
    if (!compositionOk) err.push(`Komposisi "${res.composition}" tidak ditemukan`);
    if (err.length) showError(err.join(', '));
  } catch (error) {
    showError(`Gagal dapat saran gaya: ${error.message}`);
  } finally {
    toggleLoader(styleGeminiBtn, styleGeminiIcon, styleGeminiLoader, false);
  }
});

// --- Event: Negative Prompt ---
negativeGeminiBtn.addEventListener('click', async () => {
  const concept = [subjectInput.value, detailInput.value, settingInput.value].filter(Boolean).join(', ');
  if (!concept) {
    showError("Isi 'Detail Utama' dulu untuk dapat saran negatif.");
    return;
  }
  toggleLoader(negativeGeminiBtn, negativeGeminiIcon, negativeGeminiLoader, true);
  const prompt = `Based on the image concept "${concept}", list the most important negative keywords to avoid common AI image generation issues like bad anatomy, blurriness, or weird artifacts. Return as a concise comma-separated string.`;
  const schema = { type: "OBJECT", properties: { "negative_keywords": { "type": "STRING" } }, required: ["negative_keywords"] };
  try {
    const res = await callGemini(prompt, schema);
    negativePromptInput.value = res.negative_keywords || negativePromptInput.value;
  } catch (error) {
    showError(`Gagal dapat saran negatif: ${error.message}`);
  } finally {
    toggleLoader(negativeGeminiBtn, negativeGeminiIcon, negativeGeminiLoader, false);
  }
});

// --- Event: Generate ---
generateBtn.addEventListener('click', () => {
  const subject = subjectInput.value.trim();
  const detail = detailInput.value.trim();
  const setting = settingInput.value.trim();
  const style = styleSelect.value.trim();
  const lighting = lightingSelect.value.trim();
  const composition = compositionSelect.value.trim();
  const quality = qualitySelect.value.trim();
  const negative = negativePromptInput.value.trim();

  if (!subject || !detail || !setting) {
    showError("Isi semua bagian 'Detail Utama' terlebih dahulu!");
    return;
  }
  let prompt = `${subject}, ${detail}, ${setting}`;
  if (style) prompt += `, ${style}`;
  if (lighting) prompt += `, ${lighting}`;
  if (composition) prompt += `, ${composition}`;
  if (quality) prompt += `, ${quality}`;
  if (negative) prompt += ` --no ${negative}`;

  finalPromptOutput.textContent = prompt;
  outputSection.classList.remove('hidden');
});

if (copyBtn) {
  copyBtn.addEventListener('click', () => {
    const text = finalPromptOutput.textContent;
    if (!text) return;
    navigator.clipboard.writeText(text);
    copyFeedback.classList.remove('hidden');
    setTimeout(() => copyFeedback.classList.add('hidden'), 1200);
  });
}
window.addEventListener('resize', () => {
  errorBox.classList.add('hidden');
});