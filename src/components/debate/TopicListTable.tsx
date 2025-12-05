'use client'

import Link from 'next/link'

interface Topic {
    id: number
    title: string
    category: string
    creationdate: string
    lastupdate: string
    author_id: string
    author: {
        pseudo: string
    } | null
    messageCount: number
}

interface TopicListTableProps {
    topics: Topic[]
    userId?: string
}

export default function TopicListTable({ topics, userId }: TopicListTableProps) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const getCategoryBadgeColor = (category: string) => {
        switch (category) {
            case 'Approval':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
            case 'Reject':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            case 'Doubt':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
            case 'Improvement':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
        }
    }

    if (topics.length === 0) {
        return (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 border-dashed">
                <p>No topics found. Be the first to start a debate!</p>
            </div>
        )
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Created
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Last Update
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Title
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Category
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Author
                        </th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Messages
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {topics.map((topic) => (
                        <tr
                            key={topic.id}
                            className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                            <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                                {formatDate(topic.creationdate)}
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                                {formatDate(topic.lastupdate)}
                            </td>
                            <td className="py-3 px-4">
                                <Link
                                    href={`#topic-${topic.id}`}
                                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                >
                                    {topic.title}
                                </Link>
                            </td>
                            <td className="py-3 px-4">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getCategoryBadgeColor(topic.category)}`}>
                                    {topic.category}
                                </span>
                            </td>
                            <td className="py-3 px-4 text-sm">
                                {topic.author_id === userId ? (
                                    <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full text-xs font-semibold">
                                        You
                                    </span>
                                ) : (
                                    <span className="text-slate-600 dark:text-slate-400">
                                        {topic.author?.pseudo || 'Anonymous'}
                                    </span>
                                )}
                            </td>
                            <td className="py-3 px-4 text-center">
                                <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                    {topic.messageCount}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
