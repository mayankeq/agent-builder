import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ArrowRight, ArrowLeft, Bot, Key, Sparkles, Download } from 'lucide-react';
import { Modal } from './Modal';
import { useUiStore } from '@/store/uiStore';

export const WelcomeTutorial: React.FC = () => {
  const navigate = useNavigate();
  const { showWelcomeTutorial, setShowWelcomeTutorial } = useUiStore();
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: 'Welcome to Agent Builder!',
      icon: <Bot className="w-12 h-12 text-primary-600" />,
      description:
        'Create intelligent LLM-based agents with ease. This tutorial will guide you through the key features.',
    },
    {
      title: 'Configure Your API Key',
      icon: <Key className="w-12 h-12 text-primary-600" />,
      description:
        'First, you need to add your Anthropic API key. Go to Settings to securely store your API key. It will be encrypted and used to power your agents.',
      action: {
        label: 'Go to Settings',
        onClick: () => {
          setShowWelcomeTutorial(false);
          navigate('/settings');
        },
      },
    },
    {
      title: 'Create Your First Agent',
      icon: <Sparkles className="w-12 h-12 text-primary-600" />,
      description:
        'Describe what you want your agent to do, choose the output type (Skill, MCP Server, CLI, or Library), and select your preferred language. We support TypeScript and Python.',
      action: {
        label: 'Create Agent',
        onClick: () => {
          setShowWelcomeTutorial(false);
          navigate('/create');
        },
      },
    },
    {
      title: 'Monitor Progress',
      icon: <Download className="w-12 h-12 text-primary-600" />,
      description:
        'Watch your agent being created in real-time. The system goes through multiple phases: Clarification, Design, Implementation, and Packaging. Once complete, download your agent as a ZIP file.',
    },
  ];

  const handleClose = () => {
    setShowWelcomeTutorial(false);
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const currentStep = steps[step];

  return (
    <Modal isOpen={showWelcomeTutorial} onClose={handleClose} size="lg" showCloseButton={false}>
      <div className="text-center">
        {/* Icon */}
        <div className="flex justify-center mb-4">{currentStep.icon}</div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-secondary-900 mb-4">{currentStep.title}</h2>

        {/* Description */}
        <p className="text-secondary-600 mb-8">{currentStep.description}</p>

        {/* Progress Dots */}
        <div className="flex justify-center space-x-2 mb-8">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === step ? 'bg-primary-600' : 'bg-secondary-300'
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleBack}
            disabled={step === 0}
            className="btn-ghost disabled:opacity-0"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>

          <div className="flex space-x-2">
            <button onClick={handleClose} className="btn-secondary">
              Skip
            </button>

            {currentStep.action ? (
              <button onClick={currentStep.action.onClick} className="btn-primary">
                {currentStep.action.label}
              </button>
            ) : (
              <button onClick={handleNext} className="btn-primary">
                {step === steps.length - 1 ? (
                  'Get Started'
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Skip All */}
        <div className="mt-6 pt-6 border-t border-secondary-200">
          <button
            onClick={() => {
              setShowWelcomeTutorial(false);
            }}
            className="text-sm text-secondary-600 hover:text-secondary-900"
          >
            Don't show this again
          </button>
        </div>
      </div>
    </Modal>
  );
};
