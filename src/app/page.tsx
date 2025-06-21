'use client';

import Chat from '@/components/Chat';
import { useState, useEffect } from 'react';
import { Bars3Icon, ArrowRightOnRectangleIcon, UserPlusIcon, PlusIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/utils/supabaseClient';

// Types for chat and message data
interface Chat {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
}

interface Message {
  id?: string;
  chat_id?: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user } = useUser();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatsLoaded, setChatsLoaded] = useState(false);

  // Track if a new chat should be created on login
  useEffect(() => {
    if (user && chatsLoaded) {
      if (!localStorage.getItem('zanmisante_session')) {
        if (chats.length > 0) {
          // Check if the most recent chat is empty
          const checkLastChatEmpty = async () => {
            const lastChat = chats[0];
            const { data: lastChatMessages } = await supabase
              .from('messages')
              .select('id')
              .eq('chat_id', lastChat.id)
              .limit(1);
            if (lastChatMessages && lastChatMessages.length > 0) {
              handleNewChat();
            }
          };
          checkLastChatEmpty();
        } else {
          // No chats, do not create a new one
        }
        localStorage.setItem('zanmisante_session', 'active');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, chatsLoaded]);

  // Remove session flag on tab close or logout
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.removeItem('zanmisante_session');
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Remove session flag on Clerk logout
  useEffect(() => {
    if (!user) {
      localStorage.removeItem('zanmisante_session');
    }
  }, [user]);

  // Fetch chat history for signed-in user
  useEffect(() => {
    const fetchChats = async () => {
      if (user) {
        const { data } = await supabase
          .from('chats')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        setChats(data || []);
        setChatsLoaded(true);
        // If no active chat, set the first one as active
        if (!activeChat && data && data.length > 0) {
          setActiveChat(data[0]);
        }
      } else {
        setChats([]);
        setActiveChat(null);
        setChatsLoaded(false);
      }
    };
    fetchChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Fetch messages for active chat
  useEffect(() => {
    const fetchMessages = async () => {
      if (user && activeChat) {
        const { data } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', activeChat.id)
          .order('created_at', { ascending: true });
        setMessages(data || []);
      } else {
        setMessages([]);
      }
    };
    fetchMessages();
  }, [user, activeChat]);

  // Create a new chat
  const handleNewChat = async () => {
    if (!user) return;
    if (activeChat && messages.length > 0) {
      // Update the previous chat's title to the first 6 words of the first user message
      const firstUserMsg = messages.find((m) => m.role === 'user');
      if (firstUserMsg) {
        const words = firstUserMsg.content.split(' ');
        const title = words.slice(0, 6).join(' ') + (words.length > 6 ? '...' : '');
        await supabase
          .from('chats')
          .update({ title })
          .eq('id', activeChat.id);
        // Update local chat list
        setChats((prev) => prev.map((c) => c.id === activeChat.id ? { ...c, title } : c));
      }
    }
    const { data } = await supabase
      .from('chats')
      .insert([{ user_id: user.id, title: 'New Chat' }])
      .select()
      .single();
    if (data) {
      setActiveChat(data);
      setMessages([]);
      // Refetch chats to update the list
      const { data: newChats } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setChats(newChats || []);
    }
  };

  // Select a chat from history
  const handleSelectChat = (chat: Chat) => {
    setActiveChat(chat);
  };

  // Unified message handler for Chat
  const handleChatMessage = async (msg: Message) => {
    if (user && activeChat) {
      // Save to Supabase
      const { data } = await supabase
        .from('messages')
        .insert([{ chat_id: activeChat.id, role: msg.role, content: msg.content }])
        .select()
        .single();
      setMessages((prev) => [...prev, data]);

      // If this is the first user message and chat title is 'New Chat', update the title
      if (
        msg.role === 'user' &&
        activeChat.title === 'New Chat' &&
        messages.filter((m) => m.role === 'user').length === 0
      ) {
        const words = msg.content.split(' ');
        const title = words.slice(0, 6).join(' ') + (words.length > 6 ? '...' : '');
        await supabase
          .from('chats')
          .update({ title })
          .eq('id', activeChat.id);
        setChats((prev) => prev.map((c) => c.id === activeChat.id ? { ...c, title } : c));
        setActiveChat((prev) => prev ? { ...prev, title } : prev);
      }
    } else {
      setMessages((prev) => [...prev, msg]);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-green-950 dark:to-gray-900 relative overflow-hidden flex flex-col items-center justify-center">
      {/* Decorative SVG plant/leaf in the background */}
      <svg className="absolute left-0 bottom-0 w-64 h-64 opacity-20 text-emerald-300 dark:text-emerald-900 pointer-events-none" viewBox="0 0 200 200" fill="none">
        <path d="M100 180 Q120 120 180 100 Q120 80 100 20 Q80 80 20 100 Q80 120 100 180Z" fill="currentColor" />
      </svg>
      {/* Backdrop overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className="w-full max-w-5xl mx-auto relative z-30 flex flex-row gap-6 transition-all duration-300">
        {/* Main content */}
        <div className={`flex-1 min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'md:ml-0' : ''}`}>
          <div className="bg-white rounded-2xl shadow-lg">
            <header className="flex items-center justify-between h-24 py-0 pr-6 pl-0 rounded-r-2xl shadow-md">
             
              {/* Sidebar toggle for mobile */}
              <button
                className="md:hidden p-2 rounded-lg bg-emerald-200 dark:bg-emerald-800 hover:bg-emerald-300 dark:hover:bg-emerald-700 transition-colors"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
              >
                <Bars3Icon className="h-6 w-6 text-emerald-600 dark:text-emerald-300" />
              </button>
            </header>
          </div> 
           <div className="flex items-center h-full ml-[-12px]">Add commentMore actions
                <Image 
                  src="/image-removebg-preview (1).png" 
                  alt="ZanmiSanté Logo" 
                  width={160} 
                  height={96} 
                  className="object-contain max-h-full max-w-full" 
                  priority
                />
              </div>
              <div className="flex items-center gap-4">
                <SignedOut>
                  <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-stretch w-full">
                    <Link href="/sign-in" className="flex items-center gap-2 px-2 py-1 text-sm md:px-4 md:py-2 md:text-base rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-semibold shadow-md mb-2 md:mb-0">
                      <ArrowRightOnRectangleIcon className="h-5 w-5" /> 
                    </Link>
                    <Link href="/sign-up" className="flex items-center gap-2 px-2 py-1 text-sm md:px-4 md:py-2 md:text-base rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors font-semibold shadow-md border border-emerald-300">
                      <UserPlusIcon className="h-5 w-5" /> 
                    </Link>
                  </div>
                </SignedOut>
                <SignedIn>
                  <UserButton appearance={{ elements: { avatarBox: 'ring-2 ring-emerald-500' } }} />
                </SignedIn>
              </div>
              
          <div className="mt-2 bg-white rounded-2xl shadow-lg">
            <Chat
              messages={messages}
              onSendMessage={handleChatMessage}
              activeChat={activeChat}
            />
          </div>
        </div>
        {/* Mobile Sidebar */}
        <aside
          className={`
            fixed top-0 right-0 h-screen w-full sm:w-80 lg:w-96 z-30 bg-emerald-100 dark:bg-emerald-900
            border-l border-emerald-100 dark:border-emerald-800 p-6 gap-6 rounded-l-2xl shadow-lg
            flex flex-col md:hidden
            transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'}
          `}
        >
          <div className="flex-none flex flex-col items-center mb-2 w-full">
            <div className="w-full flex justify-end mb-2">
              <button
                className="md:hidden p-2 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close sidebar"
              >
                <Bars3Icon className="h-6 w-6 text-emerald-600 dark:text-emerald-300" />
              </button>
            </div>
            <Image src="/image-removebg-preview (1).png" alt="ZanmiSanté Logo" width={112} height={112} className="w-28 h-28 object-contain mb-4" />
            <h2 className="text-2xl font-bold text-emerald-800 dark:text-emerald-200 mb-6">ZanmiSanté</h2>
            <SignedIn>
              <button
                onClick={handleNewChat}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-semibold shadow-md mb-4"
              >
                <PlusIcon className="h-5 w-5" /> New Chat
              </button>
            </SignedIn>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 scrollbar-invisible">
            <SignedIn>
              <div className="space-y-2">
                {chats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => handleSelectChat(chat)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      activeChat?.id === chat.id
                        ? 'bg-emerald-600 text-white'
                        : 'hover:bg-emerald-200 dark:hover:bg-emerald-800 text-emerald-800 dark:text-emerald-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ChatBubbleLeftRightIcon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{chat.title}</span>
                    </div>
                  </button>
                ))}
              </div>
            </SignedIn>
          </div>
          <div className="flex-none pt-4 border-t border-emerald-200 dark:border-emerald-800">
            <p className="text-sm text-emerald-600 dark:text-emerald-400 text-center">
              ZanmiSanté v1.0
            </p>
          </div>
        </aside>

        {/* Desktop Sidebar */}
        <aside
          className={`
            hidden md:flex flex-col h-screen z-30
            ${sidebarCollapsed ? 'md:w-12 w-0' : 'w-64'}
            bg-emerald-100/95 dark:bg-emerald-900/95
            border-l border-emerald-100 dark:border-emerald-800 p-6 gap-6 rounded-l-2xl shadow-lg transition-all duration-300
            ${sidebarCollapsed ? 'overflow-hidden px-0 py-0' : ''}
          `}
        >
          {/* Collapse/Expand hamburger for desktop */}
          <button
            className="hidden md:flex absolute top-4 right-0 z-40 p-2 rounded-lg bg-emerald-200 dark:bg-emerald-800 hover:bg-emerald-300 dark:hover:bg-emerald-700 shadow-md border border-emerald-300 dark:border-emerald-700 transition-colors"
            onClick={() => setSidebarCollapsed((c) => !c)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{ transition: 'right 0.3s' }}
          >
            <Bars3Icon className="h-6 w-6 text-emerald-600 dark:text-emerald-300" />
          </button>
          {/* Only render content if not collapsed */}
          {!sidebarCollapsed && (
            <>
              <div className="flex-none flex flex-col items-center mb-2 w-full">
                <Image src="/image-removebg-preview (1).png" alt="ZanmiSanté Logo" width={112} height={112} className="w-28 h-28 object-contain mb-2" />
                <h2 className="text-2xl font-bold text-emerald-800 dark:text-emerald-200 mb-4">ZanmiSanté</h2>
                <SignedIn>
                  <button
                    onClick={handleNewChat}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-semibold shadow-md mb-4"
                  >
                    <PlusIcon className="h-5 w-5" /> New Chat
                  </button>
                </SignedIn>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0 scrollbar-invisible">
                <SignedIn>
                  <div className="space-y-2">
                    {chats.map((chat) => (
                      <button
                        key={chat.id}
                        onClick={() => handleSelectChat(chat)}
                        className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                          activeChat?.id === chat.id
                            ? 'bg-emerald-600 text-white'
                            : 'hover:bg-emerald-200 dark:hover:bg-emerald-800 text-emerald-800 dark:text-emerald-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <ChatBubbleLeftRightIcon className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{chat.title}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </SignedIn>
              </div>
              <div className="flex-none pt-4 border-t border-emerald-200 dark:border-emerald-800">
                <p className="text-sm text-emerald-600 dark:text-emerald-400 text-center">
                  ZanmiSanté v1.0
                </p>
              </div>
            </>
          )}
        </aside>
      </div>
    </main>
  );
}
