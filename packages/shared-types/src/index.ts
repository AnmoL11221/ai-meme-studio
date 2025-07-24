export interface MemeRequest {
  id: string;
  concept: string;
  userId?: string;
  timestamp: Date;
}

export interface MemeCreationState {
  id: string;
  concept?: string;
  templateId?: string;
  topText?: string;
  bottomText?: string;
  customText?: string;
  status: MemeCreationStatus;
  currentStep: MemeCreationStep;
  template?: MemeTemplate;
  character?: GeneratedImage;
  finalMeme?: GeneratedImage;
  captions?: string[];
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum MemeCreationStatus {
  PENDING = 'pending',
  GENERATING_BACKGROUND = 'generating_background',
  GENERATING_CHARACTER = 'generating_character',
  COMPOSITING = 'compositing',
  GENERATING_CAPTIONS = 'generating_captions',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum MemeCreationStep {
  SET_DESIGN = 1,
  CASTING = 2,
  GAG_WRITING = 3,
  FINAL_COMPOSITION = 4,
  COMPLETED = 5
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  model: string;
  width: number;
  height: number;
  generatedAt: Date;
}

export interface AIAgent {
  name: string;
  role: AgentRole;
  execute(input: any): Promise<any>;
}

export enum AgentRole {
  SET_DESIGNER = 'set_designer',
  CASTING_DIRECTOR = 'casting_director',
  GAG_WRITER = 'gag_writer'
}

export interface SetDesignerInput {
  concept: string;
}

export interface SetDesignerOutput {
  backgroundImage: GeneratedImage;
  sceneDescription: string;
}

export interface CastingDirectorInput {
  concept: string;
  background: GeneratedImage;
}

export interface CastingDirectorOutput {
  characterImage: GeneratedImage;
  compositedImage: GeneratedImage;
  characterDescription: string;
}

export interface GagWriterInput {
  concept: string;
  finalImage: GeneratedImage;
}

export interface GagWriterOutput {
  captions: string[];
  explanation: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface CreateMemeResponse extends APIResponse<MemeCreationState> {}
export interface GetMemeStatusResponse extends APIResponse<MemeCreationState> {}

export interface MemeProgressEvent {
  type: 'progress';
  memeId: string;
  status: MemeCreationStatus;
  step: MemeCreationStep;
  data?: Partial<MemeCreationState>;
}

export interface MemeErrorEvent {
  type: 'error';
  memeId: string;
  error: string;
}

export interface MemeCompletedEvent {
  type: 'completed';
  memeId: string;
  finalMeme: MemeCreationState;
}

export type WebSocketEvent = MemeProgressEvent | MemeErrorEvent | MemeCompletedEvent;

export interface MemeTemplate {
  id: string;
  name: string;
  imageUrl: string;
  topTextPosition: { x: number; y: number; width: number; height: number };
  bottomTextPosition: { x: number; y: number; width: number; height: number };
  category: string;
  tags: string[];
  popularity: number;
}

export interface MemeCreationInput {
  concept?: string;
  templateId?: string;
  topText?: string;
  bottomText?: string;
  customText?: string;
} 