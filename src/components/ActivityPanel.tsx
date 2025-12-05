'use client'

import { useState, useEffect } from 'react'
import { getStoredPassphrase } from '@/lib/vote-encryption'
import { verifyApproveRejectVote, verifyDurationVote } from '@/lib/encryption'

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

    const renderVote = (item: any) => {
        const dateDisplay = (
            <span className="text-slate-400 text-xs">{formatVoteDate(item.votedate)} - </span>
        )

        // If legacy vote (no user_id) or verified
        const voteValue = item.user_id ? verifiedVotes[item.id] : item.votevalue

        if (!voteValue && item.user_id) {
            if (passphraseMissing) {
                return <span>{dateDisplay} <span className="text-amber-600 italic">Enter passphrase to view vote</span></span>
            }
            return <span>{dateDisplay} <span className="text-slate-400 italic">Verifying...</span></span>
        }

        // For Approve/Reject votes
        if (item.typevote === 'Voting_opened' || item.typevote === 'Approve_Reject_voting') {
            const isApprove = voteValue === 'approve'
            return (
                <span className="leading-relaxed">
                    {dateDisplay}
                    You{' '}
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${isApprove
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                        {isApprove ? 'Approved' : 'Rejected'}
                    </span>{' '}
                    article{' '}
                    <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        {item.articles?.title || 'Unknown'}
                    </span>
                </span>
            )
        }

        // For Duration voting
        if (item.typevote === 'Debate_Duration_voting') {
            return (
                <span className="leading-relaxed">
                    {dateDisplay}
                    You voted for{' '}
                    <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                        {voteValue}
                    </span>{' '}
                    debate duration on article{' '}
                    <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        {item.articles?.title || 'Unknown'}
                    </span>
                </span>
            )
        }

        // Fallback
        return <span>{dateDisplay}Voted <strong>{item.typevote}</strong> on "{item.articles?.title}"</span>
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4">{title}</h3>
            {items.length > 0 ? (
                <ul className="space-y-3">
                    {items.map((item: any) => (
                        <li key={item.id} className="text-sm text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0">
                            {type === 'vote' && renderVote(item)}
                            {type === 'article' && (
                                <span>Created <strong>{item.title}</strong> ({item.status})</span>
                            )}
                            {type === 'comment' && (
                                <span>Commented on <strong>{item.topics?.title}</strong>: "{item.content.substring(0, 50)}..."</span>
                            )}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-slate-500 dark:text-slate-400 text-sm italic">No activity yet.</p>
            )}
        </div>
    )
}
