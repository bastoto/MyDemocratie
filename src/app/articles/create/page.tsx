import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import CreateArticleForm from '@/components/CreateArticleForm'

export default async function CreateArticlePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return <CreateArticleForm />
}
