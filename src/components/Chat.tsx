'use client';

import { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, ClipboardIcon, CheckIcon } from '@heroicons/react/24/solid';
import { Message, generateResponse } from '@/utils/chat';
import { cn } from '@/utils/cn';
import Image from 'next/image';

interface ChatProps {
  messages?: Message[];
  onSendMessage?: (msg: Message) => Promise<void> | void;
  activeChat?: {
    id: string;
    title: string;
  } | null;
}

function cleanAsterisks(text: string) {
  // Remove trailing asterisks at the end of lines or after colons
  return text.replace(/([:：])\*/g, '$1').replace(/\*+$/gm, '');
}

function formatMessage(text: string) {
  text = cleanAsterisks(text);
  return text
    .split('\n')
    .map((line) => {
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

export default function Chat({ messages = [], onSendMessage, activeChat }: ChatProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [typingMessage, setTypingMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingMessage]);

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
    if (onSendMessage) await onSendMessage(userMessage);
    setInput('');
    setIsLoading(true);

    try {
      const response = await generateResponse([...messages, userMessage]);
      // Typing effect
      let current = '';
      setTypingMessage('');
      for (let i = 0; i < response.length; i++) {
        current += response[i];
        setTypingMessage(current);
        await new Promise((res) => setTimeout(res, 8)); // Fast typing
      }
      setTypingMessage(null);
      const assistantMessage: Message = { role: 'assistant', content: response };
      if (onSendMessage) await onSendMessage(assistantMessage);
    } catch (error) {
      console.error('Error:', error);
      setTypingMessage(null);
      const assistantMessage: Message = { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' };
      if (onSendMessage) await onSendMessage(assistantMessage);
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
    <div className="relative flex flex-col h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-lg mx-auto w-full">
      <div className="flex-1 overflow-y-auto py-6 px-4 pb-32 space-y-6 scrollbar-hide scrollbar-hover">
        {messages.length === 0 && !typingMessage ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-black">
            <div className="w-20 h-20 mb-3 flex items-center justify-center overflow-visible">
              <Image 
                src="/Untitled_design-removebg-preview.png" 
                alt="ZanmiSanté Logo" 
                width={80} 
                height={80} 
                className="object-contain scale-150" 
              />
            </div>
            <h2 className="text-xl font-semibold mb-1">Welcome to ZanmiSanté</h2>
            <p className="max-w-md text-base">
              {activeChat ? `Chat: ${activeChat.title}` : 'Votre compagnon intelligent pour votre bien-être personnel!'}
            </p>
          </div>
        ) :
          <>
            {messages.map((message, index) => (
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
                      : 'bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 shadow-sm'
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
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 transition-colors text-white text-sm font-medium shadow-md focus:outline-none focus:ring-2 focus:ring-green-400"
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
            ))}
            {typingMessage && (
              <div className="flex w-full justify-start">
                <div className="max-w-[85%] w-full sm:w-auto rounded-2xl px-4 py-3 mb-2 relative bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 shadow-sm">
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none prose-emerald break-words"
                    dangerouslySetInnerHTML={{
                      __html: formatMessage(typingMessage)
                    }}
                  />
                </div>
              </div>
            )}
          </>
        }
        {isLoading && !typingMessage && (
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

      <div className="absolute left-0 bottom-0 w-full px-2 sm:px-4 mb-4 bg-white">
        <form onSubmit={handleSubmit} className="flex gap-2 items-end bg-emerald-100/60 dark:bg-emerald-950/30 rounded-2xl shadow-inner p-2 w-full">
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
            className="flex-1 resize-none rounded-lg border border-black bg-transparent p-3 focus:outline-none focus:ring-2 focus:ring-emerald-400 min-h-[44px] max-h-[120px] text-black text-base overflow-hidden"
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
              'flex items-center justify-center shadow-md',
              'cursor-pointer'
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