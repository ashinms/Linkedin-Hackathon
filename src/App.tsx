import React, { useState, useEffect, useRef, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import { 
  Upload, Zap, Mic, Users, Sparkles, Database, BarChart2,
  ChevronDown, ChevronUp, CheckCircle, CheckSquare, Square, Send, Brain, Download, 
  MessageSquare, AlertTriangle, Clock, ListTodo, ShieldAlert, FileText, UserCheck, RefreshCw, Compass,
  X, RotateCcw, Trash2, Plus, Type, ArrowRight, AlertCircle, MicOff, Lightbulb, User, Edit2, 
  Save, CheckCircle2, Loader2, ClipboardList, TrendingUp, Keyboard, Phone, MessageCircle, Award, VolumeX,
  Sun, Moon
} from 'lucide-react';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import Groq from 'groq-sdk';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/* ==========================================================================
   SECTION 1. TYPES & INTERFACES (survey.ts)
   ========================================================================== */
export interface Question {
  id: string;
  fieldName: string;
  type: 'string' | 'enum';
  options?: string[];
}

export interface Survey {
  id: string;
  name: string;
  questions: Question[];
}

export interface CoachingOverview {
  surveyName: string;
  totalQuestions: number;
  estimatedDuration: string;
  surveyFlow: string[];
  conversationalApproach: string;
  participantPersona: string;
  coachPersona: string;
}

export interface QuestionCoaching {
  questionId: string;
  question: string;
  naturalPhrasing: string[];
  commonMistakes: string[];
  followUpTips: string[];
  stealthIntegration?: string;
}

export interface RecordingAnalysis {
  score: number;
  answeredQuestions: string[];
  unansweredQuestions: string[];
  unclearQuestions: string[];
  extractedResponses: Record<string, string>;
  improvementAnalysis?: {
    strengths: string[];
    weaknesses: string[];
    actionableTips: string[];
  };
  needsAndWants?: string[];
  detailedFeedback?: { category: string; score: number; feedback: string }[];
}

export interface CommunityInitiative {
  id: string;
  title: string;
  category: 'Outreach Event' | 'Activity' | 'Financial Bursary' | 'Upskilling' | 'Other';
  description: string;
  eligibility: string;
  organisation?: string;
  contactPhone?: string;
  contactEmail?: string;
  website?: string;
}

export interface ReferralRecommendation {
  initiativeId: string;
  initiativeTitle: string;
  category: string;
  matchReason: string;
  priority: 'High' | 'Medium' | 'Low';
  selected?: boolean;
  followedUp?: boolean;
  status?: 'Matched' | 'Drafted' | 'Dispatched' | 'Approved' | 'Closed';
}

export interface DispatchedEmail {
  id: string;
  recipient: string;
  recipientType: 'Participant' | 'Organisation';
  subject: string;
  body: string;
  timestamp: number;
}

export interface ParticipantProfile {
  id: string;
  surveyId: string;
  timestamp: number;
  responses: Record<string, string>;
  textSummary?: string;
  completeness: number;
  analysis?: RecordingAnalysis;
  referrals?: ReferralRecommendation[];
  dispatchedEmails?: DispatchedEmail[];
  interviewerNotes?: string;
}

export interface CumulativeInsights {
  executiveSummary: string;
  commonProblems: {
    problemName: string;
    description: string;
    prevalencePercentage: number;
    severity: 'High' | 'Medium' | 'Low';
  }[];
  correlations: string[];
  proactiveInitiatives: {
    id: string;
    title: string;
    description: string;
    completed: boolean;
  }[];
}

export const DEFAULT_INITIATIVES: CommunityInitiative[] = [
  {
    id: 'init-1',
    title: 'ComCare Short-to-Medium Term Assistance (SMTA)',
    category: 'Financial Bursary',
    description: 'Provides temporary financial aid, assistance with household bills, and job search support for low-income individuals or families in Singapore.',
    eligibility: 'Monthly household income of $1,900 and below, or Per Capita Income (PCI) of $650 and below.',
    organisation: 'Social Service Office (SSO)',
    contactPhone: '1800-222-0000',
    contactEmail: 'MSF_ComCare@msf.gov.sg',
    website: 'www.msf.gov.sg'
  },
  {
    id: 'init-2',
    title: 'SkillsFuture Credit & Career Transition Programme',
    category: 'Upskilling',
    description: 'Provides subsidized vocational training courses and job placement services to help Singaporeans reskill and transition to new industries.',
    eligibility: 'Singapore Citizens aged 25 and above; additional subsidies for mid-career workers aged 40+.',
    organisation: 'SkillsFuture Singapore (SSG)',
    contactPhone: '6785-5785',
    contactEmail: 'feedback@ssg.gov.sg',
    website: 'www.skillsfuture.gov.sg'
  },
  {
    id: 'init-3',
    title: 'CDC Vouchers Scheme',
    category: 'Outreach Event',
    description: 'Distributes community vouchers to households to spend at participating local heartland merchants, hawkers, and supermarkets.',
    eligibility: 'All Singaporean households are eligible to claim municipal CDC voucher credits.',
    organisation: 'Community Development Councils (CDC)',
    contactPhone: '6225-5324',
    contactEmail: 'cdc_vouchers@pa.gov.sg',
    website: 'vouchers.cdc.gov.sg'
  },
  {
    id: 'init-4',
    title: 'Seniors Go Digital & Mobile Access Scheme',
    category: 'Activity',
    description: 'Provides one-on-one digital mentoring and subsidized smartphones with data plans to help seniors stay connected.',
    eligibility: 'Singapore Citizens aged 60 and above; eligible for subsidies if holding public assistance cards.',
    organisation: 'Infocomm Media Development Authority (IMDA)',
    contactPhone: '6377-3800',
    contactEmail: 'sgdigitaloffice@imda.gov.sg',
    website: 'www.imda.gov.sg/seniorsgodigital'
  },
  {
    id: 'init-5',
    title: 'Mendaki Youth Mentoring & Career Navigator',
    category: 'Activity',
    description: 'Connects students and young jobseekers with industry professionals for career planning, soft skills development, and guidance.',
    eligibility: 'Malay/Muslim youths, students, and young jobseekers aged 16 to 30.',
    organisation: 'Yayasan Mendaki',
    contactPhone: '6245-5555',
    contactEmail: 'mentoring@mendaki.org.sg',
    website: 'www.mendaki.org.sg'
  },
  {
    id: 'init-6',
    title: 'Meals-on-Wheels Food Delivery Services',
    category: 'Activity',
    description: 'Daily home-delivery of subsidized warm, nutritious lunch and dinner meals to homebound elderly residents.',
    eligibility: 'Frail elderly aged 60+ or disabled individuals living alone with severe mobility constraints.',
    organisation: 'Touch Community Services',
    contactPhone: '6804-6565',
    contactEmail: 'homecare@touch.org.sg',
    website: 'www.touch.org.sg'
  },
  {
    id: 'init-7',
    title: 'KiFAS & Childcare Financial Subsidies',
    category: 'Financial Bursary',
    description: 'Subsidizes infant care, childcare, and kindergarten fees to help lower-income families afford early childhood education.',
    eligibility: 'Singapore Citizen children enrolled in licensed childcare centres; monthly gross household income below $12,000.',
    organisation: 'Early Childhood Development Agency (ECDA)',
    contactPhone: '6735-9213',
    contactEmail: 'contact@ecda.gov.sg',
    website: 'www.ecda.gov.sg'
  },
  {
    id: 'init-8',
    title: 'FSC Casework and Counselling Services',
    category: 'Other',
    description: 'Provides free casework guidance, family mediation, stress counselling, and referral support for residents facing socio-emotional challenges.',
    eligibility: 'Available to all Singapore residents, particularly low-income families and vulnerable individuals.',
    organisation: 'Family Service Centres (FSC)',
    contactPhone: '1800-222-0000',
    contactEmail: 'fsc_services@msf.gov.sg',
    website: 'www.msf.gov.sg'
  },
  {
    id: 'init-9',
    title: 'Enhancement for Active Seniors (EASE) Program',
    category: 'Activity',
    description: 'Retrofits HDB flats with elder-friendly modifications like grab bars, slip-resistant bathroom tiles, and wheelchair ramps.',
    eligibility: 'Singapore Citizen HDB flat owner with a resident elderly household member aged 65 and above or with mobility impairments.',
    organisation: 'Housing & Development Board (HDB)',
    contactPhone: '6490-1111',
    contactEmail: 'hdbfeedback@mailbox.hdb.gov.sg',
    website: 'www.hdb.gov.sg'
  },
  {
    id: 'init-10',
    title: 'NEU PC Plus Programme',
    category: 'Other',
    description: 'Offers subsidized computers and broadband internet to low-income households, students, and persons with disabilities.',
    eligibility: 'Singapore Citizens or Permanent Residents; gross monthly household income up to $3,400 or PCI up to $900.',
    organisation: 'Infocomm Media Development Authority (IMDA)',
    contactPhone: '6377-3800',
    contactEmail: 'neupc@imda.gov.sg',
    website: 'www.imda.gov.sg/neupc'
  },
  {
    id: 'init-11',
    title: 'Silver Support Scheme',
    category: 'Financial Bursary',
    description: 'Provides quarterly cash payouts to lower-income Singaporean seniors who had low wages during their working years and have minimal family support.',
    eligibility: 'Singapore Citizens aged 65 and above; CPF contributions up to $140,000; household live in 1-5 room HDB flat with PCI up to $1,800.',
    organisation: 'Central Provident Fund (CPF) Board',
    contactPhone: '1800-227-1188',
    contactEmail: 'member@cpf.gov.sg',
    website: 'www.cpf.gov.sg'
  },
  {
    id: 'init-12',
    title: 'Workfare Income Supplement (WIS) Scheme',
    category: 'Financial Bursary',
    description: 'Boosts the income and CPF savings of lower-income Singaporean workers, encouraging them to stay employed and upskill.',
    eligibility: 'Singapore Citizens aged 30 and above; earning gross monthly income up to $2,500; living in properties with annual value up to $21,000.',
    organisation: 'Ministry of Manpower (MOM)',
    contactPhone: '1800-536-8333',
    contactEmail: 'mom_feedback@mom.gov.sg',
    website: 'www.mom.gov.sg/workfare'
  }
];

/* Shared Fuzzy-Matching Utilities */
export const getDiceCoefficient = (s1: string, s2: string): number => {
  const getBigrams = (str: string) => {
    const bigrams = new Set<string>();
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.add(str.substring(i, i + 2));
    }
    return bigrams;
  };
  if (s1 === s2) return 1;
  if (s1.length < 2 || s2.length < 2) return 0;
  const b1 = getBigrams(s1);
  const b2 = getBigrams(s2);
  let intersection = 0;
  for (const b of b1) {
    if (b2.has(b)) intersection++;
  }
  return (2 * intersection) / (b1.size + b2.size);
};

export const isQuestionCovered = (messageText: string, questionText: string): boolean => {
  const cleanMsg = messageText.toLowerCase();
  const cleanQ = questionText.toLowerCase().replace(/\(.*?\)/g, '').trim();

  if (cleanMsg.includes(cleanQ)) return true;

  const stopWords = new Set(['what', 'where', 'when', 'which', 'who', 'whom', 'how', 'why', 'your', 'please', 'about', 'would', 'could', 'should', 'with', 'from', 'this', 'that', 'have', 'been', 'the', 'and', 'are', 'for', 'you', 'can', 'our', 'out', 'any', 'has', 'had', 'was', 'were', 'the']);
  const qKeywords = cleanQ
    .replace(/[?.,!/\\()]/g, ' ')
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length >= 3)
    .filter(w => !stopWords.has(w));

  if (qKeywords.length === 0) return false;

  const matchCount = qKeywords.filter(keyword => cleanMsg.includes(keyword)).length;
  const ratio = matchCount / qKeywords.length;
  const threshold = qKeywords.length <= 2 ? 0.5 : 0.6;
  if (ratio >= threshold) return true;

  if (qKeywords.length >= 2) {
    const bigrams: string[] = [];
    for (let i = 0; i < qKeywords.length - 1; i++) {
      bigrams.push(`${qKeywords[i]} ${qKeywords[i + 1]}`);
    }
    const matchedBigrams = bigrams.filter(bigram => cleanMsg.includes(bigram));
    if (matchedBigrams.length >= Math.max(1, Math.ceil(bigrams.length * 0.4))) {
      return true;
    }
  }

  const msgWords = cleanMsg
    .replace(/[?.,!/\\()]/g, ' ')
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length >= 3);

  const fuzzyMatchCount = qKeywords.filter(keyword => {
    if (cleanMsg.includes(keyword)) return true;
    return msgWords.some(msgWord => getDiceCoefficient(keyword, msgWord) >= 0.8);
  }).length;

  const fuzzyRatio = fuzzyMatchCount / qKeywords.length;
  const fuzzyThreshold = qKeywords.length <= 2 ? 0.5 : 0.6;
  return fuzzyRatio >= fuzzyThreshold;
};

export const alignExtractedResponses = (
  extracted: Record<string, string>,
  questions: Question[]
): Record<string, string> => {
  const aligned: Record<string, string> = {};
  
  questions.forEach(q => {
    aligned[q.fieldName] = '';
  });

  if (!extracted) return aligned;

  const extractedKeys = Object.keys(extracted);
  const matchedKeys = new Set<string>();
  const cleanStr = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '').trim();

  // Step 2: Exact or case-insensitive exact matches
  questions.forEach(q => {
    const qClean = cleanStr(q.fieldName);
    if (extracted[q.fieldName] !== undefined) {
      aligned[q.fieldName] = extracted[q.fieldName];
      matchedKeys.add(q.fieldName);
      return;
    }
    const matchedKey = extractedKeys.find(k => cleanStr(k) === qClean);
    if (matchedKey) {
      aligned[q.fieldName] = extracted[matchedKey];
      matchedKeys.add(matchedKey);
    }
  });

  // Step 3: Match by number/index indicators
  questions.forEach((q, idx) => {
    if (aligned[q.fieldName]) return;
    const qNum = idx + 1;
    const numPatterns = [`q${qNum}`, `question${qNum}`, `question_${qNum}`, `qn${qNum}`, `${qNum}`];
    const matchedKey = extractedKeys.find(k => {
      if (matchedKeys.has(k)) return false;
      return numPatterns.includes(cleanStr(k));
    });
    if (matchedKey) {
      aligned[q.fieldName] = extracted[matchedKey];
      matchedKeys.add(matchedKey);
    }
  });

  // Step-4: Substring matching or dice coefficient fuzzy matching
  questions.forEach(q => {
    if (aligned[q.fieldName]) return;
    const qClean = cleanStr(q.fieldName);
    let bestKey: string | null = null;
    let highestScore = 0;

    extractedKeys.forEach(k => {
      if (matchedKeys.has(k)) return;
      const kClean = cleanStr(k);
      
      if (qClean.includes(kClean) && kClean.length >= 3) {
        const score = kClean.length / qClean.length;
        if (score > highestScore) {
          highestScore = score;
          bestKey = k;
        }
      } else if (kClean.includes(qClean) && qClean.length >= 3) {
        const score = qClean.length / kClean.length;
        if (score > highestScore) {
          highestScore = score;
          bestKey = k;
        }
      } else {
        const dice = getDiceCoefficient(qClean, kClean);
        if (dice > 0.4 && dice > highestScore) {
          highestScore = dice;
          bestKey = k;
        }
      }
    });

    if (bestKey && highestScore > 0.3) {
      aligned[q.fieldName] = extracted[bestKey];
      matchedKeys.add(bestKey);
    }
  });

  // Step 5: Fill remaining values by position index order
  questions.forEach((q, idx) => {
    if (aligned[q.fieldName]) return;
    const unmatchedKeys = extractedKeys.filter(k => !matchedKeys.has(k));
    if (unmatchedKeys.length > 0 && idx < extractedKeys.length) {
      const candidateKey = extractedKeys[idx];
      if (!matchedKeys.has(candidateKey)) {
        aligned[q.fieldName] = extracted[candidateKey];
        matchedKeys.add(candidateKey);
      }
    }
  });

  return aligned;
};


/* ==========================================================================
   SECTION 2. SERVICES & API INTEGRATION (services.ts)
   ========================================================================== */
export interface ParsedDocument {
  text: string;
  fileName: string;
  fileType: string;
  success: boolean;
  error?: string;
}

export class FileParser {
  private async parseDocx(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  private async parsePdf(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    return fullText.trim();
  }

  private async parseTxt(file: File): Promise<string> {
    return await file.text();
  }

  async parseFile(file: File): Promise<ParsedDocument> {
    const fileName = file.name;
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';

    try {
      let text = '';
      switch (fileExtension) {
        case 'docx':
          text = await this.parseDocx(file);
          break;
        case 'pdf':
          text = await this.parsePdf(file);
          break;
        case 'txt':
          text = await this.parseTxt(file);
          break;
        default:
          throw new Error(`Unsupported file type: .${fileExtension}`);
      }

      return { text: text.trim(), fileName, fileType: fileExtension, success: true };
    } catch (error) {
      return {
        text: '',
        fileName,
        fileType: fileExtension,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = ['docx', 'pdf', 'txt'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';

    if (!allowedTypes.includes(fileExtension)) {
      return {
        valid: false,
        error: `File type .${fileExtension} not supported. Use .docx, .pdf, or .txt.`
      };
    }
    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds 10MB limit.' };
    }
    return { valid: true };
  }
}
export const fileParser = new FileParser();

export interface SpeechService {
  startListening(onTranscript: (t: string) => void): Promise<void>;
  stopListening(): Promise<string>;
  speak(text: string): Promise<void>;
  stopSpeaking(): void;
  isAvailable(): boolean;
}

export class WebSpeechService implements SpeechService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private synthesis: SpeechSynthesis;
  private onTranscriptCallback: ((t: string) => void) | null = null;
  private recognition: any = null;

  constructor() {
    this.synthesis = window.speechSynthesis;
  }

  async startListening(onTranscript: (t: string) => void): Promise<void> {
    this.audioChunks = [];
    this.onTranscriptCallback = onTranscript;
    onTranscript("Listening... Start speaking to see live transcription.");

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      try {
        const rec = new SpeechRecognitionClass();
        rec.continuous = true;
        rec.interimResults = true;
        rec.onresult = (event: any) => {
          let transcript = '';
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          if (this.onTranscriptCallback && transcript.trim()) {
            this.onTranscriptCallback(transcript);
          }
        };
        rec.onerror = (err: any) => console.error("SpeechRecognition error:", err);
        rec.start();
        this.recognition = rec;
      } catch (e) {
        console.warn("Failed to initialize native SpeechRecognition:", e);
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) this.audioChunks.push(event.data);
      };
      this.mediaRecorder.start(250);
    } catch (err) {
      console.error("Failed to start MediaRecorder:", err);
      throw err;
    }
  }

  async stopListening(): Promise<string> {
    if (this.recognition) {
      try { this.recognition.stop(); } catch (e) {}
      this.recognition = null;
    }

    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        resolve("");
        return;
      }

      this.mediaRecorder.onstop = async () => {
        try {
          const stream = this.mediaRecorder?.stream;
          stream?.getTracks().forEach(track => track.stop());

          const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder?.mimeType || 'audio/webm' });
          if (audioBlob.size < 100) {
            resolve("");
            return;
          }

          if (this.onTranscriptCallback) {
            this.onTranscriptCallback("Processing high-quality transcription with AI...");
          }

          const ext = (this.mediaRecorder?.mimeType || 'audio/webm').split(';')[0].split('/')[1] || 'webm';
          const audioFile = new File([audioBlob], `recording.${ext}`, { type: audioBlob.type });

          const apiKey = import.meta.env.VITE_GROQ_API_KEY;
          if (!apiKey) throw new Error("VITE_GROQ_API_KEY missing");

          const formData = new FormData();
          formData.append('file', audioFile);
          formData.append('model', 'whisper-large-v3');

          const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}` },
            body: formData
          });

          if (!response.ok) {
            const errBody = await response.json().catch(() => ({}));
            throw new Error(errBody.error?.message || `HTTP error! status: ${response.status}`);
          }

          const result = await response.json();
          resolve((result.text || "").trim());
        } catch (error) {
          console.error("Groq Whisper failed:", error);
          reject(error);
        }
      };
      this.mediaRecorder.stop();
    });
  }

  async speak(text: string): Promise<void> {
    if (!this.synthesis) return;
    return new Promise(resolve => {
      const u = new SpeechSynthesisUtterance(text);
      u.onend = () => resolve();
      u.onerror = () => resolve();
      this.synthesis.speak(u);
    });
  }

  stopSpeaking(): void {
    if (this.synthesis) this.synthesis.cancel();
  }

  isAvailable(): boolean { return true; }
}
export const createSpeechService = (): SpeechService => new WebSpeechService();

export interface AIService {
  parseSurvey(text: string): Promise<Survey>;
  generateCoachingOverview(survey: Survey): Promise<CoachingOverview>;
  generateQuestionCoaching(survey: Survey): Promise<QuestionCoaching[]>;
  generateSingleQuestionCoaching(questionId: string, questionText: string, survey?: Survey): Promise<QuestionCoaching>;
  analyzeTranscript(transcript: string, survey: Survey): Promise<RecordingAnalysis>;
  generatePracticeResponse(userMessage: string, survey: Survey, history: any, persona?: string): Promise<string>;
  generatePracticeFeedback(transcript: string, survey: Survey, coachPersona?: string): Promise<any>;
  matchReferrals(responses: Record<string, string>, initiatives: CommunityInitiative[], interviewerNotes?: string): Promise<ReferralRecommendation[]>;
  scourInitiativesForSurvey(survey: Survey): Promise<CommunityInitiative[]>;
  generateCumulativeInsights(profiles: ParticipantProfile[], survey: Survey): Promise<CumulativeInsights>;
}

const MOCK_LOOKUPS = {
  name: {
    phrasings: ['May I know who I have the pleasure of speaking with today?', 'Could you share your name with me?'],
    mistakes: ['Mispronouncing the participant\'s name without checking.', 'Sounding transactional or rushed when introducing yourself.'],
    tips: ['Ask how they prefer to be addressed.', 'Use their name naturally later to build rapport.']
  },
  income: {
    phrasings: ['If comfortable sharing, which bracket does your monthly income fall into?', 'To help match schemes, could you share your approximate income range?'],
    mistakes: ['Sounding judgmental or embarrassed when asking about finances.', 'Pressuring the participant if they hesitate to share.'],
    tips: ['Emphasize that all details are kept strictly confidential.', 'If they decline, skip to other eligibility questions.']
  },
  employment: {
    phrasings: ['What does your day-to-day look like at the moment in terms of work?', 'Could you tell me a bit about your current job or employment situation?'],
    mistakes: ['Making assumptions about employment stability.', 'Sounding dismissive or awkward if they mention being unemployed.'],
    tips: ['Ask how long they have been in this role.', 'Probe if they are interested in upskilling or job placement.']
  },
  digital: {
    phrasings: ['How reliable would you say your internet connection and devices are?', 'Do you feel you have the digital access and tools you need?'],
    mistakes: ['Assuming familiarity with technical terms.', 'Overlooking subtle barriers like sharing a single phone in a family.'],
    tips: ['Ask what devices they use most often.', 'Inquire if anyone needs devices for school or remote work.']
  },
  age: {
    phrasings: ['To help categorize feedback, what age bracket do you belong to?', 'Would you mind sharing which age range you fall into?'],
    mistakes: ['Asking for exact birth year too abruptly.', 'Showing surprise or making ageist remarks.'],
    tips: ['Remind them they can select a broad bracket.', 'Thank them and proceed smoothly.']
  }
};

export class MockAIService implements AIService {
  async parseSurvey(_text: string): Promise<Survey> {
    return {
      id: `survey-${Date.now()}`,
      name: 'Community Support & Needs Assessment Survey',
      questions: [
        { id: 'q1', fieldName: 'What is your full name?', type: 'string' },
        { id: 'q2', fieldName: 'What is your age?', type: 'string' },
        { id: 'q3', fieldName: 'What is your current employment status? (Options: Employed, Unemployed, Retired)', type: 'enum', options: ['Employed', 'Unemployed', 'Retired'] },
        { id: 'q4', fieldName: 'Rate your access to reliable digital services at home (1-5)?', type: 'enum', options: ['1 - Poor', '3 - Moderate', '5 - Excellent'] },
        { id: 'q5', fieldName: 'What is your monthly household income bracket?', type: 'enum', options: ['Under $1900', '$1900 - $3000', 'Over $3000'] }
      ]
    };
  }

  async generateCoachingOverview(survey: Survey): Promise<CoachingOverview> {
    return {
      surveyName: survey.name,
      totalQuestions: survey.questions.length,
      estimatedDuration: '5 minutes',
      surveyFlow: ['Rapport Building', 'Core Questions', 'Closing Feedback'],
      conversationalApproach: 'Establish high rapport by listening carefully and validating participant hardships.',
      participantPersona: 'A natural, responsive Singapore resident looking for support.',
      coachPersona: 'Rigorous and critical interviewer coach. Evaluate conversational flow, question clarity, and empathy.'
    };
  }

  async generateQuestionCoaching(survey: Survey): Promise<QuestionCoaching[]> {
    return Promise.all(survey.questions.map(q => this.generateSingleQuestionCoaching(q.id, q.fieldName, survey)));
  }

  async generateSingleQuestionCoaching(questionId: string, questionText: string, _survey?: Survey): Promise<QuestionCoaching> {
    const qText = questionText.toLowerCase();
    let data = {
      phrasings: ['How would you describe your situation with this in your own words?', 'If you don\'t mind sharing, could you tell me a bit about this?'],
      mistakes: ['Asking in a rigid, robotic tone.', 'Rushing past their response without acknowledging it.'],
      tips: ['Validate their response and ask how it impacts their life.', 'Ask if they could share a brief example.']
    };

    if (qText.includes('name')) data = MOCK_LOOKUPS.name;
    else if (qText.includes('income') || qText.includes('$') || qText.includes('earn')) data = MOCK_LOOKUPS.income;
    else if (qText.includes('employment') || qText.includes('work') || qText.includes('job')) data = MOCK_LOOKUPS.employment;
    else if (qText.includes('digital') || qText.includes('internet') || qText.includes('device')) data = MOCK_LOOKUPS.digital;
    else if (qText.includes('age') || qText.includes('year') || qText.includes('old')) data = MOCK_LOOKUPS.age;

    return {
      questionId,
      question: questionText,
      naturalPhrasing: data.phrasings,
      commonMistakes: data.mistakes,
      followUpTips: data.tips,
      stealthIntegration: "Integrate this question casually during rapport building or when discussing their general background rather than asking it directly."
    };
  }

  async analyzeTranscript(_t: string, survey: Survey): Promise<RecordingAnalysis> {
    const extracted: Record<string, string> = {};
    if (survey && survey.questions) {
      survey.questions.forEach((q, idx) => {
        if (idx === 0) extracted[q.fieldName] = "Alex Chen";
        else if (idx === 1) extracted[q.fieldName] = "34";
        else if (q.fieldName.toLowerCase().includes('income') || q.fieldName.toLowerCase().includes('salary')) extracted[q.fieldName] = "$1,500";
        else if (q.fieldName.toLowerCase().includes('employment') || q.fieldName.toLowerCase().includes('job')) extracted[q.fieldName] = "Unemployed";
        else extracted[q.fieldName] = `Mock response for ${q.fieldName}`;
      });
    }

    return {
      score: 85,
      answeredQuestions: survey?.questions.map(q => q.fieldName) || [],
      unansweredQuestions: [],
      unclearQuestions: [],
      extractedResponses: extracted,
      improvementAnalysis: {
        strengths: ['Active listening', 'Polite tone'],
        weaknesses: ['Missed standard phrasing templates'],
        actionableTips: ['Confirm participant details clearly']
      },
      detailedFeedback: [
        { category: 'Conversational Flow', score: 88, feedback: 'Great flow, allowed the participant to share their stories without interruption.' },
        { category: 'Clarity & Rephrasing', score: 80, feedback: 'Rephrased questions well, though a few standard prompts could be tighter.' },
        { category: 'Empathy & Active Listening', score: 90, feedback: 'Validated answers and showed strong emotional support.' }
      ]
    };
  }

  async generatePracticeResponse(userMessage: string, _s: Survey, _h: any, persona?: string): Promise<string> {
    const pStr = (persona || '').toLowerCase();
    const isElderly = pStr.includes('tan') || pStr.includes('elderly');
    const isBusy = pStr.includes('sarah') || pStr.includes('busy');
    const isStressed = pStr.includes('raju') || pStr.includes('stressed');
    const isSkeptical = pStr.includes('skeptical') || pStr.includes('distrustful');
    const isRushed = pStr.includes('rushed') || pStr.includes('impatient');
    const isConfused = pStr.includes('confused') || pStr.includes('forgetful');

    if (isRushed) return "Can we move quickly? I'm running short on time.";
    if (isSkeptical) return "Why do you need to know that? Is it strictly confidential?";
    if (isConfused) return "Wait, what did you ask? Could you explain that in simpler words?";
    if (isElderly) return "Ah, back in my day things were simpler. Could you speak up a bit and explain what that means?";
    if (isBusy) return "Hold on, my kids are crying. Okay, what was the question? Make it fast.";
    if (isStressed) return "I don't know if I want to share that. It's personal and I am worried about it.";
    return "I see. Could you share what the next question is?";
  }

  async generatePracticeFeedback(_t: string, survey: Survey, _cp?: string): Promise<any> {
    return {
      overallScore: 85,
      duration: '5 minutes',
      questionsAsked: 5,
      totalQuestions: survey.questions.length,
      strengths: ['Clear communication', 'Active listening', 'Empathetic tone'],
      improvements: ['Maintain eye contact', 'Avoid interrupting', 'Ask more open‑ended follow‑ups'],
      detailedFeedback: [
        { category: 'Rapport & Empathy', score: 88, feedback: 'Great warmth and tone. You made the participant feel respected and safe.', suggestions: ['Try using more reflective affirmations like "That sounds challenging, thank you for sharing."'] },
        { category: 'Pacing & Conversational Flow', score: 75, feedback: 'Generally good tempo, but you occasionally rushed into the next question without letting the participant expand.', suggestions: ['Allow 2-3 seconds of silence after a participant stops talking to give them space for deeper responses.'] },
        { category: 'Question Phrasing & Clarity', score: 70, feedback: 'You read some questions word-for-word, which felt a bit transactional.', suggestions: ['Focus on stealth integration; rephrase questions naturally into the conversation instead of reading from the template.'] },
        { category: 'Active Probing & Follow-up', score: 62, feedback: 'When the respondent mentioned income strain, you skipped straight to digital literacy instead of probing for details.', suggestions: ['Ask soft follow-ups like "Could you share a bit more about what makes that difficult?" when they signal distress.'] },
        { category: 'Questionnaire Coverage', score: 80, feedback: 'You successfully completed most of the key fields in the questionnaire.', suggestions: ['Ensure that you cover the optional feedback question at the end if time permits.'] }
      ]
    };
  }

  async matchReferrals(_responses: Record<string, string>, initiatives: CommunityInitiative[], _interviewerNotes?: string): Promise<ReferralRecommendation[]> {
    if (initiatives.length === 0) return [];
    return [{
      initiativeId: initiatives[0].id,
      initiativeTitle: initiatives[0].title,
      category: initiatives[0].category,
      matchReason: "Based on their challenges, this program is highly recommended.",
      priority: "High"
    }];
  }

  async scourInitiativesForSurvey(survey: Survey): Promise<CommunityInitiative[]> {
    return [
      { id: `init-mock-1`, title: `Financial Support for ${survey.name}`, category: 'Financial Bursary', description: 'Mock financial program related to the survey topics.', eligibility: 'Assessed based on questionnaire outcome.' },
      { id: `init-mock-2`, title: `Upskilling Program for ${survey.name}`, category: 'Upskilling', description: 'Mock training and placement classes.', eligibility: 'Unemployed or low-income residents.' }
    ];
  }

  async generateCumulativeInsights(profiles: ParticipantProfile[], survey: Survey): Promise<CumulativeInsights> {
    const totalCount = profiles.length;
    const surveyName = survey?.name || 'Community Needs Assessment';
    return {
      executiveSummary: `This cumulative analysis compiles feedback from ${totalCount} respondent${totalCount === 1 ? '' : 's'} who completed the ${surveyName}. The data points to a high prevalence of financial stress due to inflation, coupled with low awareness of digital training programs among senior participants. Immediate community-level intervention is recommended to bridge these resource gaps.`,
      commonProblems: [
        {
          problemName: "Cost of Living & Food Inflation",
          description: "Respondents report struggling to afford basic household items and groceries, leading to severe budgeting constraints.",
          prevalencePercentage: totalCount > 0 ? 65 : 0,
          severity: "High"
        },
        {
          problemName: "Lack of Digital Literacy & Device Access",
          description: "Frail and elderly participants express low confidence in navigating smartphones or online services, which isolates them from modern digital infrastructure.",
          prevalencePercentage: totalCount > 0 ? 45 : 0,
          severity: "Medium"
        },
        {
          problemName: "Employment Disruption & Low Wage Stagnation",
          description: "Working-age respondents face unstable work arrangements or require upskilling support to transition into higher-paying, stable jobs.",
          prevalencePercentage: totalCount > 0 ? 35 : 0,
          severity: "High"
        }
      ],
      correlations: [
        "Elderly respondents over the age of 60 correlate heavily (85%) with lack of digital literacy and device sharing.",
        "Underemployed households are 3x more likely to need ComCare short-to-medium term assistance.",
        "A strong pattern shows childcare demands are preventing female heads of households from taking full-time job roles."
      ],
      proactiveInitiatives: [
        {
          id: "pro-1",
          title: "Block-by-Block Digital Literacy Helpdesks",
          description: "Deploy youth volunteers to block void decks on weekends to help seniors download municipal apps and claim CDC vouchers.",
          completed: false
        },
        {
          id: "pro-2",
          title: "Bulk Purchase Food Distribution Drive",
          description: "Partner with a local charity to distribute dry ration bags monthly to residents flagged as high-need financial bursary candidates.",
          completed: false
        },
        {
          id: "pro-3",
          title: "SkillsFuture Career Caravan",
          description: "Organize a mobile career counseling and training enrolment booth inside the community center during the upcoming roadshow.",
          completed: false
        }
      ]
    };
  }
}

export class GroqService implements AIService {
  private groq: Groq | null = null;
  private mockService = new MockAIService();

  constructor(apiKey: string) {
    if (!apiKey) {
      console.warn('VITE_GROQ_API_KEY missing, GroqService falling back to MockAIService');
    } else {
      try {
        this.groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });
      } catch (e) {
        console.error('Failed to initialize Groq client, falling back to MockAIService', e);
      }
    }
  }

  private parseResponse<T>(content: string | null): T {
    if (!content) return {} as T;
    try {
      const start = content.indexOf('{');
      const end = content.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        return JSON.parse(content.substring(start, end + 1).replace(/[\u0000-\u001F\u007F-\u009F]/g, ''));
      }
      return JSON.parse(content);
    } catch {
      return {} as T;
    }
  }

  private async callGroqJSON<T>(apiCall: () => Promise<any>, fallbackCall: () => Promise<T>, methodName: string): Promise<T> {
    if (!this.groq) return fallbackCall();
    const maxRetries = 3;
    let delay = 1000;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await apiCall();
        const content = response.choices[0].message.content;
        const res = this.parseResponse<T>(content);
        if (res && Object.keys(res).length > 0) return res;
      } catch (err: any) {
        if (attempt === maxRetries) break;
        const waitTime = (err?.status === 429 || err?.message?.includes('429')) ? delay * 2.5 : delay;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        delay *= 2;
      }
    }
    return fallbackCall();
  }

  private async callGroqString(apiCall: () => Promise<any>, fallbackCall: () => Promise<string>, methodName: string): Promise<string> {
    if (!this.groq) return fallbackCall();
    const maxRetries = 3;
    let delay = 1000;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await apiCall();
        const content = response.choices[0].message.content;
        if (content) return content;
      } catch (err: any) {
        if (attempt === maxRetries) break;
        const waitTime = (err?.status === 429 || err?.message?.includes('429')) ? delay * 2.5 : delay;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        delay *= 2;
      }
    }
    return fallbackCall();
  }

  async parseSurvey(text: string): Promise<Survey> {
    return this.callGroqJSON<any>(
      () => this.groq!.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'Strict, literal information extraction bot. JSON only.' },
          {
            role: 'user',
            content: `Task: Extract a complete, ordered list of survey questions from the raw document text: "${text}".
Guidelines:
1. ONLY extract questions that appear verbatim in the text. Do NOT invent, infer, or add any questions.
2. Provide a concise, professional survey name based on its purpose.
3. For each question, output:
   - "id": a unique identifier (e.g., "q1").
   - "fieldName": the exact question text as it appears.
   - "type": "string" unless the question includes explicit multiple‑choice options, in which case use "enum" and list the options array.
JSON format:
{
  "name": "Professional Survey Title",
  "questions": [
    { "id": "q1", "fieldName": "What is your name?", "type": "string" }
  ]
}`
          }
        ],
        response_format: { type: 'json_object' }
      }),
      () => this.mockService.parseSurvey(text),
      'parseSurvey'
    ).then(res => ({
      id: `survey-${Date.now()}`,
      name: res.name || 'Survey',
      questions: (Array.isArray(res.questions) ? res.questions : []).map((q: any, i: number) => ({
        ...q,
        id: `q${i + 1}`,
        fieldName: q.fieldName || `Question ${i + 1}`
      }))
    }));
  }

  async generateCoachingOverview(survey: Survey): Promise<CoachingOverview> {
    return this.callGroqJSON<CoachingOverview>(
      () => this.groq!.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'You are an expert conversational designer and interviewer coach. JSON only.' },
          {
            role: 'user',
            content: `Design a detailed training lab strategy for survey: "${survey.name}" (questions: ${JSON.stringify(survey.questions)}). 
Guidelines:
1. Participant persona: background, Demographics, attitude, typical answers, and enforce a rule to NEVER break character, never mention AI.
2. Coach persona: define explicit grading criteria with Empathy, active listening, bias avoidance.
3. Interview flow: define 4-5 named steps with descriptions.
4. Estimated duration: calculate minutes based on average speaking rate of 130 wpm.
Return ONLY pure JSON matching this schema:
{
  "surveyName": "${survey.name}",
  "totalQuestions": ${survey.questions.length},
  "estimatedDuration": "<numeric> minutes",
  "surveyFlow": ["Step 1", "Step 2"],
  "conversationalApproach": "2-3 sentence advice.",
  "participantPersona": "2-3 sentence description.",
  "coachPersona": "2-3 sentence grading criteria."
}`
          }
        ],
        response_format: { type: 'json_object' }
      }),
      () => this.mockService.generateCoachingOverview(survey),
      'generateCoachingOverview'
    ).then(res => {
      res.surveyFlow = this.normalizeSurveyFlow(res.surveyFlow);
      if (res.estimatedDuration) {
        const raw = String(res.estimatedDuration);
        const match = raw.match(/([0-9.]+)/);
        if (match) {
          const num = Math.round(parseFloat(match[1]));
          res.estimatedDuration = `${num} minutes`;
        }
      }
      if (!res.participantPersona) {
        res.participantPersona = `Realistic roleplay participant for ${survey.name}. Be natural, brief, and authentic to a real human respondent without sounding like an AI assistant.`;
      } else if (typeof res.participantPersona === 'object') {
        res.participantPersona = JSON.stringify(res.participantPersona, null, 2);
      }
      if (!res.coachPersona) {
        res.coachPersona = `Rigorous coach. AUTHENTIC evaluation. JSON only.`;
      } else if (typeof res.coachPersona === 'object') {
        res.coachPersona = JSON.stringify(res.coachPersona, null, 2);
      }
      return res;
    });
  }

  private normalizeSurveyFlow(flow: any): string[] {
    if (!flow) return ["Intro", "Core", "Probing", "Closing"];
    if (Array.isArray(flow)) {
      return flow.map((item) => {
        if (!item) return "";
        if (typeof item === 'string') {
          try {
            const trimmed = item.trim();
            if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
              const parsed = JSON.parse(trimmed);
              const stepName = parsed.id || parsed.stepName || parsed.name || parsed.step || parsed.title || parsed.label || parsed.phase || '';
              const desc = parsed.description || parsed.desc || parsed.explanation || '';
              if (stepName && desc) return `${stepName} - ${desc}`;
              if (stepName) return stepName;
              if (desc) return desc;
            }
          } catch {
            // Treat as regular string
          }
          return item;
        }
        if (typeof item === 'object') {
          const stepName = item.id || item.stepName || item.name || item.step || item.title || item.label || item.phase || '';
          const desc = item.description || item.desc || item.explanation || '';
          if (stepName && desc) {
            return `${stepName} - ${desc}`;
          }
          if (stepName) return stepName;
          if (desc) return desc;
          
          const keys = Object.keys(item);
          if (keys.length === 1) return `${keys[0]}: ${typeof item[keys[0]] === 'object' ? JSON.stringify(item[keys[0]]) : item[keys[0]]}`;
          return item.name || item.step || JSON.stringify(item);
        }
        return String(item);
      }).filter(Boolean);
    }
    return ["Intro", "Core", "Probing", "Closing"];
  }

  async generateQuestionCoaching(survey: Survey): Promise<QuestionCoaching[]> {
    return this.callGroqJSON<{ questions: any[] }>(
      () => this.groq!.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'Expert interview training assistant. JSON only.' },
          {
            role: 'user',
            content: `We are conducting a survey called "${survey.name}". Generate coaching guidelines for the following survey questions, taking the context of the survey into account:\n${survey.questions.map(q => `- [${q.id}] ${q.fieldName}`).join('\n')}`
          }
        ],
        response_format: { type: 'json_object' }
      }),
      async () => ({ questions: await this.mockService.generateQuestionCoaching(survey) }),
      'generateQuestionCoaching'
    ).then(res => (Array.isArray(res.questions) ? res.questions : []).map((q, i) => ({
      ...q,
      questionId: survey.questions[i]?.id || q.questionId
    })));
  }

  async generateSingleQuestionCoaching(questionId: string, questionText: string, survey?: Survey): Promise<QuestionCoaching> {
    const surveyContext = survey ? `We are conducting a survey called "${survey.name}". The other questions in this survey are:\n${survey.questions.map(q => `- ${q.fieldName}`).join('\n')}\n\n` : '';
    return this.callGroqJSON<any>(
      () => this.groq!.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'Expert interview training assistant. You must output a JSON object containing guidelines for the interviewer. JSON only.' },
          {
            role: 'user',
            content: `${surveyContext}For the survey question: "${questionText}" (id: ${questionId}), generate coaching advice taking the context of this survey into account.
Return ONLY a JSON object with this exact structure:
{
  "naturalPhrasing": [
    "A warmer or more natural way to ask this question",
    "Another conversational phrasing option"
  ],
  "commonMistakes": [
    "A mistake interviewers commonly make when asking this",
    "Another mistake to avoid"
  ],
  "followUpTips": [
    "A tip on how to handle responses or follow up",
    "Another follow-up tip"
  ],
  "stealthIntegration": "A 1-2 sentence tactical recommendation on how to weave this topic/question naturally into a conversation without sounding like reading from a survey script."
}`
          }
        ],
        response_format: { type: 'json_object' }
      }),
      () => this.mockService.generateSingleQuestionCoaching(questionId, questionText, survey),
      'generateSingleQuestionCoaching'
    ).then(res => {
      const naturalPhrasing = Array.isArray(res.naturalPhrasing) ? res.naturalPhrasing : 
                            Array.isArray(res.natural_phrasing) ? res.natural_phrasing :
                            Array.isArray(res.phrasings) ? res.phrasings : [];
                            
      const commonMistakes = Array.isArray(res.commonMistakes) ? res.commonMistakes : 
                           Array.isArray(res.common_mistakes) ? res.common_mistakes :
                           Array.isArray(res.mistakes) ? res.mistakes : [];
                           
      const followUpTips = Array.isArray(res.followUpTips) ? res.followUpTips : 
                         Array.isArray(res.follow_up_tips) ? res.follow_up_tips :
                         Array.isArray(res.tips) ? res.tips : [];

      const stealthIntegration = typeof res.stealthIntegration === 'string' ? res.stealthIntegration :
                                 typeof res.stealth_integration === 'string' ? res.stealth_integration :
                                 'Weave this topic naturally into conversation based on the participant\'s narrative.';

      return {
        questionId,
        question: questionText,
        naturalPhrasing: naturalPhrasing.length > 0 ? naturalPhrasing : ["Ask the question naturally and listen carefully."],
        commonMistakes: commonMistakes.length > 0 ? commonMistakes : ["Asking in a rigid tone."],
        followUpTips: followUpTips.length > 0 ? followUpTips : ["Acknowledge and validate the response."],
        stealthIntegration
      };
    });
  }

  async analyzeTranscript(transcript: string, survey: Survey): Promise<RecordingAnalysis> {
    const prompt = `We are conducting a survey called "${survey.name}". The full set of questions in this survey is:
${survey.questions.map(q => `- ${q.fieldName} (${q.type})`).join('\n')}

Analyze the interview transcript for this survey.
Transcript: "${transcript}"

Please evaluate the interviewer's performance taking the context of this survey into account, and extract the participant's answers.

Survey Questions to extract:
${survey.questions.map(q => `- ${q.fieldName} (${q.type})`).join('\n')}

Return JSON in this format:
{
  "score": 0-100, // Quality score for the interviewer
  "answeredQuestions": ["fieldName"], 
  "unansweredQuestions": ["fieldName"],
  "unclearQuestions": ["fieldName"],
  "extractedResponses": {
    "question fieldName": "extracted answer value" // Use the exact fieldName or close match as the key
  },
  "improvementAnalysis": {
    "strengths": ["string"],
    "weaknesses": ["string"],
    "actionableTips": ["string"]
  },
  "needsAndWants": ["string"],
  "detailedFeedback": [
    { "category": "Conversational Flow", "score": 0-100, "feedback": "feedback text" },
    { "category": "Clarity & Rephrasing", "score": 0-100, "feedback": "feedback text" },
    { "category": "Empathy & Active Listening", "score": 0-100, "feedback": "feedback text" }
  ]
}`;

    return this.callGroqJSON<RecordingAnalysis>(
      () => this.groq!.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'Precise semantic text extractor and quality evaluator. JSON only.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
      }),
      () => this.mockService.analyzeTranscript(transcript, survey),
      'analyzeTranscript'
    ).then(res => {
      if (res) {
        if (res.improvementAnalysis) {
          const imp = res.improvementAnalysis;
          if (Array.isArray(imp.strengths)) {
            imp.strengths = imp.strengths.map((s: any) => typeof s === 'object' ? s.description || s.text || s.strength || JSON.stringify(s) : String(s));
          }
          if (Array.isArray(imp.weaknesses)) {
            imp.weaknesses = imp.weaknesses.map((w: any) => typeof w === 'object' ? w.description || w.text || w.weakness || JSON.stringify(w) : String(w));
          }
          if (Array.isArray(imp.actionableTips)) {
            imp.actionableTips = imp.actionableTips.map((t: any) => typeof t === 'object' ? t.description || t.text || t.tip || JSON.stringify(t) : String(t));
          }
        }
        if (Array.isArray(res.detailedFeedback)) {
          res.detailedFeedback = res.detailedFeedback.map((df: any) => {
            return {
              category: String(df.category || df.name || 'General'),
              score: typeof df.score === 'number' ? df.score : parseInt(String(df.score || 0), 10),
              feedback: String(df.feedback || df.description || df.text || '')
            };
          });
        }
      }
      return res;
    });
  }

  async generatePracticeResponse(userMessage: string, survey: Survey, history: any, persona?: string): Promise<string> {
    const systemPrompt = `You are a participant being interviewed for: "${survey.name}".
Persona: ${persona || `A typical respondent`}.
CRITICAL RULES: Stay in character. Never mention AI. Keep it to 1-3 natural conversational sentences maximum.`;

    return this.callGroqString(
      () => this.groq!.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          ...history.slice(-6),
          { role: 'user', content: userMessage }
        ]
      }),
      () => this.mockService.generatePracticeResponse(userMessage, survey, history, persona),
      'generatePracticeResponse'
    );
  }

  async generatePracticeFeedback(transcript: string, survey: Survey, coachPersona?: string): Promise<any> {
    const prompt = `We are conducting a survey called "${survey.name}". The full set of questions in this survey is:
${survey.questions.map(q => `- ${q.fieldName}`).join('\n')}

Grade the interviewer's performance in this practice transcript for "${survey.name}" taking the context of this survey into account:
"${transcript}"

You must evaluate them across exactly these 5 distinct coaching metrics:
1. "Rapport & Empathy" (How warm, respectful, and safe they made the respondent feel)
2. "Pacing & Conversational Flow" (Pacing of questions, conversational comfort, avoiding abrupt changes or interruptions)
3. "Question Phrasing & Clarity" (How naturally and clearly questions were integrated into dialogue rather than sounding transactional or read verbatim)
4. "Active Probing & Follow-up" (Ability to ask supportive follow-up questions when the respondent hints at challenges)
5. "Questionnaire Coverage" (How cleanly and naturally they retrieved the required survey answers without badgering)

Return JSON with this exact schema:
{
  "overallScore": 0-100,
  "duration": "X mins",
  "questionsAsked": X,
  "strengths": ["...", "..."],
  "improvements": ["...", "..."],
  "detailedFeedback": [
    {
      "category": "Rapport & Empathy",
      "score": 0-100,
      "feedback": "Detailed evaluation text describing how they performed in this category.",
      "suggestions": ["Specific actionable suggestion to improve this category."]
    },
    {
      "category": "Pacing & Conversational Flow",
      "score": 0-100,
      "feedback": "...",
      "suggestions": ["..."]
    },
    {
      "category": "Question Phrasing & Clarity",
      "score": 0-100,
      "feedback": "...",
      "suggestions": ["..."]
    },
    {
      "category": "Active Probing & Follow-up",
      "score": 0-100,
      "feedback": "...",
      "suggestions": ["..."]
    },
    {
      "category": "Questionnaire Coverage",
      "score": 0-100,
      "feedback": "...",
      "suggestions": ["..."]
    }
  ]
}`;

    return this.callGroqJSON<any>(
      () => this.groq!.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: coachPersona ? `${coachPersona} You are a professional coach. JSON only.` : 'Rigorous interviewer coach. JSON only.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
      }),
      () => this.mockService.generatePracticeFeedback(transcript, survey, coachPersona),
      'generatePracticeFeedback'
    ).then(res => {
      if (res) {
        res.totalQuestions = survey.questions.length;
        res.questionsAsked = typeof res.questionsAsked === 'number' ? res.questionsAsked : parseInt(String(res.questionsAsked || 0), 10);
        
        // Normalize alternative keys
        if (!res.strengths && res.strength) {
          res.strengths = Array.isArray(res.strength) ? res.strength : [res.strength];
        }
        if (!res.improvements && res.improvement) {
          res.improvements = Array.isArray(res.improvement) ? res.improvement : [res.improvement];
        }
        if (!res.improvements && res.weaknesses) {
          res.improvements = Array.isArray(res.weaknesses) ? res.weaknesses : [res.weaknesses];
        }
        if (!res.improvements && res.areas_for_improvement) {
          res.improvements = Array.isArray(res.areas_for_improvement) ? res.areas_for_improvement : [res.areas_for_improvement];
        }

        if (!Array.isArray(res.strengths)) res.strengths = [];
        if (!Array.isArray(res.improvements)) res.improvements = [];

        res.improvements = res.improvements.map((item: any) => {
          if (item && typeof item === 'object') {
            return item.description || item.text || item.improvement || JSON.stringify(item);
          }
          return String(item);
        });

        res.strengths = res.strengths.map((item: any) => {
          if (item && typeof item === 'object') {
            return item.description || item.text || item.strength || JSON.stringify(item);
          }
          return String(item);
        });
      }
      return res;
    });
  }

  async matchReferrals(responses: Record<string, string>, initiatives: CommunityInitiative[], interviewerNotes?: string): Promise<ReferralRecommendation[]> {
    if (initiatives.length === 0) return [];
    
    const prompt = `You are an expert social services referral assistant in Singapore.
Evaluate the following participant's survey responses and notes against the database of active support schemes.

Participant Survey Responses:
${JSON.stringify(responses, null, 2)}

Interviewer Notes:
${interviewerNotes || 'None'}

Active Database of Support Schemes:
${JSON.stringify(initiatives, null, 2)}

Please match the participant to any relevant schemes in the database. For each match, you must extract:
1. initiativeId: The exact ID of the initiative from the database (e.g., "init-1", "init-2")
2. initiativeTitle: The exact title of the initiative (e.g., "ComCare Short-to-Medium Term Assistance (SMTA)")
3. category: The category of the initiative
4. matchReason: A specific explanation of why this scheme matches the participant's profile and eligibility criteria
5. priority: Either "High", "Medium", or "Low" based on the urgency of their situation and criteria fit

Return a JSON object in this exact structure:
{
  "referrals": [
    {
      "initiativeId": "initiative ID",
      "initiativeTitle": "initiative title",
      "category": "initiative category",
      "matchReason": "detailed matching explanation",
      "priority": "High" | "Medium" | "Low"
    }
  ]
}`;

    return this.callGroqJSON<{ referrals: ReferralRecommendation[] }>(
      () => this.groq!.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'You are an outreach matching coordinator. You must only return valid JSON matching the schema.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
      }),
      async () => ({ referrals: await this.mockService.matchReferrals(responses, initiatives) }),
      'matchReferrals'
    ).then(res => {
      if (res && Array.isArray(res.referrals)) {
        return res.referrals.map((r: any) => {
          const matchedId = r.initiativeId || r.id || '';
          const matchedTitle = r.initiativeTitle || r.title || r.program || '';
          const matchedCategory = r.category || '';
          const matchedReason = r.matchReason || r.reason || 'Matched based on survey answers.';
          const matchedPriority = (r.priority === 'High' || r.priority === 'Medium' || r.priority === 'Low') ? r.priority : 'Medium';
          
          return {
            initiativeId: String(matchedId),
            initiativeTitle: String(matchedTitle),
            category: String(matchedCategory),
            matchReason: String(matchedReason),
            priority: matchedPriority,
            selected: false,
            followedUp: false,
            status: 'Matched' as const
          };
        }).filter(r => r.initiativeId && r.initiativeTitle);
      }
      return [];
    });
  }

  async scourInitiativesForSurvey(survey: Survey): Promise<CommunityInitiative[]> {
    const prompt = `Generate 3 relevant support programs for survey topics:\nQuestions: ${JSON.stringify(survey.questions.map(q => q.fieldName))}\nReturn JSON: { "initiatives": [] }`;

    return this.callGroqJSON<{ initiatives: CommunityInitiative[] }>(
      () => this.groq!.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'Outreach researcher. JSON only.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
      }),
      async () => ({ initiatives: await this.mockService.scourInitiativesForSurvey(survey) }),
      'scourInitiativesForSurvey'
    ).then(res => (Array.isArray(res.initiatives) ? res.initiatives : []).map((init, index) => ({
      ...init,
      id: `init-${Date.now()}-${index}`
    })));
  }

  async generateCumulativeInsights(profiles: ParticipantProfile[], survey: Survey): Promise<CumulativeInsights> {
    if (profiles.length === 0) {
      return this.mockService.generateCumulativeInsights(profiles, survey);
    }

    const profileSummaries = profiles.map((p, index) => {
      const qFieldName = survey?.questions?.[0]?.fieldName || '';
      const name = (p.responses || {})[qFieldName] || `Participant ${index + 1}`;
      const briefResponses = Object.entries(p.responses || {})
        .map(([q, a]) => `- ${q}: ${a}`)
        .join('\n');
      const referrals = (p.referrals || [])
        .map(ref => `- Matched: ${ref.initiativeTitle} (${ref.priority} priority - Status: ${ref.status || 'Matched'})`)
        .join('\n');
      
      return `### Respondent #${index + 1}: ${name}
Completeness: ${p.completeness}%
Interviewer Notes: ${p.interviewerNotes || 'None'}
Responses:
${briefResponses}
Matched Support Programs:
${referrals}`;
    }).join('\n\n');

    const prompt = `Task: Perform a cumulative, aggregate trend analysis across a database of ${profiles.length} participant interviews.
Survey Name: ${survey.name}
Survey Questions: ${JSON.stringify(survey.questions.map(q => q.fieldName))}

Participant Profile Database:
${profileSummaries}

Based on this data, construct an analysis in JSON format containing:
1. "executiveSummary": A comprehensive, high-level summary of findings, dominant trends, and resource bottlenecks. (2-3 sentences)
2. "commonProblems": An array of top 3-4 recurring issues found in the database. For each issue, output:
   - "problemName": Short descriptive label (e.g. "Rental Arrears", "Senior Digital Literacy Gaps").
   - "description": 1-2 sentence explanation of why this is a recurring problem based on interviewee responses.
   - "prevalencePercentage": Estimated percentage of the respondent pool suffering from this issue (0-100).
   - "severity": "High" | "Medium" | "Low" based on urgency.
3. "correlations": An array of 3 specific patterns, demographics links, or structural insights. (e.g., "Seniors are disproportionately isolated", "Low income directly links to low device ownership").
4. "proactiveInitiatives": An array of 3 highly actionable, concrete local events/initiatives the community organization can run to proactively address these specific trends. Output:
   - "id": unique string ID.
   - "title": e.g. "FSC Counselling Caravan".
   - "description": Concise description of what the initiative does.
   - "completed": false

Format the output strictly as a JSON object conforming to the CumulativeInsights schema:
{
  "executiveSummary": "...",
  "commonProblems": [
    { "problemName": "...", "description": "...", "prevalencePercentage": 60, "severity": "High" }
  ],
  "correlations": [
    "..."
  ],
  "proactiveInitiatives": [
    { "id": "...", "title": "...", "description": "...", "completed": false }
  ]
}`;

    return this.callGroqJSON<CumulativeInsights>(
      () => this.groq!.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'You are an advanced social science researcher and community program coordinator. Strictly respond in JSON.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
      }),
      async () => this.mockService.generateCumulativeInsights(profiles, survey),
      'generateCumulativeInsights'
    ).then(res => {
      const output = { ...res };
      
      if ((output as any).common_problems && !output.commonProblems) {
        output.commonProblems = (output as any).common_problems;
      }
      if ((output as any).proactive_initiatives && !output.proactiveInitiatives) {
        output.proactiveInitiatives = (output as any).proactive_initiatives;
      }
      if ((output as any).executive_summary && !output.executiveSummary) {
        output.executiveSummary = (output as any).executive_summary;
      }

      if (!Array.isArray(output.commonProblems)) output.commonProblems = [];
      if (!Array.isArray(output.correlations)) output.correlations = [];
      if (!Array.isArray(output.proactiveInitiatives)) output.proactiveInitiatives = [];

      output.commonProblems = output.commonProblems.map((prob: any) => ({
        problemName: prob.problemName || prob.problem_name || prob.name || 'Unknown Issue',
        description: prob.description || prob.desc || '',
        prevalencePercentage: typeof prob.prevalencePercentage === 'number' ? prob.prevalencePercentage :
                              typeof prob.prevalence_percentage === 'number' ? prob.prevalence_percentage : 50,
        severity: prob.severity || 'Medium'
      }));

      output.proactiveInitiatives = output.proactiveInitiatives.map((init: any, idx: number) => ({
        id: init.id || `pro-${Date.now()}-${idx}`,
        title: init.title || init.name || 'Proactive Event',
        description: init.description || init.desc || '',
        completed: !!init.completed
      }));

      return output;
    });
  }
}

export const createAIService = (provider: 'groq' | 'mock' = 'groq'): AIService => {
  if (provider === 'groq') {
    return new GroqService(import.meta.env.VITE_GROQ_API_KEY);
  }
  return new MockAIService();
};


/* ==========================================================================
   SECTION 3. SHARED COMPONENTS: ERROR BOUNDARY, MODAL (views.tsx)
   ========================================================================== */
interface ErrorBoundaryProps { children: ReactNode; }
interface ErrorBoundaryState { hasError: boolean; error: Error | null; errorInfo: ErrorInfo | null; }

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false, error: null, errorInfo: null };

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full flex items-center justify-center p-6 glass-bg text-sans">
          <div className="w-full max-w-md glass-card rounded-[2.5rem] p-8 text-center space-y-6 border border-red-500/20">
            <div className="w-20 h-20 bg-red-500/10 rounded-[2rem] flex items-center justify-center mx-auto border border-red-500/20">
              <AlertTriangle className="text-red-400 animate-pulse" size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase text-white tracking-tight">Application Error</h2>
              <p className="text-xs text-white/60 font-bold uppercase tracking-wider">A runtime exception occurred</p>
            </div>
            <div className="glass-inset p-4 rounded-2xl text-left max-h-40 overflow-y-auto pr-1">
              <p className="text-xs font-black text-red-400 mb-1">
                {this.state.error?.name || 'Error'}: {this.state.error?.message}
              </p>
              {this.state.error?.stack && (
                <pre className="text-[10px] text-white/50 font-mono whitespace-pre-wrap leading-relaxed select-all">
                  {this.state.error.stack}
                </pre>
              )}
            </div>
            <button onClick={() => window.location.reload()} className="w-full p-4 glass-button text-blue-400 font-black uppercase text-xs rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform">
              <RotateCcw size={16} />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  icon?: ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, title, onClose, children, icon }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 font-sans">
      <div className="glass-card rounded-[2rem] max-w-md w-full p-6 space-y-6 text-left border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            {icon}
            <h3 className="text-lg font-black text-white uppercase tracking-tight">{title}</h3>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">{children}</div>
      </div>
    </div>
  );
};


/* ==========================================================================
   SECTION 4. SUB-VIEWS (HomeView, RecordingView, CoachingView, etc.)
   ========================================================================== */
export const HomeView: React.FC<{
  onSurveyUpload: (s: Survey, fileBuffer?: ArrayBuffer, fileName?: string) => void;
  surveys: Survey[];
  currentSurvey: Survey | null;
  onSelectSurvey: (survey: Survey) => void;
  onLoadDemoData: () => void;
}> = ({ onSurveyUpload, surveys, currentSurvey, onSelectSurvey, onLoadDemoData }) => {
  const [surveyText, setSurveyText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  const [uploadedBuffer, setUploadedBuffer] = useState<ArrayBuffer | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aiService = useMemo(() => createAIService(), []);

  const handleFile = async (file: File) => {
    const validation = fileParser.validateFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }
    setIsProcessing(true);
    try {
      const parsed = await fileParser.parseFile(file);
      if (parsed.success && parsed.text) {
        setSurveyText(parsed.text);
        const buffer = await file.arrayBuffer();
        setUploadedBuffer(buffer);
        setUploadedFileName(file.name);
        setInputMode('text');
      } else {
        alert(parsed.error || 'Failed to parse file');
      }
    } catch {
      alert('Failed to parse file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcess = async () => {
    if (!surveyText.trim()) return;
    setIsProcessing(true);
    try {
      const parsed = await aiService.parseSurvey(surveyText);
      setEditingSurvey(parsed);
    } catch (err: any) {
      alert('AI processing failed: ' + (err?.message || err));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveSurveyEdit = () => {
    if (!editingSurvey) return;
    onSurveyUpload(editingSurvey, uploadedBuffer || undefined, uploadedFileName || undefined);
    setSurveyText('');
    setUploadedBuffer(null);
    setUploadedFileName(null);
    setEditingSurvey(null);
  };

  if (editingSurvey) {
    return (
      <div className="p-6 space-y-6 pb-32 animate-in fade-in duration-300 text-left font-sans">
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Review & Edit Survey</h2>
          <p className="text-xs text-white/60 uppercase font-black tracking-widest">Fine-tune questions before importing</p>
        </div>

        <div className="glass-card rounded-[2rem] p-6 space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-white/50 uppercase tracking-widest">Survey Title</label>
            <input
              type="text"
              value={editingSurvey.name}
              onChange={e => setEditingSurvey({ ...editingSurvey, name: e.target.value })}
              className="w-full p-4 glass-inset rounded-2xl focus:outline-none text-sm font-bold text-white placeholder-white/30"
              placeholder="e.g. Needs Assessment Survey"
            />
          </div>

          <div className="space-y-4">
            <label className="block text-[10px] font-black text-white/50 uppercase tracking-widest">Questions ({editingSurvey.questions.length})</label>
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              {editingSurvey.questions.map((q, qIdx) => (
                <div key={qIdx} className="glass-inset p-4 rounded-2xl space-y-3 relative group">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider mt-2 flex-shrink-0">Q{qIdx + 1}</span>
                    <textarea
                      rows={2}
                      value={q.fieldName}
                      onChange={e => {
                        const updated = [...editingSurvey.questions];
                        updated[qIdx] = { ...updated[qIdx], fieldName: e.target.value };
                        setEditingSurvey({ ...editingSurvey, questions: updated });
                      }}
                      className="flex-1 bg-transparent text-sm text-white font-bold placeholder-white/30 focus:outline-none resize-none border-b border-white/5 focus:border-blue-500/50 py-1"
                      placeholder="Question text..."
                    />
                    <button
                      onClick={() => setEditingSurvey({ ...editingSurvey, questions: editingSurvey.questions.filter((_, idx) => idx !== qIdx) })}
                      className="p-2 hover:bg-red-500/20 text-white/40 hover:text-red-400 rounded-xl transition-colors flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-[8px] font-black text-white/40 uppercase tracking-wider">Type:</span>
                    <div className="flex gap-2">
                      {(['string', 'enum'] as const).map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            const updated = [...editingSurvey.questions];
                            updated[qIdx] = type === 'enum' 
                              ? { ...updated[qIdx], type: 'enum', options: updated[qIdx].options || ['Yes', 'No'] }
                              : { ...updated[qIdx], type: 'string', options: undefined };
                            setEditingSurvey({ ...editingSurvey, questions: updated });
                          }}
                          className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${q.type === type ? 'glass-button text-blue-400' : 'text-white/40 bg-white/5'}`}
                        >
                          {type === 'string' ? 'Text Answer' : 'Multiple Choice'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {q.type === 'enum' && q.options && (
                    <div className="space-y-2 pl-4 border-l-2 border-white/10 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-black text-white/50 uppercase tracking-wider">Options:</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...editingSurvey.questions];
                            updated[qIdx] = { ...updated[qIdx], options: [...(q.options || []), `Option ${(q.options || []).length + 1}`] };
                            setEditingSurvey({ ...editingSurvey, questions: updated });
                          }}
                          className="flex items-center gap-1 text-[8px] font-black text-blue-400 hover:text-blue-300 uppercase"
                        >
                          <Plus size={10} /> Add Option
                        </button>
                      </div>
                      <div className="space-y-2">
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={opt}
                              onChange={e => {
                                const updatedOpts = [...(q.options || [])];
                                updatedOpts[optIdx] = e.target.value;
                                const updated = [...editingSurvey.questions];
                                updated[qIdx] = { ...updated[qIdx], options: updatedOpts };
                                setEditingSurvey({ ...editingSurvey, questions: updated });
                              }}
                              className="flex-1 bg-slate-900/40 p-2 rounded-lg border border-white/5 text-xs text-white placeholder-white/20 focus:outline-none"
                            />
                            {q.options!.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...editingSurvey.questions];
                                  updated[qIdx] = { ...updated[qIdx], options: q.options!.filter((_, idx) => idx !== optIdx) };
                                  setEditingSurvey({ ...editingSurvey, questions: updated });
                                }}
                                className="p-1.5 hover:bg-red-500/10 text-white/30 hover:text-red-400 rounded-md transition-colors"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => setEditingSurvey({
                ...editingSurvey,
                questions: [...editingSurvey.questions, { id: `q${editingSurvey.questions.length + 1}`, fieldName: `New Question`, type: 'string' }]
              })}
              className="w-full p-4 border border-dashed border-white/15 hover:border-blue-500/40 text-white/60 hover:text-blue-400 font-black uppercase tracking-wider text-xs rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              <span>Add Custom Question</span>
            </button>
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button onClick={() => setEditingSurvey(null)} className="flex-1 p-4 glass-inset text-white/60 hover:text-white font-black uppercase text-xs rounded-2xl">Cancel</button>
            <button onClick={handleSaveSurveyEdit} className="flex-1 p-4 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs rounded-2xl shadow-lg hover:scale-[1.01] transition-transform">Finish & Import</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-full font-sans space-y-6">
      <div className="text-center mb-6 pt-6">
        <h1 className="text-5xl font-black text-white mb-2 tracking-tighter uppercase drop-shadow-lg" title="Conversational Assessment & Routing Engine for Outreach">CARE-O</h1>
        <p className="text-white/80 text-xs font-semibold max-w-xs mx-auto leading-normal tracking-wide uppercase">Conversational Assessment & Routing Engine for Outreach</p>
      </div>

      <div className="max-w-2xl mx-auto p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400"><Sparkles size={20} className="animate-pulse" /></div>
          <div>
            <span className="block text-[8px] font-black text-blue-400 uppercase tracking-widest">Demo Sandbox Mode</span>
            <span className="text-xs font-bold text-white block">Explore with loaded mock data & insights</span>
          </div>
        </div>
        <button
          onClick={onLoadDemoData}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[9px] tracking-wider rounded-xl transition-all shadow-md active:scale-95"
        >
          Load Mock Data
        </button>
      </div>

      {currentSurvey && (
        <div className="max-w-2xl mx-auto p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-3 text-left">
          <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse flex-shrink-0" />
          <div className="min-w-0">
            <span className="block text-[8px] font-black text-green-400 uppercase tracking-widest">Active Survey Configured</span>
            <span className="text-xs font-bold text-white truncate block">{currentSurvey.name}</span>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto glass-card p-6">
        <div className="flex gap-4 mb-5 text-left">
          <div className="p-3 glass-inset rounded-2xl"><FileText className="text-blue-400" size={24} /></div>
          <div>
            <h2 className="text-base font-bold text-white uppercase tracking-tight">Import New Survey</h2>
            <p className="text-[9px] text-white/60 font-bold uppercase tracking-wider">Strict AI Extraction Enabled</p>
          </div>
        </div>

        <div className="flex gap-2 mb-5">
          <button onClick={() => setInputMode('text')} className={`flex-1 py-2 rounded-xl font-black uppercase tracking-wider text-[10px] flex items-center justify-center gap-2 ${inputMode === 'text' ? 'glass-button text-white' : 'glass-inset text-white/60'}`}><Type size={14} />Text</button>
          <button onClick={() => setInputMode('file')} className={`flex-1 py-2 rounded-xl font-black uppercase tracking-wider text-[10px] flex items-center justify-center gap-2 ${inputMode === 'file' ? 'glass-button text-white' : 'glass-inset text-white/60'}`}><Upload size={14} />File</button>
        </div>

        {inputMode === 'text' ? (
          <>
            <textarea
              value={surveyText}
              onChange={e => setSurveyText(e.target.value)}
              placeholder="Paste survey questions here..."
              className="w-full h-44 p-4 glass-inset rounded-2xl focus:outline-none resize-none mb-5 text-xs text-white placeholder-white/40 leading-relaxed"
            />
            <button
              onClick={handleProcess}
              disabled={!surveyText.trim() || isProcessing}
              className="w-full py-4 glass-button text-white font-black uppercase tracking-wider text-xs rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01]"
            >
              {isProcessing ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <><span>Process with AI</span><ArrowRight size={16} /></>}
            </button>
          </>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            className={`p-6 text-center rounded-2xl border-2 border-dashed transition-all cursor-pointer ${isDragging ? 'border-blue-400 bg-blue-500/10' : 'border-white/10 hover:border-white/20'}`}
          >
            <input ref={fileInputRef} type="file" accept=".docx,.pdf,.txt" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} className="hidden" />
            <Upload className="text-blue-400 mx-auto mb-3" size={24} />
            <h3 className="text-white font-bold text-sm mb-1 uppercase">Upload Document</h3>
            <p className="text-white/60 text-[10px]">DOCX, PDF, TXT (Max 10MB)</p>
          </div>
        )}
      </div>

      {surveys.length > 0 && (
        <div className="max-w-2xl mx-auto glass-card p-6 text-left space-y-4">
          <div>
            <h3 className="text-xs font-black text-white/50 uppercase tracking-widest">Select Active Survey</h3>
            <p className="text-[9px] text-white/40 font-bold uppercase tracking-wider mt-0.5">Shift survey structure instantly</p>
          </div>
          <div className="space-y-2">
            {surveys.map(s => {
              const isActive = currentSurvey?.id === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => onSelectSurvey(s)}
                  className={`w-full p-4 rounded-2xl flex items-center justify-between border transition-all text-left ${isActive ? 'bg-blue-500/15 border-blue-500/30 shadow' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                >
                  <div className="min-w-0 pr-4">
                    <h4 className="font-bold text-white text-xs truncate">{s.name}</h4>
                    <span className="text-[9px] text-white/40 uppercase font-black tracking-wider block mt-0.5">{s.questions.length} Questions</span>
                  </div>
                  {isActive && (
                    <span className="text-[8px] font-black px-2 py-0.5 rounded-md bg-green-400/20 text-green-400 uppercase tracking-widest flex-shrink-0">Active</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export const RecordingView: React.FC<{ survey: Survey; onSaveProfile: (r: Record<string, string>, a?: RecordingAnalysis, n?: string) => void }> = ({ survey, onSaveProfile }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [analysis, setAnalysis] = useState<RecordingAnalysis | null>(null);
  const [showClarification, setShowClarification] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [permissionError, setPermissionError] = useState(false);
  const [coveredQuestions, setCoveredQuestions] = useState<Record<string, boolean>>({});
  const [showQuestionsList, setShowQuestionsList] = useState(true);
  const [interviewerNotes, setInterviewerNotes] = useState('');

  const timerRef = useRef<any>();
  const aiService = useMemo(() => createAIService(), []);
  const speechService = useMemo(() => createSpeechService(), []);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    speechService.stopSpeaking();
  }, []);

  useEffect(() => {
    if (!liveTranscript.trim()) return;
    setCoveredQuestions(prev => {
      const newCovered = { ...prev };
      let changed = false;
      survey.questions.forEach(q => {
        if (!newCovered[q.id] && isQuestionCovered(liveTranscript, q.fieldName)) {
          newCovered[q.id] = true;
          changed = true;
        }
      });
      return changed ? newCovered : prev;
    });
  }, [liveTranscript, survey.questions]);

  const startRecording = async () => {
    setLiveTranscript('');
    setAnalysis(null);
    setCoveredQuestions({});
    setInterviewerNotes('');
    setPermissionError(false);
    try {
      await speechService.startListening(t => setLiveTranscript(t));
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch {
      setPermissionError(true);
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    clearInterval(timerRef.current);
    try {
      const final = await speechService.stopListening();
      const text = final || liveTranscript;
      if (!text.trim()) {
        alert('No speech detected.');
        return;
      }
      setIsAnalyzing(true);
      const res = await aiService.analyzeTranscript(text, survey);
      if (res && res.extractedResponses) {
        res.extractedResponses = alignExtractedResponses(res.extractedResponses, survey.questions);
      }
      setAnalysis(res);
      if ((res.unclearQuestions && res.unclearQuestions.length > 0) || (res.unansweredQuestions && res.unansweredQuestions.length > 0)) {
        setShowClarification(true);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClarificationComplete = (clarified: Record<string, string>) => {
    if (analysis) {
      const final = { ...analysis.extractedResponses, ...clarified };
      onSaveProfile(final, analysis, interviewerNotes);
      setShowClarification(false);
      setAnalysis(null);
      setLiveTranscript('');
      setInterviewerNotes('');
    }
  };

  if (permissionError) {
    return (
      <div className="p-10 flex flex-col items-center justify-center text-center space-y-6">
        <MicOff size={40} className="text-red-400" />
        <h2 className="text-xl font-bold text-white">Mic Permission Blocked</h2>
        <button onClick={startRecording} className="px-6 py-3 glass-button text-white rounded-2xl font-bold hover:scale-105 transition-transform">Try Again</button>
      </div>
    );
  }

  const allClarify = analysis ? [...new Set([...(analysis.unclearQuestions || []), ...(analysis.unansweredQuestions || [])])] : [];

  return (
    <div className="p-6 space-y-6 font-sans">
      <div className="space-y-2 text-left">
        <h2 className="text-2xl font-black text-white uppercase">Voice Capture</h2>
        <p className="text-sm text-white/60">Capture live interview data and extract survey profiles automatically.</p>
      </div>

      {!analysis && !isAnalyzing ? (
        <div className="flex flex-col items-center gap-10 py-12">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 hover:bg-red-600 scale-105' : 'glass-button hover:scale-110'}`}
          >
            {isRecording ? <Square className="text-white animate-pulse" size={40} /> : <Mic className="text-blue-400" size={40} />}
          </button>

          {isRecording && (
            <div className="text-red-400 font-black text-xl font-mono">
              {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
            </div>
          )}

          <div className="w-full glass-card rounded-2xl p-5 space-y-4 text-left">
            <button onClick={() => setShowQuestionsList(!showQuestionsList)} className="w-full flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1.5 text-[10px] font-black uppercase text-white/70">
                  <span>Questionnaire Progress</span>
                  <span className="text-blue-400">{Object.values(coveredQuestions).filter(Boolean).length}/{survey.questions.length} Asked</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all" style={{ width: `${survey.questions.length > 0 ? (Object.values(coveredQuestions).filter(Boolean).length / survey.questions.length) * 100 : 0}%` }} />
                </div>
              </div>
              <ChevronDown size={16} className={`text-white/60 ml-4 transition-transform ${showQuestionsList ? 'rotate-180' : ''}`} />
            </button>

            {showQuestionsList && (
              <div className="space-y-2 pt-2 border-t border-white/5 max-h-52 overflow-y-auto pr-1">
                {survey.questions.map(q => {
                  const isChecked = !!coveredQuestions[q.id];
                  return (
                    <div key={q.id} onClick={() => setCoveredQuestions(prev => ({ ...prev, [q.id]: !isChecked }))} className="flex items-start gap-2.5 cursor-pointer select-none">
                      <div className="text-blue-400 mt-0.5">{isChecked ? <CheckSquare size={14} className="fill-blue-500/20" /> : <Square size={14} />}</div>
                      <span className={`text-[11px] font-medium leading-tight ${isChecked ? 'text-white/40 line-through' : 'text-white/80'}`}>{q.fieldName}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {isRecording && (
            <div className="w-full glass-inset rounded-3xl p-6 text-left">
              <p className="text-lg text-white italic leading-relaxed">{liveTranscript || "Listening..."}</p>
            </div>
          )}
        </div>
      ) : isAnalyzing ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
          <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold uppercase tracking-widest text-white/60 text-center">AI is Analyzing Transcription Technique & Parsing Profile...</p>
        </div>
      ) : (
        <div className="space-y-6 text-left">
          <div className="glass-card rounded-3xl p-8 text-center">
            <div className={`text-6xl font-black mb-2 ${analysis!.score >= 80 ? 'text-green-400' : 'text-amber-400'}`}>{analysis!.score}%</div>
            <p className="text-xs font-black uppercase text-white/70">Transcription Quality</p>
          </div>

          {analysis!.detailedFeedback && analysis!.detailedFeedback.length > 0 && (
            <div className="glass-card rounded-3xl p-6 space-y-4">
              <h3 className="font-black uppercase tracking-widest text-[10px] text-white/60">Quality Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {analysis!.detailedFeedback.map((df, i) => {
                  const scoreColor = df.score >= 85 ? 'text-green-400' : df.score >= 70 ? 'text-amber-400' : 'text-rose-400';
                  const barColor = df.score >= 85 ? 'bg-green-500' : df.score >= 70 ? 'bg-amber-500' : 'bg-rose-500';
                  return (
                    <div key={i} className="glass-inset rounded-2xl p-4 space-y-3 flex flex-col justify-between hover:border-white/10 transition-all border border-transparent">
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-1.5 w-full">
                          <span className="text-[10px] font-black text-white/90 leading-tight min-w-0 break-words">{df.category}</span>
                          <span className={`text-[10px] font-mono font-black flex-shrink-0 ${scoreColor}`}>{df.score}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">
                          <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${df.score}%` }} />
                        </div>
                        <p className="text-[11px] text-white/60 leading-normal">{df.feedback}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {analysis!.improvementAnalysis && (
            <div className="glass-card rounded-3xl p-6 space-y-4">
              <h3 className="font-black uppercase tracking-widest text-[10px] text-white">AI Coach's Feedback</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-[9px] font-black text-white/60 uppercase mb-2">Strengths</p>
                  <ul className="space-y-1">
                    {analysis!.improvementAnalysis.strengths.map((s: any, i) => (
                      <li key={i} className="text-xs flex items-center gap-2 text-white/80">
                        <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                        <span>{typeof s === 'object' ? s.description || s.text || s.strength || JSON.stringify(s) : s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[9px] font-black text-white/60 uppercase mb-2">Actionable Tips</p>
                  <ul className="space-y-1">
                    {analysis!.improvementAnalysis.actionableTips.map((t: any, i) => (
                      <li key={i} className="text-xs font-bold italic text-white/80">
                        <Lightbulb size={14} className="text-yellow-400 inline mr-2 flex-shrink-0" />
                        <span>{typeof t === 'object' ? t.description || t.text || t.tip || JSON.stringify(t) : t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="glass-card rounded-3xl p-6 space-y-4 text-left">
            <h3 className="font-black uppercase text-[10px] text-white">Extracted Answers (Edit if needed)</h3>
            <div className="space-y-3">
              {survey.questions.map((q, idx) => {
                const val = analysis!.extractedResponses[q.fieldName] || '';
                return (
                  <div key={idx} className="space-y-1">
                    <label className="text-[9px] font-black text-blue-400 uppercase block">{q.fieldName}</label>
                    <input
                      type="text"
                      value={val}
                      onChange={e => {
                        setAnalysis(prev => {
                          if (!prev) return null;
                          return {
                            ...prev,
                            extractedResponses: {
                              ...prev.extractedResponses,
                              [q.fieldName]: e.target.value
                            }
                          };
                        });
                      }}
                      className="w-full p-2.5 bg-slate-900/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500/30"
                      placeholder="Add response..."
                    />
                  </div>
                );
              })}
            </div>

            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <label className="text-[9px] font-black text-purple-400 uppercase block">Extra Notes by Interviewer</label>
              <textarea
                value={interviewerNotes}
                onChange={e => setInterviewerNotes(e.target.value)}
                rows={3}
                placeholder="Add notes (AI will use this for scheme matching)..."
                className="w-full p-3 bg-slate-900/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500/30 resize-none leading-relaxed"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setAnalysis(null)} className="flex-1 p-5 glass-inset text-white/60 font-black uppercase text-xs rounded-2xl">Discard</button>
            <button onClick={() => handleClarificationComplete({})} className="flex-1 p-5 glass-button text-blue-400 font-black uppercase text-xs rounded-2xl hover:scale-105 transition-transform">Save Results</button>
          </div>
        </div>
      )}

      {/* Clarification Modal */}
      <Modal isOpen={showClarification} title="Clarification Needed" onClose={() => setShowClarification(false)} icon={<AlertCircle className="text-amber-400" size={24} />}>
        <p className="text-xs text-white/70 mb-4">Please provide missing or unclear information captured during the dialogue:</p>
        <div className="space-y-4">
          {allClarify.map((q, i) => (
            <div key={i} className="space-y-2">
              <label className="text-[10px] font-black text-white/60 uppercase block">{q}</label>
              <input
                type="text"
                onChange={e => {
                  if (analysis) {
                    analysis.extractedResponses[q] = e.target.value;
                  }
                }}
                className="w-full p-3 glass-inset rounded-xl focus:outline-none text-xs text-white"
                placeholder="Enter response details..."
              />
            </div>
          ))}
        </div>
        <div className="flex gap-3 pt-4 border-t border-white/10">
          <button onClick={() => setShowClarification(false)} className="flex-1 py-3.5 glass-inset text-white/60 font-black uppercase text-xs rounded-xl">Skip</button>
          <button onClick={() => handleClarificationComplete({})} className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs rounded-xl">Save All</button>
        </div>
      </Modal>
    </div>
  );
};

const renderCoachingText = (item: any, wrapQuotes = false): React.ReactNode => {
  if (!item) return '';
  if (typeof item === 'string') return wrapQuotes ? `"${item}"` : item;
  if (typeof item === 'object') {
    const phrase = item.phrase || item.mistake || item.tip || item.text || Object.values(item).find(v => typeof v === 'string') || '';
    const rationale = item.rationale || item.explanation || item.reason;
    const renderedPhrase = wrapQuotes ? `"${phrase}"` : phrase;
    return rationale ? (
      <span>
        <span>{renderedPhrase}</span>
        <span className="block text-[10px] text-white/40 mt-1 not-italic font-normal">Rationale: {rationale}</span>
      </span>
    ) : renderedPhrase;
  }
  return String(item);
};

export const CoachingView: React.FC<{ survey: Survey }> = ({ survey }) => {
  const [activeTab, setActiveTab] = useState<'strategy' | 'questions' | 'practice'>('strategy');
  const [practiceMode, setPracticeMode] = useState<'chat' | 'call' | null>(null);
  const [overview, setOverview] = useState<CoachingOverview | null>(null);
  const [questionCoaching, setQuestionCoaching] = useState<QuestionCoaching[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPersona, setSelectedPersona] = useState<'default' | 'elderly' | 'busy' | 'stressed'>('default');
  const [selectedMood, setSelectedMood] = useState<'cooperative' | 'skeptical' | 'rushed' | 'confused'>('cooperative');
  const [messages, setMessages] = useState<any[]>([]);
  const [isAILoading, setIsAILoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [coveredQuestions, setCoveredQuestions] = useState<Record<string, boolean>>({});
  const [showProgressDetails, setShowProgressDetails] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState<Record<string, boolean>>({});

  const aiService = useMemo(() => createAIService(), []);
  const speechService = useMemo(() => createSpeechService(), []);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, liveTranscript]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const ov = await aiService.generateCoachingOverview(survey);
        setOverview(ov);
        setQuestionCoaching([]);
      } catch {
        alert("Failed to load coaching guide.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [survey]);

  useEffect(() => {
    if (messages.length === 0) return;
    const userMessages = messages.filter(m => m.role === 'user').map(m => m.content);
    setCoveredQuestions(prev => {
      const newCovered = { ...prev };
      let changed = false;
      survey.questions.forEach(q => {
        if (!newCovered[q.id]) {
          const isCovered = userMessages.some(msg => isQuestionCovered(msg, q.fieldName));
          if (isCovered) {
            newCovered[q.id] = true;
            changed = true;
          }
        }
      });
      return changed ? newCovered : prev;
    });
  }, [messages, survey.questions]);

  const loadQuestionCoaching = async (questionId: string, questionText: string) => {
    if (questionCoaching.some(qc => qc.questionId === questionId) || loadingQuestions[questionId]) return;
    setLoadingQuestions(prev => ({ ...prev, [questionId]: true }));
    try {
      const qc = await aiService.generateSingleQuestionCoaching(questionId, questionText, survey);
      setQuestionCoaching(prev => [...prev, qc]);
    } catch {
      console.error("Failed to load question coaching.");
    } finally {
      setLoadingQuestions(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const handleSendMessage = async (text?: string) => {
    const content = text || liveTranscript;
    if (!content.trim() || isAILoading) return;

    const userMsg = { id: `u-${Date.now()}`, role: 'user', content, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setLiveTranscript('');
    setIsAILoading(true);

    try {
      const history = messages.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }));
      
      const basePersona = overview?.participantPersona || "A regular survey participant.";
      const personaPrompts = {
        default: "",
        elderly: "Persona: You are Mr. Tan, a 74-year-old retired senior citizen.",
        busy: "Persona: You are Nadia, a 38-year-old working mother.",
        stressed: "Persona: You are Raju, a 42-year-old delivery rider."
      };
      const moodPrompts = {
        cooperative: "Mood: You are friendly, cooperative, warm, and speak in a polite tone.",
        skeptical: "Mood: You are skeptical, distrustful, and highly protective of your privacy. You frequently ask 'Why do you need to know this?' and need reassurance before answering personal questions.",
        rushed: "Mood: You are impatient, rushed, and keep saying things like 'I only have a couple minutes' or 'can we skip to the end?'. You give one-word answers.",
        confused: "Mood: You are easily confused, hard-of-hearing (in call mode) or forgetful, change your answers halfway, and ask 'What does that mean?' when asked anything complex."
      };

      const customPersona = `${basePersona}\n\n[OVERRIDE CONFIG]\n${personaPrompts[selectedPersona]}\n${moodPrompts[selectedMood]}`;
      
      const response = await aiService.generatePracticeResponse(content, survey, history, customPersona);
      const aiMsg = { id: `a-${Date.now()}`, role: 'ai', content: response, timestamp: Date.now() };
      setMessages(prev => [...prev, aiMsg]);
      if (practiceMode === 'call') await speechService.speak(response);
    } catch {
      alert("AI Response failed.");
    } finally {
      setIsAILoading(false);
    }
  };

  const toggleVoice = async () => {
    if (isListening) {
      const final = await speechService.stopListening();
      setIsListening(false);
      if (final || liveTranscript) handleSendMessage(final || liveTranscript);
    } else {
      try {
        setIsListening(true);
        await speechService.startListening(t => setLiveTranscript(t));
      } catch {
        setIsListening(false);
        alert('Mic blocked.');
      }
    }
  };

  const finishSession = async () => {
    speechService.stopSpeaking();
    if (isListening) await speechService.stopListening();
    setIsAILoading(true);
    try {
      const transcript = messages.map(m => `${m.role === 'user' ? 'INTERVIEWER' : 'PARTICIPANT'}: ${m.content}`).join('\n');
      const feedback = await aiService.generatePracticeFeedback(transcript, survey, overview?.coachPersona);
      if (feedback && typeof feedback.overallScore !== 'undefined') {
        setFeedbackData(feedback);
        setShowFeedback(true);
      } else throw new Error();
    } catch {
      alert('Analysis failed. Exchange more dialogue before grading.');
    } finally {
      setIsAILoading(false);
    }
  };

  const enterPractice = async (mode: 'chat' | 'call') => {
    speechService.stopSpeaking();
    setPracticeMode(mode);
    setMessages([]);
    setFeedbackData(null);
    setShowFeedback(false);
    setCoveredQuestions({});
    setShowProgressDetails(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 pt-12">
        <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">AI is Crafting Strategy Guide...</p>
      </div>
    );
  }

  if (showFeedback && feedbackData) {
    return (
      <div className="p-6 space-y-6 pb-32 text-left font-sans">
        <div className="text-center space-y-4 pt-4">
          <div className="w-20 h-20 glass-inset rounded-[2rem] flex items-center justify-center mx-auto"><Award className="text-blue-400" size={40} /></div>
          <h2 className="text-2xl font-black uppercase text-white">Coaching Report</h2>
          <p className="text-sm text-white/60">AI Evaluation Feedback</p>
        </div>

        <div className="glass-card rounded-[2.5rem] p-8 text-center border border-white/10">
          <div className={`text-6xl font-black mb-2 ${feedbackData.overallScore >= 80 ? 'text-green-400' : 'text-amber-400'}`}>{feedbackData.overallScore}%</div>
          <p className="text-xs font-black uppercase text-white/70">Overall Score</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card rounded-2xl p-4 text-center">
            <Clock className="mx-auto mb-2 text-blue-400" size={24} />
            <p className="text-base font-black text-white">{feedbackData.duration || "5 minutes"}</p>
            <p className="text-[9px] font-black uppercase text-white/50">Duration</p>
          </div>
          <div className="glass-card rounded-2xl p-4 text-center">
            <MessageSquare className="mx-auto mb-2 text-purple-400" size={24} />
            <p className="text-base font-black text-white">{feedbackData.questionsAsked}/{feedbackData.totalQuestions}</p>
            <p className="text-[9px] font-black uppercase text-white/50">Questions Asked</p>
          </div>
        </div>

        {feedbackData.detailedFeedback && feedbackData.detailedFeedback.length > 0 && (
          <div className="space-y-4 animate-in">
            <h3 className="text-xs font-black text-white/60 uppercase tracking-wider pl-1 flex items-center gap-1.5">
              <BarChart2 size={12} className="text-blue-400" />
              Detailed Metric Ratings
            </h3>
            
            <div className="space-y-3">
              {feedbackData.detailedFeedback.map((m: any, idx: number) => {
                const isHigh = m.score >= 80;
                const isMedium = m.score >= 60 && m.score < 80;
                const barColor = isHigh ? 'bg-green-500' : isMedium ? 'bg-amber-500' : 'bg-red-500';
                const textColor = isHigh ? 'text-green-400' : isMedium ? 'text-amber-400' : 'text-red-400';
                
                return (
                  <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center gap-2 text-xs w-full">
                      <span className="font-bold text-white min-w-0 break-words">{m.category}</span>
                      <span className={`font-black flex-shrink-0 ${textColor}`}>{m.score}%</span>
                    </div>
                    
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${m.score}%` }}></div>
                    </div>
                    
                    <div className="text-[11px] text-white/70 leading-relaxed font-medium bg-slate-955/40 p-2.5 rounded-xl border border-white/5 space-y-2">
                      <p>{m.feedback}</p>
                      {m.suggestions && (Array.isArray(m.suggestions) ? m.suggestions.length > 0 : String(m.suggestions).trim().length > 0) && (
                        <div className="border-t border-white/5 pt-1.5 mt-1.5 text-[10px] text-white/50">
                          <span className="font-black text-[9px] uppercase tracking-wider text-blue-400 block mb-0.5">Tip to improve:</span>
                          <span className="italic">
                            {Array.isArray(m.suggestions) ? m.suggestions.join(' ') : m.suggestions}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="glass-card rounded-[2rem] p-6 space-y-4">
          <h3 className="flex items-center gap-2 font-black text-[10px] uppercase text-white"><TrendingUp size={16} className="text-green-400" /> Strengths</h3>
          <ul className="space-y-2 text-xs text-white/80">
            {feedbackData.strengths.map((s: any, i: number) => (
              <li key={i} className="flex gap-2">
                <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                <span>{typeof s === 'object' ? s.description || s.text || s.strength || JSON.stringify(s) : s}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-card rounded-[2rem] p-6 space-y-4">
          <h3 className="flex items-center gap-2 font-black text-[10px] uppercase text-white"><Lightbulb size={16} className="text-yellow-400" /> Improvements</h3>
          <ul className="space-y-2 text-xs text-white/80">
            {feedbackData.improvements.map((s: any, i: number) => (
              <li key={i} className="flex gap-2">
                <Lightbulb size={14} className="text-yellow-400 flex-shrink-0" />
                <span>{typeof s === 'object' ? s.description || s.text || s.improvement || JSON.stringify(s) : s}</span>
              </li>
            ))}
          </ul>
        </div>

        <button onClick={() => { setShowFeedback(false); setPracticeMode(null); }} className="w-full p-5 glass-button text-blue-300 font-black uppercase text-xs rounded-2xl hover:scale-105 transition-transform">Start New Practice</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full font-sans text-left">
      <div className="px-6 pt-2 pb-4 flex-shrink-0">
        <div className="glass-inset p-1.5 rounded-2xl flex gap-1">
          {(['strategy', 'questions', 'practice'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all ${activeTab === tab ? 'glass-button text-blue-300' : 'text-white/60'}`}>{tab}</button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {activeTab === 'strategy' && overview && (
          <div className="space-y-6">
            <div className="glass-card rounded-[2rem] p-8 text-white border border-white/10">
              <h2 className="text-2xl font-black mb-4">{overview.surveyName}</h2>
              <div className="flex gap-3 text-white/80 text-[10px] font-black uppercase">
                <span className="glass-inset px-3 py-1.5 rounded-xl">{survey.questions.length} Questions</span>
                <span className="glass-inset px-3 py-1.5 rounded-xl">{overview.estimatedDuration}</span>
              </div>
            </div>

            <div className="glass-card rounded-[2rem] p-6 space-y-4">
              <h3 className="flex items-center gap-2 font-black text-[10px] uppercase text-white"><Lightbulb className="text-yellow-400" size={16} /> Conversational Strategy</h3>
              <p className="text-sm text-white/80 font-medium">{overview.conversationalApproach}</p>
            </div>

            <div className="glass-card rounded-[2rem] p-6 space-y-4">
              <h3 className="flex items-center gap-2 font-black text-[10px] uppercase text-white"><Compass className="text-blue-400" size={16} /> Recommended Survey Flow</h3>
              <ul className="space-y-4">
                {overview.surveyFlow.map((flowStep, i) => (
                  <li key={i} className="flex gap-4 text-sm text-white/80 font-bold">
                    <div className="w-6 h-6 glass-inset text-blue-400 rounded-lg flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">{i + 1}</div>
                    {flowStep}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="space-y-3">
            {survey.questions.map(q => {
              const coaching = questionCoaching.find(qc => qc.questionId === q.id);
              const isLoadingCoaching = loadingQuestions[q.id];
              const isExpanded = selectedQuestion === q.id;

              return (
                <div key={q.id} onClick={() => { setSelectedQuestion(isExpanded ? null : q.id); loadQuestionCoaching(q.id, q.fieldName); }} className="glass-card rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.01] transition-all border border-white/5">
                  <div className="p-5 flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 glass-inset rounded-xl flex items-center justify-center text-blue-400 font-black text-xs flex-shrink-0 mt-0.5">{q.id.replace('q', '')}</div>
                      <p className="font-bold text-white text-sm leading-relaxed pt-0.5">{q.fieldName}</p>
                    </div>
                    <ChevronDown className={`text-white/40 transition-transform mt-3.5 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} size={16} />
                  </div>

                  {isExpanded && (
                    <div className="px-5 pb-5 pt-2 space-y-4 border-t border-white/5 bg-slate-900/10">
                      {isLoadingCoaching ? (
                        <div className="flex justify-center py-4"><div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /></div>
                      ) : coaching ? (
                        <>
                          <div className="space-y-2">
                            <p className="text-[9px] font-black text-blue-400 uppercase">Natural Phrasing</p>
                            {coaching.naturalPhrasing.map((p, i) => <div key={i} className="text-xs text-white/70 glass-inset p-3 rounded-xl italic">{renderCoachingText(p, true)}</div>)}
                          </div>
                          {coaching.stealthIntegration && (
                            <div className="space-y-2">
                              <p className="text-[9px] font-black text-green-400 uppercase">Stealth Integration (Ask Without Being Obvious)</p>
                              <div className="text-xs text-white/70 glass-inset p-3 rounded-xl leading-relaxed">
                                {renderCoachingText(coaching.stealthIntegration, false)}
                              </div>
                            </div>
                          )}
                          {coaching.followUpTips && coaching.followUpTips.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-[9px] font-black text-purple-400 uppercase">Follow-Up & Probing Tips</p>
                              <ul className="space-y-1.5">
                                {coaching.followUpTips.map((t, i) => (
                                  <li key={i} className="text-xs text-white/70 bg-white/5 p-2.5 rounded-xl border border-white/5">
                                    {renderCoachingText(t, false)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <div className="space-y-2">
                            <p className="text-[9px] font-black text-red-400 uppercase">Common Mistakes</p>
                            <ul className="space-y-1.5">
                              {coaching.commonMistakes.map((m, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-white/60 font-medium bg-red-500/5 p-2.5 rounded-xl border border-red-500/10">
                                  <VolumeX size={12} className="mt-0.5 flex-shrink-0 text-red-400" />
                                  <span>{renderCoachingText(m, false)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </>
                      ) : <p className="text-xs text-white/40 italic py-2">Failed to load tips.</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'practice' && (
          <div className="h-[550px] flex flex-col glass-card rounded-[2.5rem] overflow-hidden border border-white/10 relative">
            {!practiceMode ? (
              <div className="flex-1 flex flex-col justify-start p-6 space-y-5 overflow-y-auto">
                <div className="text-center space-y-2 flex-shrink-0">
                  <div className="w-12 h-12 glass-inset rounded-[1.25rem] flex items-center justify-center mx-auto text-blue-400"><Sparkles size={24} /></div>
                  <h3 className="text-xl font-black text-white">AI Simulation Practice</h3>
                  <p className="text-[9px] font-bold uppercase text-white/50">Configure Persona, Mood & Channel</p>
                </div>

                <div className="space-y-2">
                  <span className="text-[9px] font-black uppercase text-white/40 block pl-1">Participant Persona</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'default', label: 'Default', desc: 'Standard Profile' },
                      { id: 'elderly', label: 'Elderly Tan', desc: '74y, retired' },
                      { id: 'busy', label: 'Busy Nadia', desc: '38y, working mother' },
                      { id: 'stressed', label: 'Stressed Raju', desc: '42y, delivery rider' },
                    ].map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPersona(p.id as any)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${selectedPersona === p.id 
                          ? 'bg-blue-500/20 border-blue-500/50 text-white' 
                          : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10'}`}
                      >
                        <span className="block text-[10px] font-black uppercase tracking-tight">{p.label}</span>
                        <span className="block text-[8px] opacity-70 mt-0.5 leading-none">{p.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[9px] font-black uppercase text-white/40 block pl-1">Participant Mood</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'cooperative', label: 'Cooperative', desc: 'Friendly & polite' },
                      { id: 'skeptical', label: 'Skeptical', desc: 'Hesitant & protective' },
                      { id: 'rushed', label: 'Rushed', desc: 'Impatient, brief' },
                      { id: 'confused', label: 'Confused', desc: 'Needs rephrasing' },
                    ].map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMood(m.id as any)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${selectedMood === m.id 
                          ? 'bg-blue-500/20 border-blue-500/50 text-white' 
                          : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10'}`}
                      >
                        <span className="block text-[10px] font-black uppercase tracking-tight">{m.label}</span>
                        <span className="block text-[8px] opacity-70 mt-0.5 leading-none">{m.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5">
                  <span className="text-[9px] font-black uppercase text-white/40 block pl-1 text-center">Start Simulation</span>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => enterPractice('chat')} className="py-3.5 glass-button rounded-2xl text-center space-y-1 hover:scale-105 transition-transform flex flex-col items-center justify-center">
                      <Keyboard className="text-white/80" size={20} />
                      <span className="block font-black uppercase text-[8px] text-white">Chat Channel</span>
                    </button>
                    <button onClick={() => enterPractice('call')} className="py-3.5 glass-button rounded-2xl text-center space-y-1 hover:scale-105 transition-transform flex flex-col items-center justify-center">
                      <Phone className="text-white/80" size={20} />
                      <span className="block font-black uppercase text-[8px] text-white">Call Channel</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="p-5 flex items-center justify-between glass-header">
                  <div className="flex gap-3 items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-[9px] font-black uppercase text-white/60">{practiceMode} Session</span>
                  </div>
                  <button onClick={finishSession} className="glass-button text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase hover:scale-105 transition-transform">
                    Finish & Grade
                  </button>
                </div>

                <div className="px-6 py-3 border-b border-white/10 bg-white/5">
                  <button onClick={() => setShowProgressDetails(!showProgressDetails)} className="w-full flex items-center justify-between text-left">
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1.5 text-[9px] font-black uppercase text-white/70">
                        <span>Questionnaire Progress</span>
                        <span className="text-blue-400">{Object.values(coveredQuestions).filter(Boolean).length}/{survey.questions.length} Asked</span>
                      </div>
                      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all" style={{ width: `${survey.questions.length > 0 ? (Object.values(coveredQuestions).filter(Boolean).length / survey.questions.length) * 100 : 0}%` }} />
                      </div>
                    </div>
                    <ChevronDown size={14} className={`text-white/60 ml-4 transition-transform ${showProgressDetails ? 'rotate-180' : ''}`} />
                  </button>

                  {showProgressDetails && (
                    <div className="space-y-1.5 pt-2 border-t border-white/5 max-h-32 overflow-y-auto pr-1">
                      {survey.questions.map(q => {
                        const isChecked = !!coveredQuestions[q.id];
                        return (
                          <div key={q.id} className="flex items-start gap-2 select-none">
                            <div className="text-blue-400 mt-0.5">{isChecked ? <CheckSquare size={12} className="fill-blue-500/10" /> : <Square size={12} />}</div>
                            <span className={`text-[10px] font-medium leading-tight ${isChecked ? 'text-white/40 line-through' : 'text-white/80'}`}>{q.fieldName}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {messages.length === 0 && (
                    <div className="flex justify-center my-4">
                      <div className="glass-inset px-4 py-3 rounded-2xl text-[10px] font-bold text-blue-400 uppercase tracking-wider text-center max-w-[90%] border border-blue-500/20">
                        🤝 Simulation active. Please ask the participant your first survey question.
                      </div>
                    </div>
                  )}

                  {messages.map(m => (
                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-4 rounded-2xl text-sm font-medium text-white ${m.role === 'user' ? 'glass-button rounded-tr-none' : 'glass-inset rounded-tl-none'}`}>
                        {m.content}
                      </div>
                    </div>
                  ))}

                  {isListening && (
                    <div className="glass-inset p-4 rounded-2xl flex items-center gap-3">
                      <Mic className="text-blue-400 animate-pulse" size={18} />
                      <p className="text-xs italic font-bold text-blue-400">{liveTranscript || "Listening..."}</p>
                    </div>
                  )}

                  {isAILoading && (
                    <div className="flex justify-start">
                      <div className="glass-inset p-4 rounded-2xl flex gap-1">
                        <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 glass-header flex gap-3">
                  {practiceMode === 'call' && (
                    <button onClick={toggleVoice} className={`p-4 rounded-2xl transition-all ${isListening ? 'bg-red-500 text-white' : 'glass-button text-white/80'}`}>
                      {isListening ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>
                  )}
                  <input
                    onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                    onChange={e => setLiveTranscript(e.target.value)}
                    value={liveTranscript}
                    placeholder="Type here..."
                    className="flex-1 glass-inset rounded-2xl px-6 focus:outline-none text-sm text-white placeholder-white/40"
                  />
                  <button onClick={() => handleSendMessage()} className="p-4 glass-button text-blue-400 rounded-2xl hover:scale-105 transition-transform">
                    <MessageCircle size={24} />
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const ProfilesView: React.FC<{
  profiles: ParticipantProfile[];
  survey: Survey;
  surveyFileBuffer: ArrayBuffer | null;
  isDocxTemplate: boolean;
  initiatives: CommunityInitiative[];
  onUpdateProfile: (updated: ParticipantProfile) => void;
  onSelectProfile: (id: string) => void;
}> = ({ profiles, survey, surveyFileBuffer, isDocxTemplate, initiatives, onUpdateProfile, onSelectProfile }) => {
  const [editingProfile, setEditingProfile] = useState<ParticipantProfile | null>(null);
  const [editedResponses, setEditedResponses] = useState<Record<string, string>>({});
  const [editedNotes, setEditedNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const filteredProfiles = profiles.filter(p => p.surveyId === survey.id);

  const startEdit = (profile: ParticipantProfile) => {
    setEditingProfile(profile);
    setEditedResponses({ ...profile.responses });
    setEditedNotes(profile.interviewerNotes || '');
  };

  const handleSaveEdit = async () => {
    if (!editingProfile) return;
    setIsSaving(true);
    try {
      const answeredCount = survey.questions.filter(q => editedResponses[q.fieldName]?.trim()).length;
      const completeness = Math.round((answeredCount / (survey.questions.length || 1)) * 100);

      const updatedProfile: ParticipantProfile = {
        ...editingProfile,
        responses: editedResponses,
        interviewerNotes: editedNotes,
        completeness
      };

      onUpdateProfile(updatedProfile);

      const aiService = createAIService();
      const matched = await aiService.matchReferrals(editedResponses, initiatives, editedNotes);
      const refs = (matched || []).map(m => ({ ...m, selected: false, followedUp: false, status: 'Matched' as const }));
      
      onUpdateProfile({ ...updatedProfile, referrals: refs });
      setEditingProfile(null);
    } catch {
      alert("Saved changes, but re-matching support schemes failed.");
      setEditingProfile(null);
    } finally {
      setIsSaving(false);
    }
  };

  const exportToTxt = (profile: ParticipantProfile) => {
    let content = `==================================================\n`;
    content += `SURVEY FORM: ${survey.name}\n`;
    content += `==================================================\n`;
    content += `Date: ${new Date(profile.timestamp).toLocaleString()}\n`;
    content += `Completeness: ${profile.completeness}%\n\n`;
    
    content += `INTERVIEW RESPONSES:\n`;
    survey.questions.forEach((q, idx) => {
      content += `\n[Q${idx + 1}] ${q.fieldName}\n`;
      content += `Answer: ${profile.responses[q.fieldName] || "(No Response)"}\n`;
      content += `--------------------------------------------------\n`;
    });

    if (profile.interviewerNotes) {
      content += `\nINTERVIEWER EXTRA NOTES:\n`;
      content += `${profile.interviewerNotes}\n`;
      content += `--------------------------------------------------\n`;
    }
    
    if (profile.analysis?.needsAndWants) {
      content += `\nNEEDS & INTERESTS IDENTIFIED:\n` + profile.analysis.needsAndWants.map(n => `- ${n}`).join('\n') + '\n';
      content += `--------------------------------------------------\n`;
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `survey-filled-${profile.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToDocx = (profile: ParticipantProfile) => {
    if (!surveyFileBuffer) return;
    try {
      const zip = new PizZip(surveyFileBuffer);
      const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
      const renderData: Record<string, any> = {};
      survey.questions.forEach(q => {
        const val = profile.responses[q.fieldName] || "";
        renderData[q.fieldName] = val;
        renderData[q.id] = val;
        const cleanKey = q.fieldName.replace(/[^a-zA-Z0-9]/g, "");
        if (cleanKey) renderData[cleanKey] = val;
      });
      doc.render(renderData);
      const out = doc.getZip().generate({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const url = URL.createObjectURL(out);
      const link = document.createElement('a');
      link.href = url;
      link.download = `survey-filled-${profile.id}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(out);
    } catch {
      alert("Failed to render DOCX. Check tags in template.");
    }
  };

  if (filteredProfiles.length === 0) {
    return (
      <div className="p-12 text-center space-y-4">
        <Users size={48} className="text-white/30 mx-auto" />
        <h2 className="text-lg font-black uppercase text-white">No Profiles Found</h2>
        <p className="text-xs text-white/50">Perform voice capture in training labs or upload templates to capture profiles.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 pb-32 text-left font-sans animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-xs font-black text-white/60 uppercase">{filteredProfiles.length} Profiles</h2>
      </div>
      <div className="space-y-3">
        {filteredProfiles.map(profile => {
          const participantName = profile.responses[survey.questions[0]?.fieldName] || 'Participant';
          return (
            <div key={profile.id} className="glass-card rounded-2xl p-5 space-y-4 border border-white/5">
              <div className="flex gap-4">
                <div className="w-11 h-11 glass-inset rounded-xl flex items-center justify-center text-blue-400 flex-shrink-0"><User size={22} /></div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white truncate text-sm">{participantName}</h3>
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    <span className="text-[10px] text-white/50 font-bold uppercase">{new Date(profile.timestamp).toLocaleDateString()}</span>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded bg-green-400/20 text-green-400">{profile.completeness}% Complete</span>
                  </div>
                </div>
              </div>

              {profile.interviewerNotes && (
                <div className="p-3 bg-slate-900/35 border border-white/5 rounded-xl text-[11px] text-white/80 leading-relaxed italic">
                  <span className="block text-[8px] font-black text-purple-400 uppercase not-italic mb-1">Interviewer Notes</span>
                  {profile.interviewerNotes}
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => onSelectProfile(profile.id)} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1.5"><Sparkles size={12} /><span>Outreach Matcher</span></button>
                <button onClick={() => startEdit(profile)} className="py-2 px-3 glass-button rounded-xl text-white/70 hover:text-white" title="Edit Responses"><Edit2 size={14} /></button>
                <button onClick={() => isDocxTemplate && surveyFileBuffer ? exportToDocx(profile) : exportToTxt(profile)} className="py-2 px-3 glass-button rounded-xl" title="Download filled survey"><Download size={14} className="text-white/70" /></button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Profile Modal */}
      <Modal isOpen={!!editingProfile} title="Edit Survey Responses" onClose={() => setEditingProfile(null)} icon={<Edit2 className="text-blue-400" size={20} />}>
        {editingProfile && (
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
            <p className="text-xs text-white/60 mb-2">Edit responses to survey questions and update interviewer notes below:</p>
            <div className="space-y-3">
              {survey.questions.map((q, idx) => (
                <div key={idx} className="space-y-1">
                  <label className="text-[9px] font-black text-blue-400 uppercase block">{q.fieldName}</label>
                  <input
                    type="text"
                    value={editedResponses[q.fieldName] || ''}
                    onChange={e => setEditedResponses(prev => ({ ...prev, [q.fieldName]: e.target.value }))}
                    className="w-full p-2.5 bg-slate-900/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500/30"
                    placeholder="Enter answer..."
                  />
                </div>
              ))}
            </div>
            <div className="space-y-1.5 pt-3 border-t border-white/5">
              <label className="text-[9px] font-black text-purple-400 uppercase block">Extra Notes by Interviewer</label>
              <textarea
                value={editedNotes}
                onChange={e => setEditedNotes(e.target.value)}
                rows={3}
                placeholder="Add extra interviewer notes..."
                className="w-full p-3 bg-slate-900/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500/30 resize-none leading-relaxed"
              />
            </div>
          </div>
        )}
        <div className="flex gap-3 pt-4 border-t border-white/10">
          <button onClick={() => setEditingProfile(null)} className="flex-1 py-3 glass-inset text-white/60 font-black uppercase text-xs rounded-xl" disabled={isSaving}>Cancel</button>
          <button onClick={handleSaveEdit} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs rounded-xl flex items-center justify-center gap-1.5" disabled={isSaving}>
            {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span>Save & Re-Match</span>}
          </button>
        </div>
      </Modal>
    </div>
  );
};

const WhatsAppIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className = "" }) => (
  <svg 
    viewBox="0 0 24 24" 
    width={size} 
    height={size} 
    className={className} 
    fill="currentColor"
  >
    <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 001.37 5.054L2 22l5.077-1.331a9.927 9.927 0 004.93 1.317h.005c5.505 0 9.989-4.478 9.99-9.986 0-2.67-1.037-5.178-2.924-7.067C17.19 3.047 14.685 2 12.012 2zm0 1.698c2.217 0 4.3.864 5.867 2.433 1.566 1.567 2.428 3.65 2.429 5.867-.002 4.573-3.719 8.291-8.297 8.291-.002 0-.003 0-.005 0a8.219 8.219 0 01-4.19-1.157l-.301-.18-3.116.817.83-3.037-.197-.314a8.2 8.2 0 01-1.258-4.364c0-4.572 3.718-8.29 8.293-8.29zM8.91 7.915c-.2-.045-.4-.055-.583-.055-.183 0-.48.068-.73.342-.25.274-.954.933-.954 2.274 0 1.342.977 2.637 1.112 2.82.135.183 1.923 2.937 4.659 4.119.65.282 1.158.45 1.554.575.654.208 1.25.179 1.72.109.525-.078 1.602-.656 1.83-1.259.227-.604.227-1.12.158-1.229-.068-.109-.25-.173-.526-.31-.276-.137-1.632-.805-1.886-.897-.254-.092-.44-.137-.624.137-.184.274-.712.897-.872 1.08-.16.183-.32.205-.596.068-.276-.137-1.166-.43-2.22-1.371-.82-.731-1.374-1.634-1.535-1.908-.16-.274-.017-.422.12-.559.124-.123.276-.32.414-.48.138-.16.184-.274.276-.457.092-.183.046-.342-.023-.48-.069-.137-.624-1.503-.855-2.06-.225-.544-.452-.47-.623-.478z" />
  </svg>
);

interface InitiativesViewProps {
  survey: Survey | null;
  profiles: ParticipantProfile[];
  selectedProfileId: string | null;
  onUpdateProfile: (updated: ParticipantProfile) => void;
  onClearSelection: () => void;
  initiatives: CommunityInitiative[];
}

export const InitiativesView: React.FC<InitiativesViewProps> = ({ survey, profiles, selectedProfileId, onUpdateProfile, onClearSelection, initiatives }) => {
  const [responsesExpanded, setResponsesExpanded] = useState(false);
  const [emailsToCustomize, setEmailsToCustomize] = useState<DispatchedEmail[] | null>(null);
  const [customizedIndex, setCustomizedIndex] = useState<number>(0);

  const selectedProfile = profiles.find(p => p.id === selectedProfileId);
  const matchedReferrals = selectedProfile?.referrals || [];

  const [searchQuery, setSearchQuery] = useState('');

  const unusedInitiatives = initiatives.filter(init => 
    !matchedReferrals.some(ref => ref.initiativeId === init.id)
  );

  const searchedInitiatives = searchQuery.trim() === ''
    ? []
    : unusedInitiatives.filter(init => 
        init.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        init.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        init.description.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const [manualNeeds, setManualNeeds] = useState<{
    shelter: boolean | null;
    financial: boolean | null;
    medical: boolean | null;
    food: boolean | null;
  }>({ shelter: null, financial: null, medical: null, food: null });

  const detectNeeds = () => {
    if (!selectedProfile) return { shelter: false, financial: false, medical: false, food: false };
    const responsesStr = JSON.stringify(selectedProfile.responses).toLowerCase();
    const notesStr = (selectedProfile.interviewerNotes || '').toLowerCase();
    const refsStr = matchedReferrals.map(r => r.initiativeTitle + ' ' + r.matchReason + ' ' + r.category).join(' ').toLowerCase();
    const combined = `${responsesStr} ${notesStr} ${refsStr}`;

    const autoShelter = combined.includes('shelter') || combined.includes('housing') || combined.includes('homeless') || combined.includes('rough sleep') || combined.includes('accommodation');
    const autoFinancial = combined.includes('financial') || combined.includes('income') || combined.includes('comcare') || combined.includes('sso') || combined.includes('bursary') || combined.includes('grant') || combined.includes('allowance') || combined.includes('cash') || combined.includes('debt') || combined.includes('bill');
    const autoMedical = combined.includes('medical') || combined.includes('health') || combined.includes('doctor') || combined.includes('clinic') || combined.includes('hospital') || combined.includes('healthcare') || combined.includes('check-up') || combined.includes('illness');
    const autoFood = combined.includes('food') || combined.includes('meals') || combined.includes('eat') || combined.includes('hungry') || combined.includes('groceries') || combined.includes('soup kitchen') || combined.includes('food bank') || combined.includes('food insecurity');

    return {
      shelter: manualNeeds.shelter !== null ? manualNeeds.shelter : autoShelter,
      financial: manualNeeds.financial !== null ? manualNeeds.financial : autoFinancial,
      medical: manualNeeds.medical !== null ? manualNeeds.medical : autoMedical,
      food: manualNeeds.food !== null ? manualNeeds.food : autoFood,
    };
  };

  const activeNeeds = detectNeeds();

  const getWhatsAppTemplateMessage = () => {
    const pName = selectedProfile ? selectedProfile.responses[survey?.questions[0]?.fieldName || ''] || 'Participant' : 'Participant';
    
    // Selected Matched Schemes
    const selectedRefs = matchedReferrals.filter(ref => ref.selected);
    const schemesBlocks: string[] = [];
    selectedRefs.forEach(ref => {
      const initDetails = initiatives?.find(i => i.id === ref.initiativeId);
      let block = `📋 *${ref.initiativeTitle}* (${ref.category})\nReason: ${ref.matchReason}`;
      if (initDetails) {
        if (initDetails.contactPhone) block += `\n📞 Phone: ${initDetails.contactPhone}`;
        if (initDetails.contactEmail) block += `\n✉️ Email: ${initDetails.contactEmail}`;
        if (initDetails.website) block += `\n🌐 Website: ${initDetails.website}`;
      }
      schemesBlocks.push(block);
    });

    const dynamic_schemes_list = schemesBlocks.length > 0 
      ? `\n*Matched Support Programs (Selected):*\n\n` + schemesBlocks.join('\n\n') + '\n\n'
      : '';

    // Emergency support resources
    const resourceBlocks: string[] = [];
    if (activeNeeds.shelter) {
      resourceBlocks.push(`📍 *For Safe Accommodation & Shelter Tonight:*\nFind an immediate safe space to sleep through the PEERS Network partners: 👉 https://www.msf.gov.sg/what-we-do/rough-sleepers`);
    }
    if (activeNeeds.financial) {
      resourceBlocks.push(`💰 *For Urgent Financial Aid & Social Support:*\nLocate your nearest Social Service Office (SSO) to walk in for ComCare assistance: 👉 https://www.supportgowhere.gov.sg`);
    }
    if (activeNeeds.medical) {
      resourceBlocks.push(`🏥 *For Free Medical Care & Check-ups:*\nVisit a mobile or community outreach clinic for free healthcare: 👉 https://mtalvernia.sg/outreach/`);
    }
    if (activeNeeds.food) {
      resourceBlocks.push(`🍲 *For Free Daily Meals & Food Packs:*\nFind free hot meals and soup kitchens in your immediate area: 👉 Home - The Food Bank Singapore`);
    }

    const dynamic_resource_list = resourceBlocks.length > 0 
      ? resourceBlocks.join('\n\n')
      : `_No immediate emergency resources selected. Use the toggles below to add resources._`;

    return `Hi ${pName}, it was really nice chatting with you just now. Thank you for sharing your story with us.\n\n` +
      `Our system is currently processing your information to match you with the best financial, housing, and social support workflows.\n\n` +
      dynamic_schemes_list +
      `*Immediate Emergency Support Resources:*\n\n` +
      `${dynamic_resource_list}\n\n` +
      `Please take care, and our team will text you an update right here as soon as your primary application details are verified! If you need anything urgent in the meantime, feel free to reply to this message.`;
  };

  const getWhatsAppTemplateLink = () => {
    const text = getWhatsAppTemplateMessage();
    const encodedText = encodeURIComponent(text);
    const cleanedPhone = cleanPhoneNumber(participantPhone);
    if (cleanedPhone) {
      return `https://wa.me/${cleanedPhone}?text=${encodedText}`;
    }
    return `https://wa.me/?text=${encodedText}`;
  };

  const getAIContinuityPrompt = () => {
    const pName = selectedProfile ? selectedProfile.responses[survey?.questions[0]?.fieldName || ''] || 'Participant' : 'Participant';
    const emailField = survey?.questions.find(q => q.fieldName.toLowerCase().includes('email'))?.fieldName || '';
    const participantEmail = selectedProfile ? selectedProfile.responses[emailField] || `${pName.toLowerCase().replace(/\s+/g, '.')}@gmail.com` : 'N/A';
    
    const detectedNeedsList: string[] = [];
    if (activeNeeds.shelter) detectedNeedsList.push("Shelter/Housing Need");
    if (activeNeeds.financial) detectedNeedsList.push("Financial/SSO Need");
    if (activeNeeds.medical) detectedNeedsList.push("Medical Need");
    if (activeNeeds.food) detectedNeedsList.push("Food Insecurity");
    const hasJobReferral = matchedReferrals.some(r => r.category.toLowerCase().includes('job') || r.category.toLowerCase().includes('upskill') || r.initiativeTitle.toLowerCase().includes('skillsfuture') || r.initiativeTitle.toLowerCase().includes('career'));
    if (hasJobReferral) detectedNeedsList.push("Job Support & Upskilling");

    const detectedNeedsStr = detectedNeedsList.length > 0 ? detectedNeedsList.join(', ') : 'None explicitly detected';
    const responsesList = survey?.questions.map(q => `- ${q.fieldName}: ${selectedProfile?.responses[q.fieldName] || '—'}`).join('\n') || '';
    const matchedSchemesList = matchedReferrals.map(ref => `- ${ref.initiativeTitle} (${ref.category}): ${ref.matchReason} [Priority: ${ref.priority}]`).join('\n') || 'None matched';
    const dispatchHistoryList = selectedProfile?.dispatchedEmails && selectedProfile.dispatchedEmails.length > 0
      ? selectedProfile.dispatchedEmails.map(log => `- Sent ${log.recipientType} Email to ${log.recipient} on ${new Date(log.timestamp).toLocaleDateString()}: "${log.subject}"`).join('\n')
      : 'No outreach emails dispatched yet';

    return `You are an AI outreach continuity assistant helping a community surveyor after a CARE-O assessment.
 
You are receiving structured CARE-O data from the Conversational Assessment & Routing Engine for Outreach.
 
Email and WhatsApp drafting are already handled elsewhere in CARE-O. Do not draft the main email or WhatsApp follow-up unless specifically needed for a check-in or resource reminder.
 
Your job is to generate:
1. regular check-in messages,
2. immediate resource reminders,
3. a future update schedule,
4. an escalation review,
5. a future scheme monitoring plan,
6. a document checklist for each matched scheme,
7. a comparison of multiple matched schemes,
8. participant-friendly explanations of matched schemes,
9. any contradictions or inconsistencies detected in the profile,
10. and a single "next best action" for the caseworker/surveyor to take first.
 
Important rules:
- Be warm, respectful, concise, and non-judgmental.
- Do not invent participant facts.
- Clearly mark assumptions.
- Do not promise that support is guaranteed.
- Do not diagnose medical, legal, financial, or mental health conditions.
- If urgent risk is detected, recommend human review.
- Participant-facing messages should be simple and reassuring.
- Surveyor-facing guidance should be practical and operational.
- If a future scheme/resource may be relevant, phrase it as “monitor for” or “notify if available,” not as a guaranteed benefit.
 
CARE-O CONTEXT
 
Participant Name:
${pName}
 
Participant Phone / WhatsApp:
${participantPhone || 'Not Provided'}
 
Participant Email:
${participantEmail}
 
Survey Name:
${survey?.name || 'Community Assessment'}
 
Profile Date:
${selectedProfile ? new Date(selectedProfile.timestamp).toLocaleDateString() : 'N/A'}
 
Profile Completeness:
${selectedProfile?.completeness || 0}%
 
Detected Needs:
${detectedNeedsStr}
 
Interviewer Notes:
${selectedProfile?.interviewerNotes || 'None'}
 
Survey Responses:
${responsesList}
 
Matched Support Schemes:
${matchedSchemesList}
 
Existing Outreach / Dispatch History:
${dispatchHistoryList}
 
IMMEDIATE RESOURCE RULES
 
If the CARE-O context suggests housing, shelter, homelessness, rough sleeping, unsafe accommodation, eviction, or urgent accommodation need, include this resource:
 
📍 Safe Accommodation & Shelter:
Find an immediate safe space to sleep through the PEERS Network partners:
https://www.msf.gov.sg/what-we-do/rough-sleepers
 
If the CARE-O context suggests financial need, low income, no income, unemployment, debt, bills, urgent aid, rent, utilities, ComCare, or SSO need, include this resource:
 
💰 Financial Aid & Social Support:
Locate your nearest Social Service Office to walk in for ComCare assistance:
https://www.supportgowhere.gov.sg
 
If the CARE-O context suggests medical, health, clinic, hospital, medication, check-up, injury, illness, or healthcare need, include this resource:
 
🏥 Medical Care & Check-ups:
Visit a mobile or community outreach clinic for free healthcare:
https://mtalvernia.sg/outreach/
 
If the CARE-O context suggests food insecurity, skipped meals, hunger, groceries, food packs, free meals, or soup kitchen need, include this resource:
 
🍲 Food Support:
Find food support and food bank resources:
https://www.foodbank.sg
 
If the CARE-O context suggests job search, employment, career transition, training, upskilling, or reskilling need, include this resource:
 
🎓 Job Support & Upskilling:
Explore SkillsFuture and career transition support:
https://www.skillsfuture.gov.sg
 
FUTURE SCHEME MONITORING RULES
 
Based on the participant’s detected needs, recommend what kinds of future schemes or resources the surveyor should monitor for.
 
Examples:
- If financial need is detected, monitor for new ComCare, CDC, municipal, charity, or emergency relief schemes.
- If housing/shelter need is detected, monitor for shelter, rental assistance, temporary accommodation, rough-sleeper support, or family mediation resources.
- If food insecurity is detected, monitor for food banks, meal programmes, grocery vouchers, soup kitchens, or community pantry programmes.
- If medical need is detected, monitor for free clinics, mobile health screenings, medication subsidies, community health outreach, or specialist referral programmes.
- If employment/upskilling need is detected, monitor for job fairs, SkillsFuture subsidies, placement programmes, resume clinics, career coaching, or short-term training grants.
- If senior/digital access need is detected, monitor for digital literacy classes, subsidized devices, telco support, senior activity centres, or befriending programmes.
- If family/dependent support is detected, monitor for childcare aid, caregiver support, family service centre programmes, school assistance, or respite care.
 
TASKS
 
Please generate the following sections only:
 
## 1. Regular Check-in Messages
 
Create participant-facing check-in messages for:
 
### Day 1 Check-in
A short message asking how they are doing after the assessment and whether anything urgent has changed.
 
### Day 3 Check-in
A short message reminding them that support matching/follow-up is ongoing and asking if they need help with immediate resources.
 
### Day 7 Check-in
A short message checking whether they have contacted any suggested resources and whether they need help with applications or documents.
 
### Day 14 Check-in
A short message checking longer-term status and whether their situation has changed.
 
Messages should:
- be warm and simple,
- not sound robotic,
- avoid making promises,
- invite the participant to reply if urgent support is needed.
 
## 2. Immediate Resource Reminder
 
Using the CARE-O context and the resource rules above, list only the immediate resources relevant to the participant’s detected needs.
 
For each resource:
- include the emoji/title,
- explain why it may be relevant in one sentence,
- include the link,
- keep wording careful: “may be useful” or “you can approach,” not “you are guaranteed.”
 
If no specific urgent category is detected, recommend SupportGoWhere as a general resource.
 
## 3. Future Update Schedule
 
Create a practical follow-up schedule for the surveyor.
 
Include:
- when to check in,
- what to verify,
- what documents/info may be needed,
- what referral statuses to update,
- when to escalate to a human supervisor.
 
Format as a timeline:
- Within 24 hours
- Within 3 days
- Within 1 week
- Within 2 weeks
- After 1 month
 
## 4. Escalation Review
 
Assess whether this case should be flagged for additional human review.
 
Use one of these levels:
- Low
- Medium
- High
- Urgent
 
Consider:
- no safe housing,
- no food,
- urgent medical issue,
- safety risk,
- no income,
- dependent care stress,
- mental distress,
- repeated failed follow-ups,
- missing critical information.
 
Output:
Level:
Reasoning:
Immediate concerns:
Recommended human follow-up:
Information still needed:
 
Do not diagnose or make final eligibility decisions.
 
## 5. Future Scheme Monitoring Plan
 
Based on the participant’s needs, list the types of future schemes/resources that CARE-O or the surveyor should watch for.
 
For each monitoring category, include:
- Need category
- What future schemes to monitor for
- Why it matters for this participant
- Suggested notification trigger
- Who should be notified: surveyor, participant, or both
 
Also write a short template message for notifying the participant if a newly relevant scheme becomes available.
 
Output format:
 
### Monitoring Category 1
Need Category:
Future Schemes to Monitor:
Why It Matters:
Notification Trigger:
Notify:
Suggested Participant Notification:
 
### Monitoring Category 2
...
 
## 6. Document Checklist
For each matched scheme listed above, generate a likely document checklist needed for submission.
 
Format:
### [Scheme Name] Document Checklist
- [List specific documents like NRIC/ID, household income proof, bank statements, utility bill amount/rental tenancy agreement, medical memo/documents, etc.]
Caveat: Verify with the official scheme before submission.
 
## 7. Comparison of Multiple Matched Schemes
Compare the matched schemes to help the surveyor understand relative priorities:
- Explain which scheme is the most relevant for immediate safety net support vs long-term pathways.
- Explain which schemes are the fastest to get assistance from vs which require extensive document preparation.
- Recommend which schemes to reach out to/apply for first.
 
## 8. Participant-Friendly Explanations
Many schemes have confusing language or official titles. Rewrite the matched schemes into plain, simple, jargon-free explanations that a resident can easily understand.
Example: ComCare Short-to-Medium Term Assistance -> "This is temporary financial help for residents who are having difficulty with daily expenses or bills."
 
## 9. Contradictions or Inconsistencies Detection
Inspect the survey responses and interviewer notes to identify any inconsistencies or contradictions (e.g. participant says unemployed but income listed is high, or housing need mentioned in notes but no housing questions answered, or missing contact info when follow-up is required).
Output: Any contradictions found, or note if the profile seems completely consistent.
 
## 10. Next Best Action Recommendation
Provide a single clear "Next Best Action" summary that acts as an intelligent starting point for the surveyor.
Example: "Next Best Action: Send immediate financial and food resource reminder today, then schedule a Day 3 check-in to verify whether the participant contacted SSO."`;
  };

  const downloadAIContinuityPrompt = () => {
    const pName = selectedProfile ? selectedProfile.responses[survey?.questions[0]?.fieldName || ''] || 'Participant' : 'Participant';
    const payload = getAIContinuityPrompt();
    const blob = new Blob([payload], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `care-o-ai-continuity-prompt-${pName.toLowerCase().replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const cleanPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned.length === 8 && /^[89]/.test(cleaned)) {
      return `65${cleaned}`;
    }
    return cleaned;
  };

  const phoneField = survey?.questions.find(q => {
    const name = q.fieldName.toLowerCase();
    return name.includes('phone') || name.includes('contact') || name.includes('mobile') || name.includes('number');
  })?.fieldName || '';
  const participantPhone = selectedProfile && phoneField ? selectedProfile.responses[phoneField] || '' : '';

  const getWhatsAppLink = (init: CommunityInitiative, phone: string) => {
    const pName = selectedProfile ? selectedProfile.responses[survey?.questions[0]?.fieldName || ''] || 'Participant' : 'Participant';
    const text = `Hi ${pName}! Here are the details of the support program we discussed:\n\n` +
      `*${init.title}*\n` +
      `${init.description}\n\n` +
      (init.contactPhone ? `📞 Phone: ${init.contactPhone}\n` : '') +
      (init.contactEmail ? `✉️ Email: ${init.contactEmail}\n` : '') +
      (init.website ? `🌐 Website: ${init.website}\n` : '') +
      `\nFeel free to reach out to them directly or let me know if you need help with application!`;
      
    const encodedText = encodeURIComponent(text);
    const cleanedPhone = cleanPhoneNumber(phone);
    if (cleanedPhone) {
      return `https://wa.me/${cleanedPhone}?text=${encodedText}`;
    }
    return `https://wa.me/?text=${encodedText}`;
  };

  const updateReferralStatus = (refId: string, newStatus: any) => {
    if (!selectedProfile || !selectedProfile.referrals) return;
    const updated = selectedProfile.referrals.map(ref => 
      ref.initiativeId === refId 
        ? { ...ref, status: newStatus, followedUp: ['Dispatched', 'Approved', 'Closed'].includes(newStatus) } 
        : ref
    );
    onUpdateProfile({ ...selectedProfile, referrals: updated });
  };

  const toggleReferralSelection = (refId: string) => {
    if (!selectedProfile || !selectedProfile.referrals) return;
    const updated = selectedProfile.referrals.map(ref => 
      ref.initiativeId === refId ? { ...ref, selected: !ref.selected } : ref
    );
    onUpdateProfile({ ...selectedProfile, referrals: updated });
  };

  const handleDispatchSelectedEmails = () => {
    if (!selectedProfile || !selectedProfile.referrals) return;
    const selected = selectedProfile.referrals.filter(ref => ref.selected && !ref.followedUp);
    if (selected.length === 0) return alert("Select at least one matched program.");

    const participantName = selectedProfile.responses[survey?.questions[0]?.fieldName || ''] || 'Participant';
    const emailField = survey?.questions.find(q => q.fieldName.toLowerCase().includes('email'))?.fieldName || '';
    const participantEmail = selectedProfile.responses[emailField] || `${participantName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`;

    const generated: DispatchedEmail[] = [];

    // Confirmation email
    let pBody = `Dear ${participantName},\n\nWe have referred you to these schemes:\n`;
    selected.forEach((ref, idx) => { pBody += `${idx + 1}. ${ref.initiativeTitle}\n`; });
    pBody += `\nStaff from the respective departments will contact you.`;
    
    generated.push({ id: `e-p-${Date.now()}`, recipient: participantEmail, recipientType: 'Participant', subject: `Referral Confirmation: ${survey?.name}`, body: pBody, timestamp: Date.now() });

    // Organisation emails
    selected.forEach((ref, idx) => {
      generated.push({
        id: `e-org-${Date.now()}-${idx}`,
        recipient: ref.category.includes('Financial') ? 'bursaries@community.gov' : 'outreach@community.gov',
        recipientType: 'Organisation',
        subject: `Outreach Referral: ${participantName} - ${ref.initiativeTitle}`,
        body: `Dear Intake Officer,\n\nWe refer participant "${participantName}" for ${ref.initiativeTitle}.\nReason: ${ref.matchReason}`,
        timestamp: Date.now()
      });
    });

    setEmailsToCustomize(generated);
    setCustomizedIndex(0);
  };

  if (!selectedProfile) {
    return (
      <div className="p-8 text-center space-y-4 pt-16 font-sans">
        <div className="w-14 h-14 glass-inset rounded-2xl flex items-center justify-center mx-auto text-blue-400"><Sparkles size={28} /></div>
        <h3 className="text-white font-bold text-sm uppercase">Select Profile First</h3>
        <p className="text-white/60 text-xs max-w-xs mx-auto">Open the **Profiles** tab and click **Outreach Matcher** on any profile to match local support programs and generate drafts.</p>
      </div>
    );
  }

  const participantName = selectedProfile.responses[survey?.questions[0]?.fieldName || ''] || 'Participant';

  return (
    <div className="p-6 space-y-6 text-left font-sans">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Outreach Matcher</h2>
          <p className="text-xs text-white/50">Manage local support grants for {participantName}</p>
        </div>
        <button onClick={onClearSelection} className="px-3 py-1.5 glass-button text-xs rounded-xl">Back</button>
      </div>

      <div className="glass-card rounded-[2rem] p-6 space-y-4 border border-white/5">
        <button onClick={() => setResponsesExpanded(!responsesExpanded)} className="w-full flex justify-between items-center text-xs font-bold text-white/80">
          <span>Responses Overview</span>
          {responsesExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {responsesExpanded && (
          <div className="space-y-2 max-h-48 overflow-y-auto pt-2 border-t border-white/5">
            {survey?.questions.map(q => (
              <div key={q.id} className="text-xs">
                <span className="block font-black text-blue-400/80 uppercase">{q.fieldName}</span>
                <span className="text-white/80">{selectedProfile.responses[q.fieldName] || "—"}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-black text-white/60 uppercase">Matched Local Schemes</h3>
        {matchedReferrals.map(ref => {
          const isFollowedUp = ref.followedUp;
          const currentStatus = ref.status || (ref.followedUp ? 'Dispatched' : 'Matched');
          const initDetails = initiatives?.find(i => i.id === ref.initiativeId);
          return (
            <div key={ref.initiativeId} onClick={() => !isFollowedUp && toggleReferralSelection(ref.initiativeId)} className={`p-4 rounded-2xl border transition-all ${isFollowedUp ? 'bg-green-500/5 border-green-500/20' : ref.selected ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/5 border-white/10'}`}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="text-blue-400 mt-0.5">{isFollowedUp ? <CheckCircle className="text-green-400" size={16} /> : ref.selected ? <CheckSquare size={16} /> : <Square size={16} />}</div>
                  <div>
                    <h4 className="font-bold text-white text-xs">{ref.initiativeTitle}</h4>
                    <span className="text-[9px] text-white/40 uppercase font-black tracking-widest">{ref.category}</span>
                  </div>
                </div>
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${ref.priority === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>{ref.priority}</span>
              </div>
              <p className="text-[11px] text-white/80 mt-3 p-3 bg-slate-900/40 border border-white/5 rounded-xl">{ref.matchReason}</p>
              
              {initDetails && (initDetails.contactPhone || initDetails.contactEmail || initDetails.website) && (
                <div className="mt-3 text-[10px] text-white/70 bg-slate-950/40 border border-white/5 p-3 rounded-xl flex flex-col gap-2">
                  <div className="flex justify-between items-center text-[8px] font-black uppercase text-blue-400 tracking-wider">
                    <span>Quick Contact Info</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const pName = selectedProfile ? selectedProfile.responses[survey?.questions[0]?.fieldName || ''] || 'Participant' : 'Participant';
                          const text = `Hi ${pName}! Here is the contact info for ${initDetails.title}:\n\n` +
                            `*${initDetails.title}*\n` +
                            `${initDetails.description}\n\n` +
                            (initDetails.contactPhone ? `📞 Phone: ${initDetails.contactPhone}\n` : '') +
                            (initDetails.contactEmail ? `✉️ Email: ${initDetails.contactEmail}\n` : '') +
                            (initDetails.website ? `🌐 Website: ${initDetails.website}\n` : '');
                          navigator.clipboard.writeText(text);
                          alert(`Copied contact details for ${initDetails.title}!`);
                        }}
                        className="px-1.5 py-0.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded transition-all font-bold text-[7px] tracking-tight"
                      >
                        Copy Quick Details
                      </button>
                      <a
                        href={getWhatsAppLink(initDetails, participantPhone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="px-1.5 py-0.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded transition-all font-bold text-[7px] tracking-tight flex items-center gap-1 border border-green-500/10"
                      >
                        <WhatsAppIcon size={9} />
                        <span>Send WhatsApp</span>
                      </a>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 font-medium">
                    {initDetails.contactPhone && (
                      <a href={`tel:${initDetails.contactPhone}`} onClick={e => e.stopPropagation()} className="hover:text-white flex items-center gap-1 transition-all text-white/80 font-semibold">
                        <span>📞</span> <span className="underline">{initDetails.contactPhone}</span>
                      </a>
                    )}
                    {initDetails.contactEmail && (
                      <a href={`mailto:${initDetails.contactEmail}`} onClick={e => e.stopPropagation()} className="hover:text-white flex items-center gap-1 transition-all text-white/80">
                        <span>✉️</span> <span className="underline truncate max-w-[120px]">{initDetails.contactEmail}</span>
                      </a>
                    )}
                    {initDetails.website && (
                      <a href={initDetails.website.startsWith('http') ? initDetails.website : `https://${initDetails.website}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="hover:text-white flex items-center gap-1 transition-all text-white/80 truncate max-w-[120px]">
                        <span>🌐</span> <span className="underline">{initDetails.website}</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-1 overflow-x-auto pt-3 border-t border-white/5 mt-3">
                {(['Matched', 'Drafted', 'Dispatched', 'Approved', 'Closed'] as const).map(stage => (
                  <button
                    key={stage}
                    onClick={e => { e.stopPropagation(); updateReferralStatus(ref.initiativeId, stage); }}
                    className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${currentStatus === stage ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/40'}`}
                  >
                    {stage}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Search and Add other schemes */}
      <div className="glass-card rounded-[2rem] p-6 space-y-4 border border-white/5">
        <h3 className="text-xs font-black text-white/60 uppercase">Add Other Support Schemes</h3>
        <p className="text-[10px] text-white/50 leading-normal">
          Search from the global database of municipal social schemes to manually match them to this participant profile.
        </p>
        <div className="relative">
          <input
            type="text"
            placeholder="Search schemes (e.g. ComCare, CDC, SkillsFuture)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full p-3 bg-slate-900/40 border border-white/10 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none"
          />
          {searchQuery.trim() !== '' && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-2xl max-h-56 overflow-y-auto z-[60] shadow-2xl p-2 space-y-1 glass-nav">
              {searchedInitiatives.map(init => (
                <div key={init.id} className="p-3 hover:bg-white/5 rounded-xl flex items-center justify-between gap-3 text-left transition-all">
                  <div className="min-w-0">
                    <span className="block text-[8px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">{init.category}</span>
                    <span className="block text-xs font-bold text-white truncate">{init.title}</span>
                    <span className="block text-[9px] text-white/60 truncate mt-0.5">{init.description}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newRef: ReferralRecommendation = {
                        initiativeId: init.id,
                        initiativeTitle: init.title,
                        category: init.category,
                        matchReason: "Manually matched by the outreach coordinator.",
                        priority: "Medium",
                        selected: true,
                        followedUp: false,
                        status: "Matched"
                      };
                      onUpdateProfile({
                        ...selectedProfile,
                        referrals: [...matchedReferrals, newRef]
                      });
                      setSearchQuery('');
                      alert(`Successfully added "${init.title}" to matched schemes.`);
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[8px] tracking-wider rounded-lg flex-shrink-0 transition-colors"
                  >
                    Add
                  </button>
                </div>
              ))}
              {searchedInitiatives.length === 0 && (
                <div className="p-3 text-center text-xs text-white/40 italic">
                  No matching schemes found.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp Template Card */}
      <div className="glass-card rounded-[2rem] p-6 space-y-4 border border-white/5 text-left font-sans">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WhatsAppIcon size={18} className="text-green-400" />
            <h3 className="text-xs font-black text-white uppercase tracking-wider">WhatsApp Template</h3>
          </div>
          <span className="text-[8px] font-black uppercase bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">WhatsApp Template</span>
        </div>

        <p className="text-[10px] text-white/60 leading-normal">
          Based on responses and matches, we dynamically generate a tailored resource text message combining selected support programs and emergency lines. Toggle options below to include or exclude emergency support.
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          {[
            { key: 'shelter' as const, label: 'Shelter & Housing', emoji: '📍' },
            { key: 'financial' as const, label: 'Urgent Financial Aid', emoji: '💰' },
            { key: 'medical' as const, label: 'Free Medical Care', emoji: '🏥' },
            { key: 'food' as const, label: 'Free Daily Meals', emoji: '🍲' }
          ].map(need => {
            const val = activeNeeds[need.key];
            const isOverridden = manualNeeds[need.key] !== null;

            return (
              <button
                key={need.key}
                onClick={() => {
                  setManualNeeds(prev => ({
                    ...prev,
                    [need.key]: manualNeeds[need.key] === null ? !val : manualNeeds[need.key] ? false : manualNeeds[need.key] === false ? null : false
                  }));
                }}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  val 
                    ? 'bg-green-500/10 border-green-500/35 text-white' 
                    : 'bg-white/5 border-white/10 text-white/50'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs">{need.emoji}</span>
                  <span className={`text-[7px] font-black uppercase px-1 rounded ${
                    isOverridden 
                      ? 'bg-yellow-500/20 text-yellow-400' 
                      : val 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-white/10 text-white/40'
                  }`}>
                    {isOverridden ? 'Manual' : val ? 'Detected' : 'Off'}
                  </span>
                </div>
                <span className="text-[9px] font-bold mt-1.5 leading-none">{need.label}</span>
              </button>
            );
          })}
        </div>

        <div className="space-y-1.5 pt-2">
          <span className="block text-[8px] font-black text-blue-400 uppercase tracking-widest">Live Template Preview</span>
          <div className="p-4 bg-slate-950/80 border border-white/5 rounded-2xl text-[11px] text-white/80 font-mono leading-relaxed whitespace-pre-wrap max-h-52 overflow-y-auto select-all">
            {getWhatsAppTemplateMessage()}
          </div>
        </div>

        <div className="flex pt-2">
          <button
            onClick={() => {
              navigator.clipboard.writeText(getWhatsAppTemplateMessage());
              alert("WhatsApp template message copied to clipboard!");
            }}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wide hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            Copy Message
          </button>
        </div>
      </div>

      {/* ChatChat Prompt Card */}
      <div className="glass-card rounded-[2rem] p-6 space-y-4 border border-white/5 text-left font-sans">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain size={18} className="text-purple-400 animate-pulse" />
            <h3 className="text-xs font-black text-white uppercase tracking-wider text-purple-300">ChatChat Prompt</h3>
          </div>
          <span className="text-[8px] font-black uppercase bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">ChatChat Prompt</span>
        </div>

        <p className="text-[10px] text-white/60 leading-normal">
          Ask a trained AI agent for more details and advice
        </p>

        <div className="space-y-1.5 pt-1">
          <span className="block text-[8px] font-black text-purple-400 uppercase tracking-widest">ChatChat Prompt Preview</span>
          <div className="p-4 bg-slate-950/80 border border-white/5 rounded-2xl text-[10px] text-white/70 font-mono leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto select-all">
            {getAIContinuityPrompt()}
          </div>
        </div>

        <div className="flex gap-2.5 pt-1">
          <button
            onClick={() => {
              navigator.clipboard.writeText(getAIContinuityPrompt());
              alert("ChatChat Prompt copied to clipboard!");
            }}
            className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wide flex items-center justify-center gap-1.5 shadow-lg shadow-purple-500/10 hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            <span>Copy ChatChat Prompt</span>
          </button>
          <button
            onClick={downloadAIContinuityPrompt}
            className="py-3 px-4 glass-button rounded-xl text-[10px] font-black uppercase text-white/80 hover:text-white transition-all flex items-center justify-center"
            title="Download Prompt as TXT"
          >
            <Download size={14} />
          </button>
        </div>
      </div>

      {matchedReferrals.some(r => r.selected && !r.followedUp) && (
        <button onClick={handleDispatchSelectedEmails} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"><Send size={14} /><span>Send Follow-Up Emails</span></button>
      )}

      {selectedProfile.dispatchedEmails && selectedProfile.dispatchedEmails.length > 0 && (
        <div className="space-y-2 pt-4 border-t border-white/10">
          <h3 className="text-xs font-black text-white/60 uppercase">Outreach Email Logs</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {selectedProfile.dispatchedEmails.map(log => (
              <div key={log.id} className="p-3 bg-slate-950/40 border border-white/5 rounded-xl text-xs space-y-1">
                <div className="flex justify-between font-bold text-white/60"><span className="text-[9px] uppercase">{log.recipientType}: {log.recipient}</span><span>{new Date(log.timestamp).toLocaleTimeString()}</span></div>
                <p className="text-white/80 font-medium truncate">{log.subject}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {emailsToCustomize && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
          <div className="glass-card rounded-[2rem] max-w-md w-full p-6 space-y-6 text-left border border-white/10 shadow-2xl">
            <h3 className="text-base font-black text-white uppercase border-b border-white/10 pb-3">Review Email ({customizedIndex + 1}/{emailsToCustomize.length})</h3>
            <div className="space-y-3">
              <input type="text" value={emailsToCustomize[customizedIndex].recipient} onChange={e => { const u = [...emailsToCustomize]; u[customizedIndex].recipient = e.target.value; setEmailsToCustomize(u); }} className="w-full p-3 glass-inset rounded-xl text-xs text-white" />
              <input type="text" value={emailsToCustomize[customizedIndex].subject} onChange={e => { const u = [...emailsToCustomize]; u[customizedIndex].subject = e.target.value; setEmailsToCustomize(u); }} className="w-full p-3 glass-inset rounded-xl text-xs text-white" />
              <textarea rows={6} value={emailsToCustomize[customizedIndex].body} onChange={e => { const u = [...emailsToCustomize]; u[customizedIndex].body = e.target.value; setEmailsToCustomize(u); }} className="w-full p-3 glass-inset rounded-xl text-xs text-white font-mono leading-relaxed resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEmailsToCustomize(null)} className="flex-1 py-3 glass-inset text-xs rounded-xl">Cancel</button>
              {customizedIndex < emailsToCustomize.length - 1 ? (
                <button onClick={() => setCustomizedIndex(customizedIndex + 1)} className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-xs">Next</button>
              ) : (
                <button
                  onClick={() => {
                    const matchedRefs = selectedProfile.referrals || [];
                    const updated = matchedRefs.map(ref => ref.selected ? { ...ref, followedUp: true, status: 'Dispatched' as const, selected: false } : ref);
                    onUpdateProfile({ ...selectedProfile, referrals: updated, dispatchedEmails: [...(selectedProfile.dispatchedEmails || []), ...emailsToCustomize] });
                    setEmailsToCustomize(null);
                    alert("Mock outreach referrals dispatched!");
                  }}
                  className="flex-1 py-3 bg-green-600 text-white rounded-xl text-xs"
                >
                  Send All
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const SchemesView: React.FC<{
  initiatives: CommunityInitiative[];
  setInitiatives: React.Dispatch<React.SetStateAction<CommunityInitiative[]>>;
}> = ({ initiatives, setInitiatives }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CommunityInitiative['category']>('Outreach Event');
  const [organisation, setOrganisation] = useState('');
  const [description, setDescription] = useState('');
  const [eligibility, setEligibility] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [filter, setFilter] = useState<'all' | 'Financial Bursary' | 'Upskilling' | 'Activity' | 'Other'>('all');

  const filtered = (initiatives || []).filter(i => i && (filter === 'all' || i.category === filter || (filter === 'Other' && !['Financial Bursary', 'Upskilling', 'Activity'].includes(i.category))));

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    const newItem: CommunityInitiative = {
      id: `init-${Date.now()}`,
      title: title.trim(),
      category: category || 'Outreach Event',
      description: description.trim(),
      eligibility: (eligibility || '').trim() || 'Open to all Singapore residents.',
      organisation: (organisation || '').trim() || 'Social Services',
      contactPhone: contactPhone.trim() || undefined,
      contactEmail: contactEmail.trim() || undefined,
      website: website.trim() || undefined
    };
    if (typeof setInitiatives === 'function') {
      setInitiatives(prev => [...(prev || []), newItem]);
    }
    setTitle('');
    setDescription('');
    setEligibility('');
    setOrganisation('');
    setContactPhone('');
    setContactEmail('');
    setWebsite('');
    setShowAdd(false);
  };

  const groupedByOrg = filtered.reduce((groups, item) => {
    if (!item) return groups;
    const org = (typeof item.organisation === 'string' ? item.organisation.trim() : '') || 'Other Services';
    if (!groups[org]) {
      groups[org] = [];
    }
    groups[org].push(item);
    return groups;
  }, {} as Record<string, CommunityInitiative[]>);

  return (
    <div className="p-6 space-y-6 pb-32 text-left font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Support Schemes</h2>
          <p className="text-xs text-white/50">Schemes database used by matching engine</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="px-3 py-2 glass-button text-blue-400 rounded-xl text-xs font-black uppercase tracking-wider">{showAdd ? 'Close' : 'Add New'}</button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="glass-inset p-5 rounded-2xl space-y-3">
          <input type="text" placeholder="Title" required value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 bg-slate-900/40 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none" />
          <select value={category} onChange={e => setCategory(e.target.value as any)} className="w-full p-3 bg-slate-900/40 rounded-xl text-xs text-white focus:outline-none">
            <option value="Financial Bursary">Financial Bursary</option>
            <option value="Upskilling">Upskilling</option>
            <option value="Outreach Event">Outreach Event</option>
            <option value="Activity">Activity</option>
            <option value="Other">Other</option>
          </select>
          <input type="text" placeholder="Organisation" value={organisation} onChange={e => setOrganisation(e.target.value)} className="w-full p-3 bg-slate-900/40 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none" />
          <textarea placeholder="Description" required rows={2} value={description} onChange={e => setDescription(e.target.value)} className="w-full p-3 bg-slate-900/40 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none" />
          <input type="text" placeholder="Eligibility Criteria" value={eligibility} onChange={e => setEligibility(e.target.value)} className="w-full p-3 bg-slate-900/40 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none" />
          
          <div className="grid grid-cols-2 gap-2">
            <input type="text" placeholder="Phone Number" value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="w-full p-3 bg-slate-900/40 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none" />
            <input type="email" placeholder="Email Address" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="w-full p-3 bg-slate-900/40 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none" />
          </div>
          <input type="text" placeholder="Website URL (e.g. www.example.com)" value={website} onChange={e => setWebsite(e.target.value)} className="w-full p-3 bg-slate-900/40 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none" />
          
          <button type="submit" className="w-full py-3 bg-blue-600 text-white font-black uppercase text-xs rounded-xl shadow">Save Scheme</button>
        </form>
      )}

      <div className="flex gap-2 p-1 bg-white/5 border border-white/5 rounded-xl">
        {(['all', 'Financial Bursary', 'Upskilling', 'Activity', 'Other'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${filter === f ? 'glass-button text-blue-400' : 'text-white/40'}`}>
            {f === 'all' ? 'All' : f.split(' ')[0]}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {Object.entries(groupedByOrg).map(([orgName, items]) => (
          <div key={orgName} className="space-y-3">
            <div className="flex items-center gap-2 pl-1.5 border-l-2 border-blue-500">
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider">{orgName}</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-white/10 rounded-full text-white/60 font-bold">{items.length}</span>
            </div>
            <div className="space-y-3">
              {items.map(i => (
                <div key={i.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-white text-xs">{i.title}</h4>
                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 uppercase">{i.category}</span>
                  </div>
                  <p className="text-xs text-white/80 leading-relaxed">{i.description}</p>
                  
                  {(i.contactPhone || i.contactEmail || i.website) && (
                    <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[9px] text-white/60 bg-slate-900/30 p-2.5 rounded-xl border border-white/5 font-medium">
                      {i.contactPhone && <span className="flex items-center gap-1">📞 {i.contactPhone}</span>}
                      {i.contactEmail && <span className="flex items-center gap-1">✉️ {i.contactEmail}</span>}
                      {i.website && <span className="flex items-center gap-1 truncate max-w-full">🌐 {i.website}</span>}
                    </div>
                  )}
                  
                  <div className="text-[9px] text-white/40 border-t border-white/5 pt-2 font-bold uppercase"><span className="text-blue-400">Eligibility:</span> {i.eligibility}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {Object.keys(groupedByOrg).length === 0 && (
          <p className="text-xs text-white/40 text-center py-6">No support schemes found in this category.</p>
        )}
      </div>
    </div>
  );
};

interface InsightsViewProps {
  survey: Survey | null;
  profiles: ParticipantProfile[];
}

export const InsightsView: React.FC<InsightsViewProps> = ({ survey, profiles }) => {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<CumulativeInsights | null>(null);
  const [activeTab, setActiveTab] = useState<'charts' | 'ai'>('charts');
  const [initiativeStatus, setInitiativeStatus] = useState<Record<string, boolean>>({});

  const totalRespondents = profiles.length;
  const avgCompleteness = totalRespondents > 0
    ? Math.round(profiles.reduce((sum, p) => sum + p.completeness, 0) / totalRespondents)
    : 0;

  const categoryStats = React.useMemo(() => {
    const counts: Record<string, number> = {
      'Financial Bursary': 0,
      'Upskilling': 0,
      'Activity': 0,
      'Outreach Event': 0,
      'Other': 0
    };
    
    let total = 0;
    profiles.forEach(p => {
      (p.referrals || []).forEach(ref => {
        const cat = ref.category || 'Other';
        counts[cat] = (counts[cat] || 0) + 1;
        total++;
      });
    });

    return { counts, total };
  }, [profiles]);

  const pipelineStats = React.useMemo(() => {
    const counts: Record<string, number> = {
      'Matched': 0,
      'Drafted': 0,
      'Dispatched': 0,
      'Approved': 0,
      'Closed': 0
    };
    
    profiles.forEach(p => {
      (p.referrals || []).forEach(ref => {
        const status = ref.status || 'Matched';
        counts[status] = (counts[status] || 0) + 1;
      });
    });

    return counts;
  }, [profiles]);

  const generateAIInsights = async () => {
    if (!survey || totalRespondents === 0) return;
    setLoading(true);
    try {
      const aiService = createAIService();
      const res = await aiService.generateCumulativeInsights(profiles, survey);
      setInsights(res);
      const initialChecked: Record<string, boolean> = {};
      if (res && res.proactiveInitiatives) {
        res.proactiveInitiatives.forEach(init => {
          initialChecked[init.id] = init.completed;
        });
      }
      setInitiativeStatus(initialChecked);
      setActiveTab('ai');
    } catch (err) {
      console.error("AI Insights compilation failed", err);
      alert("Unable to compile AI trends. Falling back to cached results.");
    } finally {
      setLoading(false);
    }
  };

  const toggleInitiative = (id: string) => {
    setInitiativeStatus(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (totalRespondents === 0) {
    return (
      <div className="p-8 text-center space-y-4 pt-16 font-sans">
        <div className="w-14 h-14 glass-inset rounded-2xl flex items-center justify-center mx-auto text-blue-400">
          <BarChart2 size={28} />
        </div>
        <h3 className="text-white font-bold text-sm uppercase">No Insights Available</h3>
        <p className="text-white/60 text-xs max-w-xs mx-auto">
          Please conduct at least one field interview and save the profile in the **Live Capture** tab to compile cumulative statistics and AI trends.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 pb-32 text-left font-sans animate-in">
      <div>
        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Community Insights</h2>
        <p className="text-xs text-white/50">Aggregate demographics and proactive planning</p>
      </div>

      <div className="flex gap-2 p-1 bg-white/5 border border-white/5 rounded-xl">
        <button 
          onClick={() => setActiveTab('charts')} 
          className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center justify-center gap-1.5 ${activeTab === 'charts' ? 'glass-button text-blue-400' : 'text-white/40'}`}
        >
          <BarChart2 size={12} />
          Dashboard Metrics
        </button>
        <button 
          onClick={() => {
            if (!insights) {
              generateAIInsights();
            } else {
              setActiveTab('ai');
            }
          }} 
          className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center justify-center gap-1.5 ${activeTab === 'ai' ? 'glass-button text-blue-400' : 'text-white/40'}`}
        >
          <Brain size={12} />
          AI Trend Advisor
        </button>
      </div>

      {activeTab === 'charts' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
                <Users size={20} />
              </div>
              <div>
                <span className="text-[9px] font-black uppercase text-white/40 block">Total Interviewed</span>
                <span className="text-lg font-black text-white">{totalRespondents}</span>
              </div>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-400">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <span className="text-[9px] font-black uppercase text-white/40 block">Avg Completeness</span>
                <span className="text-lg font-black text-white">{avgCompleteness}%</span>
              </div>
            </div>
          </div>

          <div className="p-5 bg-white/5 border border-white/10 rounded-[2rem] space-y-4">
            <h3 className="text-xs font-black text-white/60 uppercase tracking-wider flex items-center gap-1">
              <TrendingUp size={12} />
              Prevalence of Needs by Category
            </h3>
            
            <div className="space-y-3 pt-2">
              {Object.entries(categoryStats.counts).map(([category, count]) => {
                const percentage = categoryStats.total > 0
                  ? Math.round((count / categoryStats.total) * 100)
                  : 0;

                const barColor = category === 'Financial Bursary' ? 'bg-red-500' :
                                 category === 'Upskilling' ? 'bg-blue-500' :
                                 category === 'Activity' ? 'bg-green-500' :
                                 category === 'Outreach Event' ? 'bg-purple-500' : 'bg-slate-500';

                return (
                  <div key={category} className="space-y-1">
                    <div className="flex justify-between gap-2 text-[10px] font-bold text-white/80 w-full">
                      <span className="min-w-0 break-words">{category}</span>
                      <span className="text-white/50 flex-shrink-0">{count} match{count === 1 ? '' : 'es'} ({percentage}%)</span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-5 bg-white/5 border border-white/10 rounded-[2rem] space-y-4">
            <h3 className="text-xs font-black text-white/60 uppercase tracking-wider flex items-center gap-1.5">
              <ClipboardList size={12} />
              Referral Status Pipeline
            </h3>
            
            <div className="space-y-4 pt-2">
              <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden flex border border-white/5">
                {Object.entries(pipelineStats).map(([stage, count]) => {
                  const total = Object.values(pipelineStats).reduce((s, c) => s + c, 0);
                  const width = total > 0 ? (count / total) * 100 : 0;
                  if (width === 0) return null;

                  const color = stage === 'Matched' ? 'bg-blue-400' :
                                stage === 'Drafted' ? 'bg-yellow-400' :
                                stage === 'Dispatched' ? 'bg-purple-400' :
                                stage === 'Approved' ? 'bg-green-400' : 'bg-red-400';

                  return (
                    <div 
                      key={stage} 
                      style={{ width: `${width}%` }} 
                      className={`${color} h-full transition-all`}
                      title={`${stage}: ${count}`}
                    />
                  );
                })}
              </div>

              <div className="grid grid-cols-3 gap-y-2 gap-x-1">
                {Object.entries(pipelineStats).map(([stage, count]) => {
                  const colorText = stage === 'Matched' ? 'text-blue-400' :
                                    stage === 'Drafted' ? 'text-yellow-400' :
                                    stage === 'Dispatched' ? 'text-purple-400' :
                                    stage === 'Approved' ? 'text-green-400' : 'text-red-400';

                  const dotColor = stage === 'Matched' ? 'bg-blue-400' :
                                  stage === 'Drafted' ? 'bg-yellow-400' :
                                  stage === 'Dispatched' ? 'bg-purple-400' :
                                  stage === 'Approved' ? 'bg-green-400' : 'bg-red-400';

                  return (
                    <div key={stage} className="flex items-center gap-1.5 text-[9px] font-bold text-white/70">
                      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                      <span className="uppercase">{stage}:</span>
                      <span className={colorText}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <button 
            onClick={generateAIInsights}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles size={14} />
            Run Cumulative AI Trend Advisor
          </button>
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="space-y-6">
          {loading ? (
            <div className="p-12 text-center space-y-4 glass-inset rounded-3xl">
              <Loader2 size={36} className="animate-spin text-blue-400 mx-auto" />
              <div className="space-y-1">
                <p className="text-white text-xs font-black uppercase tracking-wider">AI Trend Analysis Running</p>
                <p className="text-white/50 text-[10px] max-w-xs mx-auto">Evaluating profiles, parsing interviewer notes, and structuring community intervention recommendations...</p>
              </div>
            </div>
          ) : insights ? (
            <div className="space-y-6">
              <div className="p-5 bg-gradient-to-br from-blue-950/40 to-slate-900/40 border border-blue-500/20 rounded-[2rem] space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
                <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Brain size={13} />
                  Executive Trend Analysis
                </h3>
                <p className="text-xs text-white/90 leading-relaxed font-medium">
                  {insights.executiveSummary || "No summary available."}
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-black text-white/50 uppercase tracking-wider pl-1 flex items-center gap-1.5">
                  <ShieldAlert size={12} />
                  Top Community Vulnerabilities
                </h3>
                <div className="space-y-3">
                  {(insights.commonProblems || []).map((prob, i) => {
                    if (!prob) return null;
                    const badgeColor = prob.severity === 'High' ? 'bg-red-500/20 text-red-400 border border-red-500/20' :
                                       prob.severity === 'Medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20' :
                                       'bg-blue-500/20 text-blue-400 border border-blue-500/20';

                    return (
                      <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-white text-xs">{prob.problemName || "Unspecified Problem"}</h4>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${badgeColor}`}>
                            {prob.severity || "Medium"} Priority
                          </span>
                        </div>
                        <p className="text-xs text-white/70 leading-relaxed">{prob.description || ""}</p>
                        
                        <div className="pt-2 flex items-center gap-3">
                          <span className="text-[9px] font-black text-blue-400 uppercase tracking-tight">Prevalence:</span>
                          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${prob.prevalencePercentage || 0}%` }} />
                          </div>
                          <span className="text-[10px] font-black text-white/80">{prob.prevalencePercentage || 0}%</span>
                        </div>
                      </div>
                    );
                  })}
                  {(!insights.commonProblems || insights.commonProblems.length === 0) && (
                    <p className="text-xs text-white/40 italic pl-1">No major vulnerabilities identified yet.</p>
                  )}
                </div>
              </div>

              <div className="p-5 bg-white/5 border border-white/10 rounded-[2rem] space-y-3">
                <h3 className="text-xs font-black text-white/60 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp size={12} />
                  Demographic Correlations
                </h3>
                <ul className="space-y-2 pt-1">
                  {(insights.correlations || []).map((c, idx) => (
                    <li key={idx} className="text-xs text-white/80 leading-relaxed flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span>{c}</span>
                    </li>
                  ))}
                  {(!insights.correlations || insights.correlations.length === 0) && (
                    <li className="text-xs text-white/40 italic list-none">No demographic correlations identified.</li>
                  )}
                </ul>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center pl-1">
                  <h3 className="text-xs font-black text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                    <ClipboardList size={12} />
                    Proactive Action Plan
                  </h3>
                  <span className="text-[9px] text-white/40 uppercase">Click to check off</span>
                </div>
                
                <div className="space-y-3">
                  {(insights.proactiveInitiatives || []).map((init) => {
                    if (!init) return null;
                    const isCompleted = initiativeStatus[init.id] || false;
                    return (
                      <div 
                        key={init.id}
                        onClick={() => toggleInitiative(init.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex gap-3.5 items-start ${isCompleted ? 'bg-green-500/5 border-green-500/20 opacity-70' : 'bg-white/5 border-white/10'}`}
                      >
                        <button className="text-blue-400 mt-0.5">
                          {isCompleted ? <CheckSquare size={16} className="text-green-400" /> : <Square size={16} />}
                        </button>
                        <div className="space-y-1">
                          <h4 className={`font-bold text-xs ${isCompleted ? 'line-through text-white/40' : 'text-white'}`}>{init.title || "Proactive Initiative"}</h4>
                          <p className={`text-[11px] leading-relaxed ${isCompleted ? 'text-white/30' : 'text-white/70'}`}>{init.description || ""}</p>
                        </div>
                      </div>
                    );
                  })}
                  {(!insights.proactiveInitiatives || insights.proactiveInitiatives.length === 0) && (
                    <p className="text-xs text-white/40 italic pl-1">No proactive actions recommended yet.</p>
                  )}
                </div>
              </div>

              <button 
                onClick={generateAIInsights}
                className="w-full py-3 bg-white/5 border border-white/15 text-white/80 hover:bg-white/10 rounded-2xl font-black uppercase text-xs transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                Recalculate AI Trends
              </button>
            </div>
          ) : (
            <div className="p-12 text-center text-white/40 text-xs">
              Click the AI Trend Advisor tab or compile button to generate recommendations.
            </div>
          )}
        </div>
      )}
    </div>
  );
};


/* ==========================================================================
   SECTION 5. CORE APP APPLICATION MAIN LOGIC (App.tsx)
   ========================================================================== */
type Tab = 'home' | 'training' | 'record' | 'profiles' | 'initiatives' | 'schemes' | 'insights';

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [currentSurvey, setCurrentSurvey] = useState<Survey | null>(null);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [surveyFileBuffer, setSurveyFileBuffer] = useState<ArrayBuffer | null>(null);
  const [isDocxTemplate, setIsDocxTemplate] = useState<boolean>(false);
  const [profiles, setProfiles] = useState<ParticipantProfile[]>([]);
  const [initiatives, setInitiatives] = useState<CommunityInitiative[]>(DEFAULT_INITIATIVES);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  const handleLoadDemoData = () => {
    const demoSurvey: Survey = {
      id: 'mock-survey-1',
      name: 'Community Health & Financial Needs Survey',
      questions: [
        { id: 'q1', fieldName: 'name', type: 'string' },
        { id: 'q2', fieldName: 'age', type: 'enum', options: ['Under 30', '30-59', '60 and above'] },
        { id: 'q3', fieldName: 'employment', type: 'enum', options: ['Employed full-time', 'Employed part-time', 'Unemployed', 'Retired'] },
        { id: 'q4', fieldName: 'monthly_income', type: 'enum', options: ['Below $1,500', '$1,500 - $2,999', '$3,000 and above'] },
        { id: 'q5', fieldName: 'financial_assistance', type: 'enum', options: ['Yes', 'No'] },
        { id: 'q6', fieldName: 'health_status', type: 'enum', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
        { id: 'q7', fieldName: 'upskilling_interest', type: 'enum', options: ['Yes', 'No'] },
        { id: 'q8', fieldName: 'social_support', type: 'enum', options: ['Yes', 'No'] }
      ]
    };

    const respondents = [
      {
        name: 'Tan Kok Seng',
        age: '60 and above',
        employment: 'Retired',
        monthly_income: 'Below $1,500',
        financial_assistance: 'No',
        health_status: 'Fair',
        upskilling_interest: 'No',
        social_support: 'No',
        interviewerNotes: 'Elderly gentleman living alone in a 2-room flat. Experiencing mild mobility difficulties and struggles with food preparation. Expressed concern about utility bills.',
        completeness: 100,
        recordingScore: 88,
        matchedRefs: ['init-1', 'init-6', 'init-9']
      },
      {
        name: 'Aishah Binte Abdul',
        age: '30-59',
        employment: 'Unemployed',
        monthly_income: 'Below $1,500',
        financial_assistance: 'No',
        health_status: 'Good',
        upskilling_interest: 'Yes',
        social_support: 'Yes',
        interviewerNotes: 'Mother of three young children. Currently unemployed but eager to undergo career transition and upskilling once childcare subsidies are sorted.',
        completeness: 100,
        recordingScore: 92,
        matchedRefs: ['init-2', 'init-7']
      },
      {
        name: 'Ramasamy s/o Muthu',
        age: '60 and above',
        employment: 'Retired',
        monthly_income: 'Below $1,500',
        financial_assistance: 'Yes',
        health_status: 'Poor',
        upskilling_interest: 'No',
        social_support: 'No',
        interviewerNotes: 'Chronic diabetes patient. High medical expenses and no active income source. Needs regular transport help to the clinic.',
        completeness: 100,
        recordingScore: 78,
        matchedRefs: ['init-8', 'init-11']
      },
      {
        name: 'Lim Wei Ting',
        age: 'Under 30',
        employment: 'Employed part-time',
        monthly_income: '$1,500 - $2,999',
        financial_assistance: 'No',
        health_status: 'Excellent',
        upskilling_interest: 'Yes',
        social_support: 'Yes',
        interviewerNotes: 'Part-time retail worker looking to acquire digital skills to secure a stable corporate job.',
        completeness: 100,
        recordingScore: 95,
        matchedRefs: ['init-2', 'init-10']
      },
      {
        name: 'Sarah Tan',
        age: '30-59',
        employment: 'Employed full-time',
        monthly_income: '$3,000 and above',
        financial_assistance: 'No',
        health_status: 'Good',
        upskilling_interest: 'No',
        social_support: 'Yes',
        interviewerNotes: 'Doing relatively well but interested in senior activities for her elderly mother living with her.',
        completeness: 100,
        recordingScore: 85,
        matchedRefs: ['init-4', 'init-9']
      },
      {
        name: 'Mohamed Syazwan',
        age: 'Under 30',
        employment: 'Unemployed',
        monthly_income: 'Below $1,500',
        financial_assistance: 'No',
        health_status: 'Good',
        upskilling_interest: 'Yes',
        social_support: 'No',
        interviewerNotes: 'Fresh graduate currently looking for work. Needs professional mentoring and job navigation assistance.',
        completeness: 100,
        recordingScore: 90,
        matchedRefs: ['init-2', 'init-5']
      }
    ];

    const demoProfiles: ParticipantProfile[] = respondents.map((r, index) => {
      const responses = {
        name: r.name,
        age: r.age,
        employment: r.employment,
        monthly_income: r.monthly_income,
        financial_assistance: r.financial_assistance,
        health_status: r.health_status,
        upskilling_interest: r.upskilling_interest,
        social_support: r.social_support
      };

      const referrals: ReferralRecommendation[] = r.matchedRefs.map(initId => {
        const init = initiatives.find(i => i.id === initId);
        return {
          initiativeId: initId,
          initiativeTitle: init?.title || 'Community Program',
          category: init?.category || 'Other',
          matchReason: `Matched based on participant indicating household income of ${r.monthly_income} and health/employment status as ${r.employment}.`,
          priority: 'High' as const,
          selected: true,
          followedUp: false,
          status: 'Matched' as const
        };
      });

      const analysis: RecordingAnalysis = {
        score: r.recordingScore,
        answeredQuestions: ['name', 'age', 'employment', 'monthly_income', 'financial_assistance', 'health_status', 'upskilling_interest', 'social_support'],
        unansweredQuestions: [],
        unclearQuestions: [],
        extractedResponses: responses,
        improvementAnalysis: {
          strengths: ['Clear answers provided', 'Addressed all checklist items', 'Interviewer notes align with data'],
          weaknesses: ['None observed'],
          actionableTips: ['Continue standard outreach protocols']
        },
        needsAndWants: [r.interviewerNotes],
        detailedFeedback: [
          { category: 'Completeness', score: 100, feedback: 'All critical details captured.' },
          { category: 'Engagement', score: 90, feedback: 'Clear responses with high conversational engagement.' }
        ]
      };

      return {
        id: `mock-profile-${index}-${Date.now()}`,
        surveyId: demoSurvey.id,
        timestamp: Date.now() - (index * 3600000 * 4),
        responses,
        textSummary: `Participant: ${r.name}, age ${r.age}. Monthly income is ${r.monthly_income}. Health is ${r.health_status}. Interviewer Notes: ${r.interviewerNotes}`,
        completeness: r.completeness,
        analysis,
        referrals,
        dispatchedEmails: [],
        interviewerNotes: r.interviewerNotes
      };
    });

    setCurrentSurvey(demoSurvey);
    setSurveys(prev => {
      if (prev.some(s => s.id === demoSurvey.id)) return prev;
      return [...prev, demoSurvey];
    });
    setProfiles(demoProfiles);
    setActiveTab('insights');
  };

  const handleSurveyUploaded = async (survey: Survey, fileBuffer?: ArrayBuffer, fileName?: string) => {
    setCurrentSurvey(survey);
    setSurveys(prev => {
      if (prev.some(s => s.id === survey.id || s.name === survey.name)) return prev;
      return [...prev, survey];
    });
    if (fileBuffer) {
      setSurveyFileBuffer(fileBuffer);
      setIsDocxTemplate(fileName?.split('.').pop()?.toLowerCase() === 'docx');
    } else {
      setSurveyFileBuffer(null);
      setIsDocxTemplate(false);
    }
    setActiveTab('training');
  };

  const handleSaveProfile = async (responses: Record<string, string>, analysis?: RecordingAnalysis, interviewerNotes?: string) => {
    const questions = currentSurvey?.questions || [];
    const answeredCount = questions.filter(q => responses[q.fieldName]?.trim()).length;
    const completeness = Math.round((answeredCount / (questions.length || 1)) * 100);

    const profileId = `profile-${Date.now()}`;
    const p: ParticipantProfile = {
      id: profileId,
      surveyId: currentSurvey?.id || '',
      timestamp: Date.now(),
      responses,
      completeness,
      analysis,
      interviewerNotes,
      referrals: undefined
    };

    setProfiles(prev => [p, ...prev]);
    setActiveTab('profiles');

    try {
      const aiService = createAIService();
      const matched = await aiService.matchReferrals(responses, initiatives, interviewerNotes);
      const refs = (matched || []).map(m => ({ ...m, selected: false, followedUp: false, status: 'Matched' as const }));
      setProfiles(prev => prev.map(prof => prof.id === profileId ? { ...p, referrals: refs, dispatchedEmails: [] } : prof));
    } catch {
      setProfiles(prev => prev.map(prof => prof.id === profileId ? { ...p, referrals: [], dispatchedEmails: [] } : prof));
    }
  };

  const tabs = [
    { id: 'home' as Tab, label: 'Import', icon: Upload },
    { id: 'training' as Tab, label: 'Training Lab', icon: Zap, disabled: !currentSurvey },
    { id: 'record' as Tab, label: 'Live Capture', icon: Mic, disabled: !currentSurvey },
    { id: 'profiles' as Tab, label: 'Profiles', icon: Users },
    { id: 'insights' as Tab, label: 'Insights', icon: BarChart2, disabled: !currentSurvey },
    { id: 'initiatives' as Tab, label: 'Outreach', icon: Sparkles },
    { id: 'schemes' as Tab, label: 'Schemes', icon: Database },
  ];

  return (
    <div className={`h-screen h-[100dvh] glass-bg flex flex-col items-center overflow-hidden font-sans ${theme === 'light' ? 'light-theme' : ''}`}>
      <div className="w-full max-w-md h-full flex flex-col relative overflow-hidden glass-container">
        <header className="glass-header p-6 flex-shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-tighter uppercase flex-shrink-0" title="Conversational Assessment & Routing Engine for Outreach">CARE-O</h1>
              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="p-1.5 rounded-xl glass-button text-white hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              >
                {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
              </button>
            </div>
            {currentSurvey && (
              <div className="glass-inset px-3 py-1 rounded-full max-w-[50%] truncate" title={`Active: ${currentSurvey.name}`}>
                <span className="text-[9px] font-black text-green-400 uppercase tracking-tighter block truncate">Active: {currentSurvey.name}</span>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-32">
          {activeTab === 'home' && (
            <HomeView 
              onSurveyUpload={handleSurveyUploaded} 
              surveys={surveys}
              currentSurvey={currentSurvey}
              onSelectSurvey={(s) => { setCurrentSurvey(s); setActiveTab('training'); }}
              onLoadDemoData={handleLoadDemoData}
            />
          )}
          {activeTab === 'training' && currentSurvey && <CoachingView survey={currentSurvey} />}
          {activeTab === 'record' && currentSurvey && <RecordingView survey={currentSurvey} onSaveProfile={handleSaveProfile} />}
          {activeTab === 'profiles' && <ProfilesView profiles={profiles} survey={currentSurvey || { id: '', name: '', questions: [] }} surveyFileBuffer={surveyFileBuffer} isDocxTemplate={isDocxTemplate} initiatives={initiatives} onUpdateProfile={u => setProfiles(prev => prev.map(p => p.id === u.id ? u : p))} onSelectProfile={id => { setSelectedProfileId(id); setActiveTab('initiatives'); }} />}
          {activeTab === 'initiatives' && (
            <InitiativesView 
              survey={currentSurvey} 
              profiles={profiles}
              selectedProfileId={selectedProfileId}
              onUpdateProfile={u => setProfiles(prev => prev.map(p => p.id === u.id ? u : p))}
              onClearSelection={() => { setSelectedProfileId(null); setActiveTab('profiles'); }}
              initiatives={initiatives}
            />
          )}
          {activeTab === 'insights' && <InsightsView survey={currentSurvey} profiles={profiles} />}
          {activeTab === 'schemes' && <SchemesView initiatives={initiatives} setInitiatives={setInitiatives} />}
        </main>

        <nav className="absolute bottom-8 left-4 right-4 glass-nav rounded-3xl p-1.5 flex items-center justify-between gap-1 z-50">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isDisabled = tab.disabled;
            return (
              <button
                key={tab.id}
                onClick={() => !isDisabled && setActiveTab(tab.id)}
                disabled={isDisabled}
                className={`flex-1 flex flex-col items-center gap-1 py-1 px-0.5 rounded-xl transition-all ${isActive
                    ? 'bg-blue-500/30 text-white scale-105 shadow-md shadow-blue-500/25 backdrop-blur-sm'
                    : isDisabled
                      ? 'text-white/30 opacity-30 cursor-not-allowed'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
              >
                <Icon size={14} />
                <span className="text-[6.5px] font-black uppercase tracking-tight text-center">{tab.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export default App;