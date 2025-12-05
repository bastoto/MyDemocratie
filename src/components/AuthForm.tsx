'use client'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import PassphraseSetup from './PassphraseSetup'
import { encryptText } from '@/lib/encryption'
import { generatePseudoClient } from '@/lib/pseudo-generator'

export default function AuthForm() {
    const [isSignUp, setIsSignUp] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [firstname, setFirstname] = useState('')
    const [lastname, setLastname] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)

    // Passphrase setup state
    const [showPassphraseSetup, setShowPassphraseSetup] = useState(false)
    const [generatedPseudo, setGeneratedPseudo] = useState('')
    const [pendingUserId, setPendingUserId] = useState<string | null>(null)

    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async () => {
        setLoading(true)
        setError(null)
        setMessage(null)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setError(error.message)
        } else {
            router.push('/')
            router.refresh()
        }
        setLoading(false)
    }

    const handleSignUp = async () => {
        if (password !== confirmPassword) {
            setError("Passwords do not match")
            return
        }

        if (!firstname.trim() || !lastname.trim()) {
            setError("First name and last name are required")
            return
        }

        // Validate password strength
        const hasLength = password.length >= 8
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)
        const hasUpper = /[A-Z]/.test(password)
        const hasNumber = /[0-9]/.test(password)

        if (!hasLength || !hasSpecial || !hasUpper || !hasNumber) {
            setError("Please fulfill all password requirements")
            return
        }

        setLoading(true)
        setError(null)
        setMessage(null)

        // Create auth account first
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${location.origin}/auth/callback`,
            },
        })

        if (error) {
            setError(error.message)
            setLoading(false)
            return
        }

        if (data.user) {
            // Generate pseudo
            const pseudo = generatePseudoClient()
            setGeneratedPseudo(pseudo)
            setPendingUserId(data.user.id)

            // Show passphrase setup modal
            setShowPassphraseSetup(true)
            setLoading(false)
        }
    }

    const handlePassphraseComplete = async (passphrase: string) => {
        if (!pendingUserId) return

        setLoading(true)

        try {
            // Encrypt firstname and lastname
            const encryptedFirstname = await encryptText(firstname, passphrase)
            const encryptedLastname = await encryptText(lastname, passphrase)

            // Check pseudo uniqueness and create user profile
            const { error: profileError } = await supabase
                .from('users')
                .insert({
                    id: pendingUserId,
                    pseudo: generatedPseudo,
                    encrypted_firstname: encryptedFirstname,
                    encrypted_lastname: encryptedLastname,
                    creationdate: new Date().toISOString()
                })

            if (profileError) {
                // If pseudo is not unique, regenerate and try again
                if (profileError.code === '23505') { // Unique violation
                    const newPseudo = generatePseudoClient()
                    setGeneratedPseudo(newPseudo)
                    setError('Pseudo was not unique, please try again with the new one')
                    setLoading(false)
                    return
                }
                setError(profileError.message)
                setLoading(false)
                return
            }

            // Store passphrase in localStorage
            localStorage.setItem('userPassphrase', passphrase)

            setShowPassphraseSetup(false)
            setMessage('Account created successfully! Check your email for confirmation.')

            // Clear form
            setEmail('')
            setPassword('')
            setConfirmPassword('')
            setFirstname('')
            setLastname('')
            setPendingUserId(null)

        } catch (err) {
            setError('Failed to encrypt user data')
            console.error(err)
        }

        setLoading(false)
    }

    const handlePassphraseCancel = () => {
        setShowPassphraseSetup(false)
        setPendingUserId(null)
        setError('Signup cancelled. Please try again.')
    }

    const handleRegeneratePseudo = () => {
        const newPseudo = generatePseudoClient()
        setGeneratedPseudo(newPseudo)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (isSignUp) {
            await handleSignUp()
        } else {
            await handleLogin()
        }
    }

    // Password validation checks for UI
    const checks = {
        length: password.length >= 8,
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        upper: /[A-Z]/.test(password),
        number: /[0-9]/.test(password)
    }

    return (
        <>
            {showPassphraseSetup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={handlePassphraseCancel}></div>
                    <div className="relative z-10 max-w-2xl w-full mx-4">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-2xl mb-4">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Your Pseudo</h3>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex-1 p-3 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
                                    <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{generatedPseudo}</p>
                                </div>
                                <button
                                    onClick={handleRegeneratePseudo}
                                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
                                >
                                    Regenerate
                                </button>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                This pseudo will be displayed instead of your real name throughout the platform for anonymity.
                            </p>
                        </div>
                        <PassphraseSetup
                            userEmail={email}
                            onComplete={handlePassphraseComplete}
                            onCancel={handlePassphraseCancel}
                        />
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-4 p-6 border rounded-lg shadow-md w-full max-w-md bg-white dark:bg-slate-800 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white">
                    {isSignUp ? 'Create Account' : 'Welcome Back'}
                </h2>
                {error && <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">{error}</div>}
                {message && <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm">{message}</div>}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {isSignUp && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">First Name</label>
                                <input
                                    type="text"
                                    placeholder="John"
                                    value={firstname}
                                    onChange={(e) => setFirstname(e.target.value)}
                                    className="w-full p-2 border rounded text-slate-900 dark:bg-slate-900 dark:text-white dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Last Name</label>
                                <input
                                    type="text"
                                    placeholder="Doe"
                                    value={lastname}
                                    onChange={(e) => setLastname(e.target.value)}
                                    className="w-full p-2 border rounded text-slate-900 dark:bg-slate-900 dark:text-white dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                        <input
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-2 border rounded text-slate-900 dark:bg-slate-900 dark:text-white dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2 border rounded text-slate-900 dark:bg-slate-900 dark:text-white dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                        />
                    </div>

                    {isSignUp && (
                        <div className="text-xs space-y-1 p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-700">
                            <p className="font-medium text-slate-500 mb-2">Password must contain:</p>
                            <div className={`flex items-center gap-2 ${checks.length ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>
                                <span className="text-[10px]">{checks.length ? '●' : '○'}</span> At least 8 characters
                            </div>
                            <div className={`flex items-center gap-2 ${checks.upper ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>
                                <span className="text-[10px]">{checks.upper ? '●' : '○'}</span> At least one capital letter
                            </div>
                            <div className={`flex items-center gap-2 ${checks.number ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>
                                <span className="text-[10px]">{checks.number ? '●' : '○'}</span> At least one number
                            </div>
                            <div className={`flex items-center gap-2 ${checks.special ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>
                                <span className="text-[10px]">{checks.special ? '●' : '○'}</span> At least one special character
                            </div>
                        </div>
                    )}

                    {isSignUp && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirm Password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full p-2 border rounded text-slate-900 dark:bg-slate-900 dark:text-white dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                    )}

                    <div className="flex flex-col gap-3 mt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                        >
                            {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Login')}
                        </button>

                        <div className="text-center text-sm text-slate-600 dark:text-slate-400">
                            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsSignUp(!isSignUp)
                                    setError(null)
                                    setMessage(null)
                                }}
                                className="ml-1 text-blue-600 hover:underline font-medium focus:outline-none"
                            >
                                {isSignUp ? 'Login' : 'Sign Up'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </>
    )
}
