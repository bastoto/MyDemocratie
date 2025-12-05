'use client'

import { useState, useEffect } from 'react'
import { generatePassphrase, storePassphrase } from '@/lib/vote-encryption'

interface PassphraseSetupProps {
    userEmail: string
    onComplete: (passphrase: string) => void
    onCancel: () => void
}

export default function PassphraseSetup({ userEmail, onComplete, onCancel }: PassphraseSetupProps) {
    const [passphrase, setPassphrase] = useState('')
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        // Generate passphrase on mount
        setPassphrase(generatePassphrase())
    }, [])

    const handleRegenerate = () => {
        setPassphrase(generatePassphrase())
        setCopied(false)
    }

    const handleCopy = async () => {
        await navigator.clipboard.writeText(passphrase)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleEmailToSelf = () => {
        const subject = encodeURIComponent('My Voting Passphrase - MyDemocratie')
        const body = encodeURIComponent(
            `Your voting passphrase is:\n\n${passphrase}\n\n` +
            `Keep this safe! You'll need it to view your vote history.\n\n` +
            `This passphrase is stored only in your browser. If you clear your browser data, ` +
            `you'll need this passphrase to view your past votes.`
        )
        window.open(`mailto:${userEmail}?subject=${subject}&body=${body}`, '_blank')
    }

    const handleConfirm = () => {
        storePassphrase(passphrase)
        onComplete(passphrase)
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Your Voting Passphrase
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Required to view your vote history
                        </p>
                    </div>
                </div>

                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between gap-3">
                        <code className="text-lg font-mono font-bold text-slate-900 dark:text-white">
                            {passphrase}
                        </code>
                        <button
                            onClick={handleRegenerate}
                            className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            title="Generate new passphrase"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
                    <div className="flex gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                            <strong>Save this passphrase!</strong> It's stored only in your browser.
                            If you clear your browser data, you'll need it to view past votes.
                        </p>
                    </div>
                </div>

                <div className="flex gap-2 mb-4">
                    <button
                        onClick={handleCopy}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${copied
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                            }`}
                    >
                        {copied ? (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Copied!
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Copy
                            </>
                        )}
                    </button>
                    <button
                        onClick={handleEmailToSelf}
                        className="flex-1 py-2 px-4 rounded-lg font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Email to Self
                    </button>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 px-4 rounded-lg font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 py-3 px-4 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700"
                    >
                        I've Saved It - Continue
                    </button>
                </div>
            </div>
        </div>
    )
}
