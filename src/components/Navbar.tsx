import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'

export default async function Navbar() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    return (
        <nav className="w-full flex justify-center border-b border-slate-200 dark:border-slate-800 h-16 bg-white dark:bg-slate-950 shadow-sm">
            <div className="w-full max-w-7xl flex justify-between items-center px-6 text-sm">
                <div className="flex items-center gap-8">
                    <Link href="/" className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">
                        Democratic Dashboard
                    </Link>
                    <div className="hidden md:flex gap-6">
                        <Link href="/" className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 font-medium transition-colors">
                            Dashboard
                        </Link>
                        <Link href="/constitution" className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 font-medium transition-colors">
                            Constitution
                        </Link>
                        <Link href="/laws" className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 font-medium transition-colors">
                            Laws
                        </Link>
                    </div>
                </div>
                <div className="flex gap-4 items-center">
                    {user ? (
                        <div className="flex gap-4 items-center">
                            <span className="hidden sm:inline text-slate-600 dark:text-slate-300 font-medium">{user.email}</span>
                            <form action="/auth/signout" method="post">
                                <button className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-md px-4 py-2 text-slate-900 dark:text-white transition-all text-xs font-semibold uppercase tracking-wide">
                                    Logout
                                </button>
                            </form>
                        </div>
                    ) : (
                        <Link
                            href="/login"
                            className="bg-blue-700 hover:bg-blue-800 rounded-md px-5 py-2 text-white transition-all font-semibold shadow-sm"
                        >
                            Login
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    )
}
