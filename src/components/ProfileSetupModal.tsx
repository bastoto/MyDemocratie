'use client'

import { useState } from 'react'
import PassphraseSetup from './PassphraseSetup'
import { encryptText } from '@/lib/encryption'
import { generatePseudoClient } from '@/lib/pseudo-generator'

interface ProfileSetupModalProps {
    userId: string
    userEmail: string
    firstname: string
    lastname: string
    onComplete: () => void
}

export default function ProfileSetupModal({
    userId,
    userEmail,
    firstname,
    lastname,
    onComplete
}: ProfileSetupModalProps) {
    const [generatedPseudo, setGeneratedPseudo] = useState(generatePseudoClient())
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showPassphraseSetup, setShowPassphraseSetup] = useState(false)

    const handleGetStarted = () => {
        setShowPassphraseSetup(true)
    }

    const handleRegeneratePseudo = () => {
        const newPseudo = generatePseudoClient()
        setGeneratedPseudo(newPseudo)
    }

    const handlePassphraseComplete = async (passphrase: string) => {
        setLoading(true)
        setError(null)

        try {
            // Encrypt firstname and lastname
            const encryptedFirstname = await encryptText(firstname, passphrase)
            const encryptedLastname = await encryptText(lastname, passphrase)

            // Import server action dynamically
            const { createUserProfile } = await import('@/lib/user-actions')

            // Create user profile via server action
            const result = await createUserProfile(
                userId,
                generatedPseudo,
                encryptedFirstname,
                encryptedLastname
            )

            if (!result.success) {
                // If pseudo is not unique, regenerate and try again
                if (result.error?.includes('Pseudo')) {
                    const newPseudo = generatePseudoClient()
                    setGeneratedPseudo(newPseudo)
                    setError('Pseudo was not unique, please try again with the new one')
                    setLoading(false)
                    return
                }
                setError(result.error || 'Failed to create profile')
                setLoading(false)
                return
            }

            // Store passphrase in localStorage
            localStorage.setItem('userPassphrase', passphrase)

            // Success!
            onComplete()

        } catch (err) {
            setError('Failed to encrypt user data')
            console.error(err)
            setLoading(false)
        }
    }

    const handlePassphraseCancel = () => {
        setShowPassphraseSetup(false)
    }

    if (showPassphraseSetup) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="relative z-10 max-w-2xl w-full mx-4">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-2xl mb-4">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Your Pseudo</h3>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="flex-1 p-3 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
                                <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{generatedPseudo}</p>
                            </div>
                            <button
                                onClick={handleRegeneratePseudo}
                                disabled={loading}
                                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-sm font-medium disabled:opacity-50"
                            >
                                Regenerate
                            </button>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            This pseudo will be displayed instead of your real name throughout the platform for anonymity.
                        </p>
                    </div>
                    <PassphraseSetup
                        userEmail={userEmail}
                        onComplete={handlePassphraseComplete}
                        onCancel={handlePassphraseCancel}
                    />
                    {error && (
                        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                            {error}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-2xl max-w-md w-full mx-4">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        Account Confirmed!
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400">
                        Your account has been confirmed with success, we just need one more thing
                    </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-900 dark:text-blue-100 mb-4">
                        To protect your privacy, we'll generate a secure passphrase and a unique pseudo for you.
                        Your real name will be encrypted and never displayed publicly.
                    </p>

                    {/* Pseudo Preview */}
                    <div className="mt-4">
                        <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-2">Your Pseudo:</p>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 p-3 bg-white dark:bg-slate-800 border-2 border-blue-300 dark:border-blue-700 rounded-lg">
                                <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{generatedPseudo}</p>
                            </div>
                            <button
                                onClick={handleRegeneratePseudo}
                                disabled={loading}
                                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 whitespace-nowrap"
                            >
                                Regenerate
                            </button>
                        </div>
                        <p className="text-xs text-blue-800 dark:text-blue-200 mt-2">
                            This will be your public identity. You can regenerate it until you're happy!
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleGetStarted}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                >
                    Continue with this Pseudo
                </button>
            </div>
        </div>
    )
}
