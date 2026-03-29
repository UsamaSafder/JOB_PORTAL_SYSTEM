const fs = require('fs');
const path = require('path');

let pdfParse = null;
let mammoth = null;
let PDFParser = null;

function lazyLoadParsers() {
  if (!pdfParse) {
    try {
      const pdfModule = require('pdf-parse');
      pdfParse = typeof pdfModule === 'function' ? pdfModule : pdfModule?.default;
    } catch (error) {
      pdfParse = null;
    }
  }

  if (!mammoth) {
    try {
      mammoth = require('mammoth');
    } catch (error) {
      mammoth = null;
    }
  }

  if (!PDFParser) {
    try {
      const pdf2jsonModule = require('pdf2json');
      PDFParser = pdf2jsonModule?.default || pdf2jsonModule;
    } catch (error) {
      PDFParser = null;
    }
  }
}

async function extractTextWithPdf2Json(filePath) {
  if (!PDFParser) return '';

  return new Promise((resolve) => {
    try {
      const parser = new PDFParser();
      parser.on('pdfParser_dataError', () => resolve(''));
      parser.on('pdfParser_dataReady', (data) => {
        try {
          const pages = data?.Pages || [];
          const lines = [];

          for (const page of pages) {
            const texts = page?.Texts || [];
            for (const t of texts) {
              const runs = t?.R || [];
              for (const run of runs) {
                const raw = run?.T || '';
                const decoded = decodeURIComponent(raw);
                if (decoded) lines.push(decoded);
              }
            }
          }

          resolve(lines.join(' '));
        } catch (error) {
          resolve('');
        }
      });
      parser.loadPDF(filePath);
    } catch (error) {
      resolve('');
    }
  });
}

async function extractTextFromResume(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return '';

  lazyLoadParsers();

  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.pdf' && pdfParse) {
    const buffer = fs.readFileSync(filePath);
    try {
      const result = await pdfParse(buffer);
      const primary = result?.text || '';
      if (primary.trim().length > 0) return primary;
      return await extractTextWithPdf2Json(filePath);
    } catch (error) {
      return await extractTextWithPdf2Json(filePath);
    }
  }

  if (ext === '.pdf') {
    return await extractTextWithPdf2Json(filePath);
  }

  if ((ext === '.docx' || ext === '.doc') && mammoth) {
    const result = await mammoth.extractRawText({ path: filePath });
    return result?.value || '';
  }

  return '';
}

function cleanupText(value) {
  const normalized = String(value || '')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const lines = normalized.split('\n').map((line) => normalizeBrokenSpacing(line));
  return lines.join('\n');
}

function normalizeBrokenSpacing(line) {
  const source = String(line || '').trim();
  if (!source) return '';

  const tokens = source.split(/\s+/).filter(Boolean);
  const output = [];
  let run = [];

  const isSingleOrSymbol = (token) => token.length === 1 || /^[.@:/+_#\-]$/.test(token);

  const flushRun = () => {
    if (run.length === 0) return;
    if (run.length >= 3) {
      output.push(run.join(''));
    } else {
      output.push(run.join(' '));
    }
    run = [];
  };

  for (const token of tokens) {
    if (isSingleOrSymbol(token)) {
      run.push(token);
    } else {
      flushRun();
      output.push(token);
    }
  }

  flushRun();

  return output.join(' ');
}

function pickFirstMatch(text, regex) {
  const m = text.match(regex);
  return m?.[1] || m?.[0] || '';
}

function normalizePhone(raw) {
  const cleaned = String(raw || '').replace(/[^\d+]/g, '');
  if (!cleaned) return '';
  if (cleaned.length < 10 || cleaned.length > 16) return '';
  return cleaned;
}

function parseSkills(text) {
  const fromLine = pickFirstMatch(text, /(?:^|\n)\s*skills?\s*[:\-]\s*([^\n]+)/i);
  const values = (fromLine || '')
    .split(/[;,|]/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (values.length === 0) {
    const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const knownSkills = [
      'JavaScript', 'TypeScript', 'React', 'Angular', 'Node.js', 'Express', 'HTML', 'CSS', 'SQL',
      'MySQL', 'MongoDB', 'Python', 'Java', 'C++', 'Git', 'GitHub', 'REST', 'API', 'PHP'
    ];

    for (const skill of knownSkills) {
      const regex = new RegExp(`\\b${escapeRegExp(skill)}\\b`, 'i');
      if (regex.test(text)) values.push(skill);
    }
  }

  const unique = Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
  return unique.slice(0, 20).join(', ');
}

function parseEducation(text) {
  const labeled = pickFirstMatch(text, /(?:^|\n)\s*(?:education|qualification)\s*[:\-]\s*([^\n]+)/i);
  if (labeled) return labeled;

  const degreeMatch = pickFirstMatch(
    text,
    /\b(BS|BSc|MS|MSc|Bachelor(?:'s)?|Master(?:'s)?|PhD|Intermediate|Matric)[^\n,.]{0,80}/i
  );
  return degreeMatch || '';
}

function parseLocation(text) {
  const labeled = pickFirstMatch(text, /(?:^|\n)\s*(?:location|address|city)\s*[:\-]\s*([^\n]+)/i);
  if (labeled) return labeled;

  const cityMatch = pickFirstMatch(
    text,
    /\b(Karachi|Lahore|Islamabad|Rawalpindi|Faisalabad|Peshawar|Multan|Hyderabad|Sialkot)\b(?:\s*,\s*Pakistan)?/i
  );
  return cityMatch || '';
}

function sanitizeExtractedUrl(url) {
  if (!url) return '';
  let value = String(url).trim();

  const nextProtocolIndex = value.toLowerCase().indexOf('/https://', 8);
  const nextProtocolIndexHttp = value.toLowerCase().indexOf('/http://', 8);
  const cutIndex = [nextProtocolIndex, nextProtocolIndexHttp].filter((i) => i > -1).sort((a, b) => a - b)[0];
  if (cutIndex > -1) value = value.slice(0, cutIndex);

  const sectionMatch = value.match(/(SUMMARY|EXPERIENCE|EDUCATION|PROJECTS|SKILLS|CERTIFICATIONS)/i);
  if (sectionMatch && sectionMatch.index > 0) {
    value = value.slice(0, sectionMatch.index);
  }

  value = value.replace(/[)\],.;]+$/, '');
  return value;
}

function extractUrls(text) {
  const parts = String(text || '').split(/(?=https?:\/\/)/gi);
  const urls = [];

  for (const part of parts) {
    if (!/^https?:\/\//i.test(part)) continue;
    const firstToken = part.split(/\s+/)[0] || '';
    const cleaned = sanitizeExtractedUrl(firstToken);
    if (cleaned) urls.push(cleaned);
  }

  return Array.from(new Set(urls));
}

function parseName(text, email) {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 8);

  for (const line of lines) {
    if (email && line.toLowerCase().includes(String(email).toLowerCase())) continue;
    if (/resume|curriculum vitae|cv|profile/i.test(line)) continue;
    if (/^[A-Za-z][A-Za-z\s.'-]{2,60}$/.test(line)) return line;
  }

  return '';
}

function extractResumeProfileData(rawText) {
  const text = cleanupText(rawText);
  if (!text) return {};

  const extractionText = text
    .replace(/(https?:\/\/)/gi, ' $1')
    .replace(/([A-Za-z]{2,10})(https?:\/\/)/g, '$1 $2');

  const email = pickFirstMatch(
    extractionText,
    /[A-Za-z][A-Za-z0-9._%+-]{0,63}@[A-Za-z0-9.-]{2,253}\.[A-Za-z]{2,10}(?![A-Za-z])/i
  );
  const phoneRaw = pickFirstMatch(extractionText, /(?:\+?\d[\d\s().-]{8,}\d)/);
  const phone = normalizePhone(phoneRaw);

  const allUrls = extractUrls(extractionText);
  const linkedinUrl = allUrls.find((url) => /linkedin\.com/i.test(url)) || '';
  const portfolioUrl = allUrls.find((url) => !/linkedin\.com/i.test(url)) || '';

  const experienceRaw = pickFirstMatch(
    text,
    /(?:experience|work experience|professional experience)\s*[:\-]?\s*(\d{1,2})\+?\s*(?:years?|yrs?)/i
  ) || pickFirstMatch(text, /(\d{1,2})\+?\s*(?:years?|yrs?)\s+of\s+experience/i);
  const experienceYears = experienceRaw ? Number.parseInt(experienceRaw, 10) : null;

  const location = parseLocation(text);
  const education = parseEducation(text);
  const bio = pickFirstMatch(text, /(?:^|\n)\s*(?:summary|profile|objective)\s*[:\-]\s*([^\n]+)/i);
  const skills = parseSkills(text);
  const fullName = parseName(text, email);

  return {
    fullName: fullName || undefined,
    email: email || undefined,
    phone: phone || undefined,
    skills: skills || undefined,
    experienceYears: Number.isFinite(experienceYears) ? experienceYears : undefined,
    location: location || undefined,
    education: education || undefined,
    bio: bio || undefined,
    linkedinUrl: linkedinUrl || undefined,
    portfolioUrl: portfolioUrl || undefined
  };
}

module.exports = {
  extractTextFromResume,
  extractResumeProfileData
};