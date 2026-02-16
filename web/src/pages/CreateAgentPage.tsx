import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { useSessions, useExamples, useApiKeys } from '@/hooks';
import { Loading, Modal } from '@/components';
import { CreateAgentRequest, OutputType, Language } from '@/types';
import {
  OUTPUT_TYPE_LABELS,
  OUTPUT_TYPE_DESCRIPTIONS,
  LANGUAGE_LABELS,
  PRIORITY_LABELS,
  PRIORITY_DESCRIPTIONS,
} from '@/utils';

const createAgentSchema = z.object({
  description: z.string().min(10, 'Description must be at least 10 characters'),
  outputType: z.enum(['skill', 'mcp', 'cli', 'library']),
  language: z.enum(['typescript', 'python']),
  priority: z.enum(['speed', 'quality', 'trust', 'budget']).optional(),
  testCoverage: z.number().min(0).max(100).optional(),
});

type CreateAgentForm = z.infer<typeof createAgentSchema>;

export const CreateAgentPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [showExamples, setShowExamples] = useState(false);

  const { createSession, isCreating } = useSessions();
  const { data: examples, isLoading: examplesLoading } = useExamples();
  const { status: apiKeyStatus } = useApiKeys();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateAgentForm>({
    resolver: zodResolver(createAgentSchema),
    defaultValues: {
      outputType: 'mcp',
      language: 'typescript',
      priority: 'quality',
      testCoverage: 80,
    },
  });

  const outputType = watch('outputType');
  const language = watch('language');

  const onSubmit = (data: CreateAgentForm) => {
    const request: CreateAgentRequest = {
      description: data.description,
      outputType: data.outputType,
      language: data.language,
      options: {
        priority: data.priority,
        testCoverage: data.testCoverage,
      },
    };

    createSession(request, {
      onSuccess: (response) => {
        navigate(`/sessions/${response.sessionId}`);
      },
    });
  };

  const handleExampleSelect = (exampleId: string) => {
    const example = examples?.find((e) => e.id === exampleId);
    if (example) {
      setValue('description', example.prompt);
      setValue('outputType', example.outputType);
      setValue('language', example.language);
      setShowExamples(false);
    }
  };

  const totalSteps = 3;

  // Check if API key is configured
  const hasApiKey = apiKeyStatus?.hasKey && apiKeyStatus?.isValid;

  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full card text-center">
          <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-secondary-900 mb-2">
            API Key Required
          </h2>
          <p className="text-secondary-600 mb-6">
            You need to configure your Anthropic API key before creating agents.
          </p>
          <button onClick={() => navigate('/settings')} className="btn-primary">
            Go to Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <div className="bg-white border-b border-secondary-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-ghost mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-secondary-900">Create Agent</h1>
              <p className="text-secondary-600 mt-1">
                Step {step} of {totalSteps}
              </p>
            </div>
            <button
              onClick={() => setShowExamples(true)}
              className="btn-secondary"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              View Examples
            </button>
          </div>

          {/* Progress */}
          <div className="flex items-center space-x-2 mt-6">
            {[...Array(totalSteps)].map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-2 rounded-full transition-colors ${
                  i + 1 <= step ? 'bg-primary-600' : 'bg-secondary-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="card">
          {/* Step 1: Description */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-secondary-900 mb-4">
                  Describe your agent
                </h2>
                <p className="text-secondary-600 mb-6">
                  Provide a detailed description of what you want your agent to do.
                </p>
              </div>

              <div>
                <label className="label">
                  Agent Description *
                </label>
                <textarea
                  {...register('description')}
                  rows={6}
                  className="input resize-none"
                  placeholder="Example: A web scraper that extracts product prices from e-commerce websites and stores them in a database..."
                />
                {errors.description && (
                  <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn-primary"
                  disabled={!watch('description')}
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Output Type & Language */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-secondary-900 mb-4">
                  Choose output type and language
                </h2>
              </div>

              <div>
                <label className="label">Output Type *</label>
                <div className="grid grid-cols-2 gap-4">
                  {(['skill', 'mcp', 'cli', 'library'] as OutputType[]).map((type) => (
                    <label
                      key={type}
                      className={`cursor-pointer border-2 rounded-lg p-4 transition-colors ${
                        outputType === type
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-secondary-300 hover:border-secondary-400'
                      }`}
                    >
                      <input
                        type="radio"
                        {...register('outputType')}
                        value={type}
                        className="sr-only"
                      />
                      <div className="font-medium text-secondary-900 mb-1">
                        {OUTPUT_TYPE_LABELS[type]}
                      </div>
                      <div className="text-sm text-secondary-600">
                        {OUTPUT_TYPE_DESCRIPTIONS[type]}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Language *</label>
                <div className="grid grid-cols-2 gap-4">
                  {(['typescript', 'python'] as Language[]).map((lang) => (
                    <label
                      key={lang}
                      className={`cursor-pointer border-2 rounded-lg p-4 transition-colors ${
                        language === lang
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-secondary-300 hover:border-secondary-400'
                      }`}
                    >
                      <input
                        type="radio"
                        {...register('language')}
                        value={lang}
                        className="sr-only"
                      />
                      <div className="font-medium text-secondary-900">
                        {LANGUAGE_LABELS[lang]}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-secondary"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="btn-primary"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Advanced Options */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-secondary-900 mb-4">
                  Advanced options
                </h2>
                <p className="text-secondary-600 mb-6">
                  Customize the agent creation process (optional).
                </p>
              </div>

              <div>
                <label className="label">Priority</label>
                <select {...register('priority')} className="input">
                  {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label} - {PRIORITY_DESCRIPTIONS[key as keyof typeof PRIORITY_DESCRIPTIONS]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">
                  Test Coverage: {watch('testCoverage')}%
                </label>
                <input
                  type="range"
                  {...register('testCoverage', { valueAsNumber: true })}
                  min="0"
                  max="100"
                  step="10"
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-secondary-600 mt-1">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn-secondary"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="btn-primary"
                >
                  {isCreating ? (
                    <>
                      <Loading />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Create Agent
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Examples Modal */}
      <Modal
        isOpen={showExamples}
        onClose={() => setShowExamples(false)}
        title="Example Templates"
        size="xl"
      >
        {examplesLoading ? (
          <Loading text="Loading examples..." />
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {examples?.map((example) => (
              <button
                key={example.id}
                onClick={() => handleExampleSelect(example.id)}
                className="w-full text-left border border-secondary-300 rounded-lg p-4 hover:border-primary-500 hover:bg-primary-50 transition-colors"
              >
                <h3 className="font-semibold text-secondary-900 mb-1">
                  {example.title}
                </h3>
                <p className="text-sm text-secondary-600 mb-2">
                  {example.description}
                </p>
                <div className="flex items-center space-x-2 text-xs text-secondary-500">
                  <span className="badge-info">{OUTPUT_TYPE_LABELS[example.outputType]}</span>
                  <span className="badge-info">{LANGUAGE_LABELS[example.language]}</span>
                  <span className="badge-info">{example.category}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};
