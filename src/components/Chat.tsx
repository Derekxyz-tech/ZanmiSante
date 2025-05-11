'use client';

import { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, ClipboardIcon, CheckIcon } from '@heroicons/react/24/solid';
import { Message, generateResponse } from '@/utils/chat';
import { cn } from '@/utils/cn';

function cleanAsterisks(text: string) {
  // Remove trailing asterisks at the end of lines or after colons
  return text.replace(/([:：])\*/g, '$1').replace(/\*+$/gm, '');
}

function formatMessage(text: string) {
  text = cleanAsterisks(text);
  return text
    .split('\n')
    .map((line, i) => {
      // Format bold text
      let formattedLine = line.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
      // Format italic text
      formattedLine = formattedLine.replace(/_(.*?)_/g, '<em>$1</em>');
      // Format code blocks
      formattedLine = formattedLine.replace(/`(.*?)`/g, '<code>$1</code>');
      return formattedLine;
    })
    .join('<br />');
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await generateResponse([...messages, userMessage]);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (content: string, index: number) => {
    navigator.clipboard.writeText(content.replace(/<br\s*\/>/gi, '\n').replace(/<[^>]+>/g, ''));
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <div className="flex flex-col max-h-[70vh] min-h-[400px] bg-white/90 dark:bg-gray-900/80 rounded-2xl shadow-lg mx-auto mt-2 mb-8 w-full">
      <div className="flex-1 overflow-y-auto px-2 sm:px-6 py-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-emerald-600 dark:text-emerald-300">
            <div className="w-14 h-14 mb-3 text-emerald-400 dark:text-emerald-300">
              <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M24 44 Q29 29 44 24 Q29 19 24 4 Q19 19 4 24 Q19 29 24 44Z" fill="currentColor" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-1">Welcome to ZanmiSanté</h2>
            <p className="max-w-md text-base">
              Votre compagnon intelligent pour votre bien-être personnel!
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                'flex w-full',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[85%] w-full sm:w-auto rounded-2xl px-4 py-3 mb-2 relative',
                  message.role === 'user'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-100 shadow-sm'
                )}
              >
                <div 
                  className="prose prose-sm dark:prose-invert max-w-none prose-emerald break-words"
                  dangerouslySetInnerHTML={{ 
                    __html: formatMessage(message.content)
                  }}
                />
                {message.role === 'assistant' && (
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => handleCopy(message.content, index)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-100 dark:bg-emerald-800 hover:bg-emerald-200 dark:hover:bg-emerald-700 transition-colors text-emerald-700 dark:text-emerald-200 text-sm font-medium shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      title="Copy answer"
                    >
                      {copiedIndex === index ? (
                        <>
                          <CheckIcon className="h-5 w-5" /> Copied!
                        </>
                      ) : (
                        <>
                          <ClipboardIcon className="h-5 w-5" /> Copy
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-emerald-400 dark:bg-emerald-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-emerald-400 dark:bg-emerald-500 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-emerald-400 dark:bg-emerald-500 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-2 sm:px-4 pb-4 w-full">
        <form onSubmit={handleSubmit} className="flex gap-2 items-end bg-emerald-100 dark:bg-emerald-950/40 rounded-xl shadow-inner p-2 w-full">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Ask about health and wellness..."
            className="flex-1 resize-none rounded-lg border-none bg-transparent p-3 focus:outline-none focus:ring-2 focus:ring-emerald-400 min-h-[44px] max-h-[120px] text-gray-900 dark:text-gray-100 text-base"
            disabled={isLoading}
            rows={1}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={cn(
              'p-3 rounded-lg bg-emerald-600 text-white',
              'hover:bg-emerald-700 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'flex items-center justify-center shadow-md'
            )}
            aria-label="Send"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
} 