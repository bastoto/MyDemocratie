'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface UrgentArticle {
    id: number
    title: string
    type: 'constitutional' | 'law'
    status: string
    statuschangedate: string
    author: {
        pseudo: string
    } | null
    deadline: string
    timeRemaining: number
}

interface UrgentVotingSectionProps {
    articles: UrgentArticle[]
}

export default function UrgentVotingSection({ articles }: UrgentVotingSectionProps) {
    const [countdowns, setCountdowns] = useState<Record<number, string>>({})

    useEffect(() => {
        const calculateCountdowns = () => {
            const newCountdowns: Record<number, string> = {}

            articles.forEach(article => {
                const now = new Date()
                const deadline = new Date(article.deadline)
                const difference = deadline.getTime() - now.getTime()

                if (difference > 0) {
                    const days = Math.floor(difference / (1000 * 60 * 60 * 24))
                    const hours = Math.floor((difference / (1000 * 60 * 60)) % 24)
                    const minutes = Math.floor((difference / (1000 * 60)) % 60)
                    const seconds = Math.floor((difference / 1000) % 60)

                    if (days > 0) {
                        newCountdowns[article.id] = `${days}d ${hours}h ${minutes}m`
                    } else if (hours > 0) {
                        newCountdowns[article.id] = `${hours}h ${minutes}m ${seconds}s`
                    } else if (minutes > 0) {
                        newCountdowns[article.id] = `${minutes}m ${seconds}s`
                    } else {
                        newCountdowns[article.id] = `${seconds}s`
                    }
                } else {
                    newCountdowns[article.id] = 'Expired'
                }
            })

            setCountdowns(newCountdowns)
        }

        calculateCountdowns()
        const timer = setInterval(calculateCountdowns, 1000)

        return () => clearInterval(timer)
    }, [articles])

    if (articles.length === 0) {
        return null
    }

    return (
        <section className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center gap-3 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Vote ends in 3 days or less!
                </h2>
            </div>

            <div className="space-y-3">
                {articles.map((article) => (
                    <Link
                        key={article.id}
                        href={`/articles/${article.id}`}
                        className="block p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 transition-all hover:shadow-md bg-slate-50 dark:bg-slate-800/50"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${article.type === 'constitutional'
                                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                        : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
                                        }`}>
                                        {article.type}
                                    </span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                        by {article.author?.pseudo || 'Unknown'}
                                    </span>
                                </div>
                                <h3 className="font-semibold text-slate-900 dark:text-white mb-1 line-clamp-2">
                                    {article.title}
                                </h3>
                            </div>

                            <div className="flex-shrink-0 text-right">
                                <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-3 py-2 rounded-lg font-mono text-sm font-bold whitespace-nowrap">
                                    {countdowns[article.id] || 'Calculating...'}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    remaining
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    )
}
