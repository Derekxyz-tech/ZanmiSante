'use client';

import Chat from '@/components/Chat';
import { useState } from 'react';
import { Bars3Icon, XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
          <header className="flex items-center justify-between py-4 px-6 bg-white/90 dark:bg-gray-900/80 rounded-2xl shadow-md mt-6 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500 dark:bg-emerald-400 flex items-center justify-center">
                <span className="text-white text-xl font-bold">Z</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-emerald-800 dark:text-emerald-300 leading-tight">ZanmiSanté</h1>
                <p className="text-emerald-600 dark:text-emerald-200 text-sm leading-tight">Your Health Companion</p>
              </div>
            </div>
            {/* Sidebar toggle for mobile */}
            <button
              className="md:hidden p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-200 dark:hover:bg-emerald-800/50 transition-colors"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Bars3Icon className="h-6 w-6 text-emerald-600 dark:text-emerald-300" />
            </button>
          </header>
          <Chat />
        </div>
        {/* Sidebar */}
        <aside
          className={
            `fixed md:static top-0 right-0 h-full md:h-auto z-30
            ${sidebarCollapsed ? 'md:w-12 w-0' : 'w-72 md:w-64'}
            ${sidebarOpen ? 'flex' : 'hidden'} md:flex flex-col
            ${sidebarOpen ? 'bg-emerald-100 dark:bg-emerald-900' : 'bg-emerald-100/95 dark:bg-emerald-900/95'}
            border-l border-emerald-100 dark:border-emerald-800 p-6 gap-6 items-center rounded-l-2xl md:rounded-2xl shadow-lg transition-all duration-300
            ${sidebarCollapsed ? 'overflow-hidden px-0 py-0' : ''}`
          }
        >
          {/* Collapse/Expand button for desktop, now on the right edge */}
          <button
            className="hidden md:flex absolute top-4 right-0 z-40 p-1 rounded-l-full bg-emerald-200 dark:bg-emerald-800 hover:bg-emerald-300 dark:hover:bg-emerald-700 shadow-md border border-emerald-300 dark:border-emerald-700 transition-colors"
            onClick={() => setSidebarCollapsed((c) => !c)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{ transition: 'right 0.3s' }}
          >
            {sidebarCollapsed ? (
              <ChevronLeftIcon className="h-5 w-5 text-emerald-700 dark:text-emerald-200" />
            ) : (
              <ChevronRightIcon className="h-5 w-5 text-emerald-700 dark:text-emerald-200" />
            )}
          </button>
          {/* Close button for mobile */}
          <button
            className="md:hidden absolute top-4 right-4 p-2 rounded-lg bg-emerald-100 dark:bg-emerald-800 hover:bg-emerald-200 dark:hover:bg-emerald-700 transition-colors"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <XMarkIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-300" />
          </button>
          {!sidebarCollapsed && (
            <>
              <div className="w-16 h-16 rounded-full bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center mb-2 mt-8 md:mt-0">
                <svg className="w-10 h-10 text-emerald-600 dark:text-emerald-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 48 48">
                  <path d="M24 44 Q29 29 44 24 Q29 19 24 4 Q19 19 4 24 Q19 29 24 44Z" fill="currentColor" />
                </svg>
              </div>
              <div className="text-center">
                <h2 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200 mb-1">ZanmiSanté</h2>
                <p className="text-emerald-700 dark:text-emerald-100 text-sm">Your plant & biology expert</p>
              </div>
              <div className="w-full border-t border-emerald-200 dark:border-emerald-800 my-4" />
              <ul className="flex flex-col gap-3 w-full">
                <li className="rounded-lg px-4 py-2 bg-emerald-100 dark:bg-emerald-800/60 text-emerald-800 dark:text-emerald-100 text-sm font-medium cursor-pointer opacity-60">New chat</li>
                <li className="rounded-lg px-4 py-2 bg-emerald-100 dark:bg-emerald-800/60 text-emerald-800 dark:text-emerald-100 text-sm font-medium cursor-pointer opacity-60">History (coming soon)</li>
                <li className="rounded-lg px-4 py-2 bg-emerald-100 dark:bg-emerald-800/60 text-emerald-800 dark:text-emerald-100 text-sm font-medium cursor-pointer opacity-60">Favorites (coming soon)</li>
              </ul>
              <div className="w-full flex flex-col items-center mt-auto">
                <span className="text-xs text-emerald-400 dark:text-emerald-600">v1.0</span>
              </div>
            </>
          )}
        </aside>
      </div>
    </main>
  );
}
