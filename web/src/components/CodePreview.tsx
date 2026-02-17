import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';

interface CodePreviewProps {
  code: string;
  language: string;
  filename?: string;
  showLineNumbers?: boolean;
}

export const CodePreview: React.FC<CodePreviewProps> = ({
  code,
  language,
  filename,
  showLineNumbers = true,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-secondary-300 rounded-lg overflow-hidden">
      {filename && (
        <div className="bg-secondary-100 px-4 py-2 border-b border-secondary-300 flex items-center justify-between">
          <span className="text-sm font-medium text-secondary-700">{filename}</span>
          <button
            onClick={handleCopy}
            className="btn-ghost btn-sm"
            title="Copy code"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      )}
      <div className="relative">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          showLineNumbers={showLineNumbers}
          customStyle={{
            margin: 0,
            borderRadius: 0,
            fontSize: '0.875rem',
            maxHeight: '600px',
          }}
        >
          {code}
        </SyntaxHighlighter>
        {!filename && (
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 btn-ghost btn-sm bg-secondary-800 hover:bg-secondary-700"
            title="Copy code"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-white" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};
