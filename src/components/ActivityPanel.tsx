'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getStoredPassphrase, verifyApproveRejectVote, verifyDurationVote } from '@/lib/vote-encryption'

interface ActivityPanelProps {
    title: string
    items: any[]
    type: 'vote' | 'article' | 'comment'
    userId?: string
}

export default function ActivityPanel({ title, items, type, userId }: ActivityPanelProps) {
    const [verifiedVotes, setVerifiedVotes] = useState<Record<number, string>>({})
    const [passphraseMissing, setPassphraseMissing] = useState(false)

    useEffect(() => {
        if (type !== 'vote' || items.length === 0) return

        const verifyVotes = async () => {
            const passphrase = getStoredPassphrase()
            if (!passphrase) {
                setPassphraseMissing(true)
                return
            }
            setPassphraseMissing(false)

            const verified: Record<number, string> = {}

            for (const item of items) {
                if (!item.user_id) continue // Skip legacy votes without user_id

                // item.votevalue is the hash from the DB
                const storedHash = item.votevalue

                if (item.typevote === 'Voting_opened' || item.typevote === 'Approve_Reject_voting') {
                    const result = await verifyApproveRejectVote(passphrase, item.user_id, item.article_id, storedHash)
                    if (result) verified[item.id] = result
                } else if (item.typevote === 'Debate_Duration_voting') {
                    const result = await verifyDurationVote(passphrase, item.user_id, item.article_id, storedHash)
                    if (result) verified[item.id] = result
                }
            }
            setVerifiedVotes(verified)
        }

        verifyVotes()
    }, [items, type])

    const formatVoteDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
        }) + ' at ' + date.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4">{title}</h3>
            {items.length > 0 ? (
                type === 'vote' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800">
                                    <th className="text-left py-2 px-3 text-xs font-semibold text-slate-600 dark:text-slate-400">Date</th>
                                    <th className="text-left py-2 px-3 text-xs font-semibold text-slate-600 dark:text-slate-400">Vote Type</th>
                                    <th className="text-left py-2 px-3 text-xs font-semibold text-slate-600 dark:text-slate-400">Your Vote</th>
                                    <th className="text-left py-2 px-3 text-xs font-semibold text-slate-600 dark:text-slate-400">Article</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item: any) => {
                                    const voteValue = item.user_id ? verifiedVotes[item.id] : item.votevalue
                                    const isVerifying = !voteValue && item.user_id && !passphraseMissing

                                    return (
                                        <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                                            <td className="py-3 px-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                                {formatVoteDate(item.votedate)}
                                            </td>
                                            <td className="py-3 px-3 text-xs">
                                                <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                    {item.typevote === 'Debate_Duration_voting' ? 'Duration' : 'Approve/Reject'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3 text-xs">
                                                {passphraseMissing ? (
                                                    <span className="text-amber-600 italic">Enter passphrase</span>
                                                ) : isVerifying ? (
                                                    <span className="text-slate-400 italic">Verifying...</span>
                                                ) : (
                                                    item.typevote === 'Debate_Duration_voting' ? (
                                                        <span className="inline-flex px-2 py-1 rounded text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                                                            {voteValue}
                                                        </span>
                                                    ) : (
                                                        <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${voteValue === 'approve'
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                                            }`}>
                                                            {voteValue === 'approve' ? 'Approved' : 'Rejected'}
                                                        </span>
                                                    )
                                                )}
                                            </td>
                                            <td className="py-3 px-3 text-xs">
                                                <span className="text-slate-700 dark:text-slate-300 font-medium">
                                                    {item.articles?.title || 'Unknown'}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {items.map((item: any) => (
                            <li key={item.id} className="text-sm text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0">
                                {type === 'article' && (
                                    <span>
                                        Created{' '}
                                        <Link href={`/articles/${item.id}`} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                                            {item.title}
                                        </Link>
                                        {' '}({item.status})
                                    </span>
                                )}
                                {type === 'comment' && (
                                    <span className="flex flex-col gap-1">
                                        <span>
                                            Commented on topic{' '}
                                            <Link href={`/articles/${item.topics?.debatespaces?.article_id}#topic-${item.topics?.id}`} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                                                {item.topics?.title || 'Unknown'}
                                            </Link>
                                        </span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            Article:{' '}
                                            <Link href={`/articles/${item.topics?.debatespaces?.article_id}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                                                {item.topics?.debatespaces?.articles?.title || 'Unknown'}
                                            </Link>
                                            {' • '}{formatVoteDate(item.creationdate)}
                                        </span>
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                )
            ) : (
                <p className="text-slate-500 dark:text-slate-400 text-sm italic">No activity yet.</p>
            )}
        </div>
    )
}
