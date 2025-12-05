'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { hasPassphrase, getStoredPassphrase, hashVoteValue, verifyApproveRejectVote, verifyDurationVote } from '@/lib/vote-encryption'
import { voteForDuration, voteApproveReject, transitionArticleStatus } from '@/lib/article-actions'
import PassphraseSetup from '../PassphraseSetup'

interface VotingPanelProps {
    articleId: number
    status: string
    userVote?: any
    durationResults?: any
    votingResults?: any
    votedDuration?: string
    statusChangedDate?: string
    firstVoteDate?: string | null
    userId?: string
    userEmail?: string
}

export default function VotingPanel({
    articleId,
    status,
    userVote,
    durationResults,
    votingResults,
    votedDuration,
    statusChangedDate,
    firstVoteDate,
    userId,
    userEmail
}: VotingPanelProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [timeLeft, setTimeLeft] = useState<string>('')
    const [isExpired, setIsExpired] = useState(false)
    const [showPassphraseSetup, setShowPassphraseSetup] = useState(false)
    const [pendingVote, setPendingVote] = useState<{ type: 'duration' | 'approve_reject', value: string } | null>(null)
    const [verifiedUserVote, setVerifiedUserVote] = useState<string | null>(null)

    useEffect(() => {
        const calculateTimeLeft = () => {
            console.log('VotingPanel: Calculating time left', { status, statusChangedDate, votedDuration, firstVoteDate })
            let targetDate: Date | null = null
            let prefix = ''
            let suffix = ''

            if (status === 'Debate Duration voting opened') {
                if (!firstVoteDate) {
                    setTimeLeft('Timer starts after first vote')
                    setIsExpired(false)
                    return
                }
                // 7 days from first vote
                targetDate = new Date(new Date(firstVoteDate).getTime() + 7 * 24 * 60 * 60 * 1000)
                suffix = 'to vote for a debate duration'
            } else if (status === 'Debate ongoing') {
                if (!statusChangedDate || !votedDuration) {
                    console.log('VotingPanel: Missing data for Debate ongoing', { statusChangedDate, votedDuration })
                    return
                }

                // Convert duration string to days
                const durationMap: Record<string, number> = {
                    'One Month': 30,
                    'Two Months': 60,
                    'Three Months': 90,
                    'Four Month': 120,
                    'Five Month': 150,
                    'Six Month': 180
                }
                const days = durationMap[votedDuration] || 30
                targetDate = new Date(new Date(statusChangedDate).getTime() + days * 24 * 60 * 60 * 1000)
                suffix = 'before vote opens'
            } else if (status === 'Voting opened') {
                if (!statusChangedDate) return
                // 14 days from status change
                targetDate = new Date(new Date(statusChangedDate).getTime() + 14 * 24 * 60 * 60 * 1000)
                suffix = 'left to vote'
            }

            if (!targetDate) {
                console.log('VotingPanel: No target date calculated')
                setTimeLeft('')
                setIsExpired(false)
                return
            }

            const now = new Date()
            const difference = targetDate.getTime() - now.getTime()
            console.log('VotingPanel: Time difference', { difference, targetDate })

            if (difference > 0) {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24))
                const hours = Math.floor((difference / (1000 * 60 * 60)) % 24)
                const minutes = Math.floor((difference / (1000 * 60)) % 60)
                const seconds = Math.floor((difference / 1000) % 60)

                if (days > 0) {
                    setTimeLeft(`${days} days, ${hours} hours and ${minutes} minutes ${suffix}`)
                } else if (hours > 0) {
                    setTimeLeft(`${hours} hours and ${minutes} minutes ${suffix}`)
                } else if (minutes > 0) {
                    setTimeLeft(`${minutes} minutes and ${seconds} seconds ${suffix}`)
                } else {
                    setTimeLeft(`${seconds} seconds ${suffix}`)
                }
                setIsExpired(false)
            } else {
                setTimeLeft('Time expired - Transitioning status...')
                setIsExpired(true)
                // Transition the article status and then refresh
                transitionArticleStatus(articleId).then((result) => {
                    if (result.success) {
                        setTimeLeft(`Status changed to ${result.newStatus}`)
                    }
                    // Refresh the page to show the new status
                    setTimeout(() => {
                        router.refresh()
                    }, 1000)
                })
            }
        }

        calculateTimeLeft()
        const timer = setInterval(calculateTimeLeft, 1000) // Update every second for smooth countdown

        return () => clearInterval(timer)
    }, [status, statusChangedDate, votedDuration, firstVoteDate, articleId, router])

    // Verify user's vote for highlighting
    useEffect(() => {
        const verifyUserVoteValue = async () => {
            if (!userVote || !userId) {
                setVerifiedUserVote(null)
                return
            }

            const passphrase = getStoredPassphrase()
            if (!passphrase) {
                setVerifiedUserVote(null)
                return
            }

            // Verify approve/reject vote
            if (userVote.typevote === 'Voting_opened') {
                const verified = await verifyApproveRejectVote(passphrase, userId, articleId, userVote.votevalue)
                setVerifiedUserVote(verified)
            }
            // Verify duration vote
            else if (userVote.typevote === 'Debate_Duration_voting') {
                const verified = await verifyDurationVote(passphrase, userId, articleId, userVote.votevalue)
                setVerifiedUserVote(verified)
            }
        }

        verifyUserVoteValue()
    }, [userVote, userId, articleId])

    const handleDurationVote = async (duration: string) => {
        if (!userId) {
            alert('You must be logged in to vote')
            return
        }

        // Check if user has passphrase set
        if (!hasPassphrase()) {
            setPendingVote({ type: 'duration', value: duration })
            setShowPassphraseSetup(true)
            return
        }

        await executeVote('duration', duration)
    }

    const handleApproveReject = async (vote: 'approve' | 'reject') => {
        console.log('=== handleApproveReject called ===')
        console.log('vote:', vote)
        console.log('userId:', userId)
        console.log('hasPassphrase():', hasPassphrase())

        if (!userId) {
            console.log('No userId - showing alert')
            alert('You must be logged in to vote')
            return
        }

        // Check if user has passphrase set
        if (!hasPassphrase()) {
            console.log('No passphrase - showing PassphraseSetup modal')
            setPendingVote({ type: 'approve_reject', value: vote })
            setShowPassphraseSetup(true)
            return
        }

        console.log('Has passphrase - executing vote')
        await executeVote('approve_reject', vote)
    }

    const executeVote = async (type: 'duration' | 'approve_reject', value: string) => {
        if (!userId) return

        setLoading(true)
        const passphrase = getStoredPassphrase()

        if (!passphrase) {
            alert('Passphrase not found. Please try again.')
            setLoading(false)
            return
        }

        // Determine old vote value if exists (for vote change)
        let oldVoteValue: string | undefined = undefined
        if (userVote) {
            console.log('Attempting to verify old vote:', userVote)

            // Only verify if the vote type matches what we're voting for
            const shouldVerify =
                (type === 'duration' && userVote.typevote === 'Debate_Duration_voting') ||
                (type === 'approve_reject' && userVote.typevote === 'Voting_opened')

            if (shouldVerify) {
                // userVote.votevalue is the hash
                if (type === 'duration' && userVote.typevote === 'Debate_Duration_voting') {
                    const verified = await verifyDurationVote(passphrase, userId, articleId, userVote.votevalue)
                    if (verified) oldVoteValue = verified
                } else if (type === 'approve_reject' && userVote.typevote === 'Voting_opened') {
                    const verified = await verifyApproveRejectVote(passphrase, userId, articleId, userVote.votevalue)
                    if (verified) oldVoteValue = verified
                }

                console.log('Verification result:', { oldVoteValue })

                if (!oldVoteValue) {
                    // Could not verify old vote (wrong passphrase?)
                    console.error('Failed to verify old vote with current passphrase')
                    alert('Could not verify your previous vote with the current passphrase. Vote change aborted.')
                    setLoading(false)
                    return
                }
            } else {
                console.log('Vote type mismatch - this is a new vote for this type')
            }
        }

        // Hash the vote value for anonymous storage
        const hashedValue = await hashVoteValue(passphrase, userId, articleId, value)

        if (type === 'duration') {
            // Pass actual value (for counter increment) and hashed value (for storage)
            const result = await voteForDuration(articleId, value, hashedValue, userId, oldVoteValue)
            if (result?.error) {
                alert(result.error)
                setLoading(false)
                return
            }
        } else {
            // Pass actual value (for counter increment) and hashed value (for storage)
            const result = await voteApproveReject(articleId, value as 'approve' | 'reject', hashedValue, userId, oldVoteValue as 'approve' | 'reject')
            if (result?.error) {
                alert(result.error)
                setLoading(false)
                return
            }
        }

        // Small delay to ensure database write completes
        await new Promise(resolve => setTimeout(resolve, 100))
        router.refresh()
        setLoading(false)
    }

    const handlePassphraseComplete = async (passphrase: string) => {
        setShowPassphraseSetup(false)
        if (pendingVote) {
            await executeVote(pendingVote.type, pendingVote.value)
            setPendingVote(null)
        }
    }

    const handlePassphraseCancel = () => {
        setShowPassphraseSetup(false)
        setPendingVote(null)
    }

    // --- RENDERERS ---

    const renderDebateDurationVoting = () => {
        const durations = [
            'One Month', 'Two Months', 'Three Months',
            'Four Month', 'Five Month', 'Six Month'
        ]

        // Calculate current winner locally for real-time feel (though data comes from server)
        // We can find the max count from durationResults
        let currentWinner = ''
        let maxCount = 0 // Start at 0 so we don't show a winner if all are 0

        if (durationResults) {
            const durationToColumn: Record<string, string> = {
                'One Month': 'votecount_one_month',
                'Two Months': 'votecount_two_months',
                'Three Months': 'votecount_three_months',
                'Four Month': 'votecount_four_months',
                'Five Month': 'votecount_five_months',
                'Six Month': 'votecount_six_months'
            }

            durations.forEach(d => {
                const key = durationToColumn[d]
                const count = durationResults[key] || 0
                if (count > maxCount) {
                    maxCount = count
                    currentWinner = d
                }
            })
        }

        return (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                        Vote for Debate Duration
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        How long should the debate last?
                    </p>

                    {timeLeft && (
                        <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {timeLeft}
                        </div>
                    )}
                </div>

                {isExpired ? (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-center font-medium">
                        Voting period has ended. Results will be finalized shortly.
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {durations.map((duration) => {
                            const isSelected = verifiedUserVote === duration
                            const isWinner = duration === currentWinner

                            const durationToColumn: Record<string, string> = {
                                'One Month': 'votecount_one_month',
                                'Two Months': 'votecount_two_months',
                                'Three Months': 'votecount_three_months',
                                'Four Month': 'votecount_four_months',
                                'Five Month': 'votecount_five_months',
                                'Six Month': 'votecount_six_months'
                            }
                            const key = durationToColumn[duration]
                            const count = durationResults?.[key] || 0

                            return (
                                <button
                                    key={duration}
                                    onClick={() => handleDurationVote(duration)}
                                    disabled={loading}
                                    className={`
                                        p-3 rounded-lg text-sm font-medium transition-all border relative
                                        ${loading ? 'cursor-wait opacity-60' : 'cursor-pointer'}
                                        ${isSelected
                                            ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-500 ring-offset-2'
                                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                                        }
                                        ${loading ? 'pointer-events-none' : ''}
                                    `}
                                >
                                    {loading && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 rounded-lg">
                                            <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        </div>
                                    )}
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="flex justify-between items-center w-full">
                                            <span>{duration}</span>
                                            {isWinner && <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Lead</span>}
                                        </div>
                                        <div className={`text-xs font-bold ${isSelected ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                                            {count} votes
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                )}

                {currentWinner && (
                    <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <span className="text-sm text-slate-500">Current Winner:</span>
                        <div className="font-bold text-slate-900 dark:text-white">{currentWinner}</div>
                    </div>
                )}
            </div>
        )
    }

    const renderDebateOngoing = () => {
        return (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                    Debate Ongoing
                </h3>

                <div className="text-center mb-6">
                    <div className="text-sm text-slate-500 mb-1">Winning Duration</div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {votedDuration || 'Unknown'}
                    </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
                    <div className="text-sm text-slate-500 mb-1">Time Remaining</div>
                    <div className="font-mono text-xl font-bold text-slate-900 dark:text-white">
                        {timeLeft || 'Calculating...'}
                    </div>
                </div>
            </div>
        )
    }

    const renderVotingOpened = () => {
        const approveCount = votingResults?.nb_approve || 0
        const rejectCount = votingResults?.nb_reject || 0
        const total = approveCount + rejectCount

        const approvePercent = total > 0 ? Math.round((approveCount / total) * 100) : 0
        const rejectPercent = total > 0 ? Math.round((rejectCount / total) * 100) : 0

        return (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                    Final Vote
                </h3>

                {timeLeft && (
                    <div className="mb-6 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {timeLeft}
                    </div>
                )}

                {isExpired ? (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-center font-medium mb-8">
                        Voting period has ended. Results will be finalized shortly.
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <button
                            onClick={() => handleApproveReject('approve')}
                            disabled={loading}
                            className={`
                                p-4 rounded-xl border-2 transition-all
                                ${verifiedUserVote === 'approve'
                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 ring-2 ring-green-500 ring-offset-2'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-green-300 text-slate-700 dark:text-slate-300'
                                }
                                ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                            `}
                        >
                            <div className="text-lg font-bold mb-1">Approve</div>
                            <div className="text-2xl font-bold">{approveCount}</div>
                        </button>

                        <button
                            onClick={() => handleApproveReject('reject')}
                            disabled={loading}
                            className={`
                                p-4 rounded-xl border-2 transition-all
                                ${verifiedUserVote === 'reject'
                                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 ring-2 ring-red-500 ring-offset-2'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-red-300 text-slate-700 dark:text-slate-300'
                                }
                                ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                            `}
                        >
                            <div className="text-lg font-bold mb-1">Reject</div>
                            <div className="text-2xl font-bold">{rejectCount}</div>
                        </button>
                    </div>
                )}

                {/* Progress Bar */}
                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                        className="bg-green-500 h-full transition-all duration-500"
                        style={{ width: `${approvePercent}%` }}
                    />
                    <div
                        className="bg-red-500 h-full transition-all duration-500"
                        style={{ width: `${rejectPercent}%` }}
                    />
                </div>
                <div className="flex justify-between mt-2 text-xs font-medium text-slate-500">
                    <span>{approvePercent}% Approved</span>
                    <span>{rejectPercent}% Rejected</span>
                </div>
            </div>
        )
    }

    const renderFinalStatus = () => {
        const isApproved = status === 'Approved'
        const isIgnored = status === 'Ignored'
        const approveCount = votingResults?.nb_approve || 0
        const rejectCount = votingResults?.nb_reject || 0
        const total = approveCount + rejectCount
        const percent = total > 0
            ? Math.round(((isApproved ? approveCount : rejectCount) / total) * 100)
            : 0

        if (isIgnored) {
            return (
                <div className="p-6 rounded-xl shadow-lg border-2 text-center bg-gray-50 dark:bg-gray-900/10 border-gray-200 dark:border-gray-800">
                    <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-300">
                        Article Ignored
                    </h3>
                    <div className="text-4xl font-bold mb-2 text-slate-900 dark:text-white">
                        0
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        No votes received
                    </p>
                </div>
            )
        }

        return (
            <div className={`
                p-6 rounded-xl shadow-lg border-2 text-center
                ${isApproved
                    ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                }
            `}>
                <h3 className={`text-xl font-bold mb-2 ${isApproved ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
                    {isApproved ? 'Article Approved' : 'Article Rejected'}
                </h3>
                <div className="text-4xl font-bold mb-2 text-slate-900 dark:text-white">
                    {percent}%
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    {isApproved ? 'Approval Rate' : 'Rejection Rate'}
                </p>
            </div>
        )
    }

    return (
        <>
            {showPassphraseSetup && userEmail && (
                <PassphraseSetup
                    userEmail={userEmail}
                    onComplete={handlePassphraseComplete}
                    onCancel={handlePassphraseCancel}
                />
            )}

            {(() => {
                switch (status) {
                    case 'Debate Duration voting opened':
                        return renderDebateDurationVoting()
                    case 'Debate ongoing':
                        return renderDebateOngoing()
                    case 'Voting opened':
                        return renderVotingOpened()
                    case 'Approved':
                    case 'Rejected':
                    case 'Ignored':
                        return renderFinalStatus()
                    default:
                        return null
                }
            })()}
        </>
    )
}
