
export interface ColorData {
    hex: string;
    name: string;
    confidence: number;
}

export interface VibeData {
    primary: string;
    secondary: string;
    confidence: number;
}

export interface TypographyData {
    isSerif: boolean;
    detectedFontName: string;
    confidence: number;
}

export interface VisualExtraction {
    brandColors: ColorData[];
    aestheticScore: number;
    vibe: VibeData;
    typography: TypographyData;
    detectedText?: string; // Raw OCR
}

export interface ExtractionMeta {
    confidence: number;
    id: string;
    modelUsed: 'gemini' | 'groq' | 'kie';
    triggerReason?: string[]; // Why was manual verification triggered?
}

export interface ExtractionData {
    meta: ExtractionMeta;
    data: {
        visual: VisualExtraction;
    };
}

export type PipelineState =
    | 'extracting'
    | 'validating'
    | 'brand-safety-precheck'
    | 'manual-verification'
    | 'generating'
    | 'streaming'
    | 'final-safety-check'
    | 'complete';
