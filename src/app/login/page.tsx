import AuthForm from '@/components/AuthForm'

export default function LoginPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-slate-950">
            <AuthForm />
        </div>
    )
}
