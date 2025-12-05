'use client'

import { useState, useEffect } from 'react'
import { getTopics } from '@/lib/debate-actions'
import CreateTopicModal from '../debate/CreateTopicModal'
import TopicListTable from '../debate/TopicListTable'

interface DebateSectionProps {
    debatespaceId: number
    userId?: string
}

export default function DebateSection({ debatespaceId, userId }: DebateSectionProps) {
    const [topics, setTopics] = useState<any[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [sortBy, setSortBy] = useState<'lastupdate' | 'creationdate'>('lastupdate')
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)

    const pageSize = 10
    const totalPages = Math.ceil(total / pageSize)

    const fetchTopics = async () => {
        setLoading(true)
        const result = await getTopics(debatespaceId, page, search, sortBy)
        setTopics(result.topics)
        setTotal(result.total)
        setLoading(false)
    }

    useEffect(() => {
        fetchTopics()
    }, [debatespaceId, page, search, sortBy])

    const handleSearch = (value: string) => {
        setSearch(value)
        setPage(1) // Reset to first page on search
    }

    const handleSortChange = (value: 'lastupdate' | 'creationdate') => {
        setSortBy(value)
        setPage(1)
    }

    const handleTopicCreated = () => {
        setPage(1)
        fetchTopics()
    }

    return (
        <div className="mt-12 pt-12 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Debate Space</h2>

                <div className="flex gap-4">
                    <select
                        value={sortBy}
                        onChange={(e) => handleSortChange(e.target.value as 'lastupdate' | 'creationdate')}
                        className="p-2 border rounded-lg text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    >
                        <option value="lastupdate">Last Updated</option>
                        <option value="creationdate">Creation Date</option>
                    </select>

                    {userId && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                            New Topic
                        </button>
                    )}
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Search topics by title or author..."
                        className="w-full p-3 pl-10 border rounded-lg text-slate-900 dark:bg-slate-800 dark:text-white dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            {/* Topics Table */}
            {loading ? (
                <div className="text-center py-12">
                    <svg className="animate-spin h-8 w-8 mx-auto text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            ) : (
                <TopicListTable topics={topics} />
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 border rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 dark:border-slate-700 transition-colors"
                    >
                        Previous
                    </button>

                    <span className="text-sm text-slate-600 dark:text-slate-400">
                        Page {page} of {totalPages}
                    </span>

                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 border rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 dark:border-slate-700 transition-colors"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Create Topic Modal */}
            {showModal && userId && (
                <CreateTopicModal
                    debatespaceId={debatespaceId}
                    userId={userId}
                    onClose={() => setShowModal(false)}
                    onSuccess={handleTopicCreated}
                />
            )}
        </div>
    )
}
