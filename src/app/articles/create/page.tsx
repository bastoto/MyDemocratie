import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import CreateArticleForm from '@/components/CreateArticleForm'

export default async function CreateArticlePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Check if user has profile
    const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

    if (!profile) {
        redirect('/') // Redirect to home where ProfileSetupModal will appear
    }

    return <CreateArticleForm />
}
