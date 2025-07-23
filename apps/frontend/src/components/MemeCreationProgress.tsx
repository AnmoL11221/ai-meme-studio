import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { MemeCreationStatus, MemeCreationStep } from '@ai-meme-studio/shared-types';

interface MemeCreationProgressProps {
  status: MemeCreationStatus;
  currentStep: MemeCreationStep;
  character?: string;
  finalMeme?: string;
  captions?: string[];
  error?: string;
}

export function MemeCreationProgress({
  status,
  currentStep,
  character,
  finalMeme,
  captions,
  error
}: MemeCreationProgressProps) {
  const steps = [
    {
      id: MemeCreationStep.SET_DESIGN,
      name: 'Set Designer',
      description: 'Creating background scene',
      status: MemeCreationStatus.GENERATING_BACKGROUND
    },
    {
      id: MemeCreationStep.CASTING,
      name: 'Casting Director', 
      description: 'Adding main character',
      status: MemeCreationStatus.GENERATING_CHARACTER
    },
    {
      id: MemeCreationStep.FINAL_COMPOSITION,
      name: 'Image Composition',
      description: 'Combining elements',
      status: MemeCreationStatus.COMPOSITING
    },
    {
      id: MemeCreationStep.GAG_WRITING,
      name: 'Gag Writer',
      description: 'Writing clever captions',
      status: MemeCreationStatus.GENERATING_CAPTIONS
    }
  ];

  const getStepState = (step: typeof steps[0]) => {
    if (status === MemeCreationStatus.FAILED) return 'failed';
    if (currentStep > step.id) return 'completed';
    if (currentStep === step.id && status === step.status) return 'active';
    return 'pending';
  };

  const StepIcon = ({ state }: { state: string }) => {
    switch (state) {
      case 'completed':
        return <CheckCircle className="h-6 w-6 text-green-400" />;
      case 'active':
        return <Clock className="h-6 w-6 text-blue-400 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-6 w-6 text-red-400" />;
      default:
        return <div className="h-6 w-6 rounded-full border-2 border-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {steps.map((step, index) => {
          const state = getStepState(step);
          return (
            <div key={step.id} className="flex items-center space-x-4">
              <StepIcon state={state} />
              <div className="flex-1">
                <h3 className={`font-semibold ${
                  state === 'active' ? 'text-blue-400' : 
                  state === 'completed' ? 'text-green-400' :
                  state === 'failed' ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {step.name}
                </h3>
                <p className="text-gray-300 text-sm">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-px h-8 ${
                  state === 'completed' ? 'bg-green-400' : 'bg-gray-600'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
          <h4 className="text-red-400 font-semibold mb-2">Error occurred</h4>
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">


        {character && (
          <div className="space-y-2">
            <h4 className="text-white font-semibold">Character</h4>
            <img 
              src={character} 
              alt="Generated character" 
              className="w-full rounded-lg border border-white/20"
            />
          </div>
        )}
      </div>

      {finalMeme && (
        <div className="space-y-2">
          <h4 className="text-white font-semibold">Final Meme</h4>
          <img 
            src={finalMeme} 
            alt="Final meme" 
            className="w-full max-w-md mx-auto rounded-lg border border-white/20"
          />
        </div>
      )}

      {captions && captions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-white font-semibold">Caption Options</h4>
          <div className="space-y-2">
            {captions.map((caption, index) => (
              <div 
                key={index}
                className="bg-white/10 rounded-lg p-3 text-white text-center font-bold"
              >
                {caption}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 