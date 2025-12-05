'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArticleSummary } from '@/lib/dashboard-data'

export function StatCard({ label, articles, color, userId }: { label: string, articles: ArticleSummary[], color: string, userId?: string }) {
    const [isExpanded, setIsExpanded] = useState(false)
    const count = articles.length

    return (
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 transition-all">
            <div
                onClick={() => count > 0 && setIsExpanded(!isExpanded)}
                className={`flex justify-between items-center p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg ${isExpanded ? 'rounded-b-none border-b border-slate-100 dark:border-slate-800' : ''}`}
            >
                <div className="flex items-center gap-2">
                    {count > 0 && (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    )}
                    <span className="font-medium text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {label}
                    </span>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${color}`}>
                    {count}
                </span>
            </div>

            {isExpanded && count > 0 && (
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-b-lg space-y-3 animate-in slide-in-from-top-2 duration-200">
                    {articles.map(article => (
                        <Link
                            key={article.id}
                            href={`/articles/${article.id}`}
                            className="block p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all"
                        >
                            <div className="flex justify-between items-start gap-2 mb-1">
                                <h4 className="font-semibold text-slate-900 dark:text-white text-sm line-clamp-1">
                                    {article.title}
                                </h4>
                                <span className="text-xs text-slate-400 shrink-0">
                                    {new Date(article.statuschangedate).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">
                                {article.goal}
                            </p>
                            <div className="text-xs text-slate-500 dark:text-slate-500 flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                    <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                                </svg>
                                {article.author_id === userId ? (
                                    <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full text-xs font-semibold">
                                        You
                                    </span>
                                ) : (article.author?.pseudo || 'Unknown')}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
