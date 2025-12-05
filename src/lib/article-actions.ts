'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { generateVoterHash } from './voting-hash'

export type ArticleType = 'constitutional' | 'law'

export type ArticleCategory =
    | 'fundamental_rights'
    | 'governance'
    | 'judiciary'
    | 'economy_finance'
    | 'defense_security'
    | 'environment'
    | 'education_culture'
    | 'public_administration'
    | 'amendments_procedures'
    | 'miscellaneous_provisions'
    | 'criminal_law'
    | 'civil_rights'
    | 'tax_legislation'
    | 'healthcare_policy'
    | 'infrastructure_development'

export async function getArticleTypeEnumValues(): Promise<ArticleType[]> {
    return ['constitutional', 'law']
}

export async function getConstitutionalArticleCount(): Promise<number> {
    const supabase = await createClient()

    const { count, error } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'constitutional')
        .eq('status', 'Approved')

    if (error) {
        console.error('Error fetching constitutional article count:', error)
        return 0
    }

    return count || 0
}

export async function createArticle(formData: {
    title: string
    type: ArticleType
    category: ArticleCategory
    goal: string
    content: string
}) {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
        return { error: 'You must be logged in to create an article' }
    }

    // Validate input
    if (formData.title.length < 30 || formData.title.length > 200) {
        return { error: 'Title must be between 30 and 200 characters' }
    }

    if (formData.goal.length < 30 || formData.goal.length > 500) {
        return { error: 'Goal must be between 30 and 500 characters' }
    }

    // Strip HTML tags for character count validation
    const plainTextContent = formData.content.replace(/<[^>]*>/g, '')
    if (plainTextContent.length < 100 || plainTextContent.length > 3000) {
        return { error: 'Description must be between 100 and 3000 characters' }
    }

    // Insert article
    const { data, error } = await supabase
        .from('articles')
        .insert({
            title: formData.title,
            type: formData.type,
            category: formData.category,
            goal: formData.goal,
            content: formData.content,
            status: 'Debate Duration voting opened',
            author_id: user.id,
            creationdate: new Date().toISOString(),
            statuschangedate: new Date().toISOString()
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating article:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        return { error: `Failed to create article: ${error.message}` }
    }

    // Create debate space for the article
    const { error: debateSpaceError } = await supabase
        .from('debatespaces')
        .insert({
            article_id: data.id,
            creationdate: new Date().toISOString()
        })

    if (debateSpaceError) {
        console.error('Error creating debate space:', debateSpaceError)
        // Don't fail the article creation if debate space fails
        // It can be created later
    }

    revalidatePath('/')
    redirect(`/articles/${data.id}`)
}

export async function getArticle(id: string) {
    const supabase = await createClient()

    console.log('Fetching article with id:', id)

    // First, try fetching just the article without joins
    const { data: article, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching article:', error)
        console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
        })
        return null
    }

    console.log('Article fetched successfully:', article)

    // Now fetch related data separately
    const { data: author } = await supabase
        .from('users')
        .select('pseudo')
        .eq('id', article.author_id)
        .single()

    const { data: durationResult } = await supabase
        .from('debate_duration_voting_opened_result')
        .select('*')
        .eq('article_id', id)
        .maybeSingle()

    const { data: votingResult } = await supabase
        .from('voting_opened_result')
        .select('*')
        .eq('article_id', id)
        .maybeSingle()

    return {
        ...article,
        author,
        debate_duration_voting_opened_result: durationResult,
        voting_opened_result: votingResult
    }
}

export async function getUserVote(articleId: number, userId: string) {
    const supabase = await createClient()

    if (!userId) return null

    // Query by user_id directly (new method)
    const { data: votes } = await supabase
        .from('voting_history')
        .select('*')
        .eq('article_id', articleId)
        .eq('user_id', userId)
        .order('votedate', { ascending: false })
        .limit(1)

    return votes && votes.length > 0 ? votes[0] : null
}

export async function getFirstVoteDate(articleId: number) {
    const supabase = await createClient()

    const { data } = await supabase
        .from('voting_history')
        .select('votedate')
        .eq('article_id', articleId)
        .eq('typevote', 'Debate_Duration_voting')
        .order('votedate', { ascending: true })
        .limit(1)
        .maybeSingle()

    return data?.votedate || null
}

export async function voteForDuration(articleId: number, duration: string, hashedValue: string, userId: string, oldDuration?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.id !== userId) return { error: 'You must be logged in to vote' }

    // 1. Check Article Status
    const { data: article } = await supabase
        .from('articles')
        .select('status')
        .eq('id', articleId)
        .single()

    if (!article || article.status !== 'Debate Duration voting opened') {
        return { error: 'Voting for duration is not open for this article' }
    }

    // 2. Check history for existing vote using user_id
    const { data: existingVote } = await supabase
        .from('voting_history')
        .select('*')
        .eq('article_id', articleId)
        .eq('user_id', userId)
        .eq('typevote', 'Debate_Duration_voting')
        .maybeSingle()

    // Map duration to column name
    const durationToColumn: Record<string, string> = {
        'One Month': 'votecount_one_month',
        'Two Months': 'votecount_two_months',
        'Three Months': 'votecount_three_months',
        'Four Month': 'votecount_four_months',
        'Five Month': 'votecount_five_months',
        'Six Month': 'votecount_six_months'
    }

    // 3. Update Logic
    if (existingVote) {
        if (!oldDuration) {
            return { error: 'Vote change requires old vote value for verification.' }
        }

        if (oldDuration === duration) {
            return { success: true } // No change
        }

        // Decrement old count
        const oldColumn = durationToColumn[oldDuration]
        console.log('voteForDuration: Decrementing old column', { oldDuration, oldColumn })
        if (oldColumn) {
            await supabase.rpc('decrement_counter', {
                table_name: 'debate_duration_voting_opened_result',
                row_id: articleId,
                column_name: oldColumn
            })
        }

        // Increment new count
        const newColumn = durationToColumn[duration]
        console.log('voteForDuration: Incrementing new column', { duration, newColumn })
        if (!newColumn) throw new Error('Invalid duration')

        await supabase.rpc('increment_counter', {
            table_name: 'debate_duration_voting_opened_result',
            row_id: articleId,
            column_name: newColumn
        })

        // Update history
        console.log('voteForDuration: Updating vote history')
        await supabase
            .from('voting_history')
            .update({
                votevalue: hashedValue, // Update with new hash
                votedate: new Date().toISOString()
            })
            .eq('id', existingVote.id)

    } else {
        console.log('voteForDuration: Creating new vote')
        // New vote

        const newColumn = durationToColumn[duration]
        if (!newColumn) throw new Error('Invalid duration')

        // Ensure the result row exists
        const { data: resultRow } = await supabase
            .from('debate_duration_voting_opened_result')
            .select('id')
            .eq('article_id', articleId)
            .maybeSingle()

        if (!resultRow) {
            await supabase.from('debate_duration_voting_opened_result').insert({ article_id: articleId })
        }

        // Increment using RPC
        const { error: rpcError } = await supabase.rpc('increment_counter', {
            table_name: 'debate_duration_voting_opened_result',
            row_id: articleId,
            column_name: newColumn
        })

        if (rpcError) {
            console.error('voteForDuration: RPC error:', rpcError)
            return { error: `Failed to increment counter: ${rpcError.message}` }
        }

        // Insert history with user_id and hashed vote value
        const voterHash = generateVoterHash(user.id, articleId, 'Debate_Duration_voting')
        const { error: insertError } = await supabase
            .from('voting_history')
            .insert({
                article_id: articleId,
                voter_id: voterHash,
                user_id: userId,
                typevote: 'Debate_Duration_voting',
                votevalue: hashedValue,
                votedate: new Date().toISOString()
            })

        if (insertError) {
            console.error('voteForDuration: INSERT ERROR:', insertError)
            return { error: `Failed to insert vote: ${insertError.message}` }
        }
    }

    // Recalculate winning duration
    // We can do this by fetching all counts and comparing
    const { data: finalCounts } = await supabase
        .from('debate_duration_voting_opened_result')
        .select('*')
        .eq('article_id', articleId)
        .single()

    if (finalCounts) {
        const durations = [
            { name: 'One Month', count: finalCounts.votecount_one_month },
            { name: 'Two Months', count: finalCounts.votecount_two_months },
            { name: 'Three Months', count: finalCounts.votecount_three_months },
            { name: 'Four Month', count: finalCounts.votecount_four_months },
            { name: 'Five Month', count: finalCounts.votecount_five_months },
            { name: 'Six Month', count: finalCounts.votecount_six_months },
        ]

        // Find max
        const winner = durations.reduce((prev, current) => (prev.count > current.count) ? prev : current)

        // Update winner
        await supabase
            .from('debate_duration_voting_opened_result')
            .update({ voted_debate_duration: winner.name })
            .eq('article_id', articleId)
    }

    revalidatePath(`/articles/${articleId}`)
    return { success: true }
}

export async function voteApproveReject(articleId: number, vote: 'approve' | 'reject', hashedValue: string, userId: string, oldVoteValue?: 'approve' | 'reject') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.id !== userId) return { error: 'You must be logged in to vote' }

    // 1. Check Article Status
    const { data: article } = await supabase
        .from('articles')
        .select('status')
        .eq('id', articleId)
        .single()

    if (!article || article.status !== 'Voting opened') {
        return { error: 'Voting is not open for this article' }
    }

    // 2. Check history for existing vote using user_id
    const { data: existingVote } = await supabase
        .from('voting_history')
        .select('*')
        .eq('article_id', articleId)
        .eq('user_id', userId)
        .eq('typevote', 'Voting_opened')
        .maybeSingle()

    // Ensure result row exists
    const { data: resultRow } = await supabase
        .from('voting_opened_result')
        .select('*')
        .eq('article_id', articleId)
        .maybeSingle()

    if (!resultRow) {
        await supabase.from('voting_opened_result').insert({ article_id: articleId })
    }

    // Fetch current counts again to be safe
    const { data: currentCounts } = await supabase
        .from('voting_opened_result')
        .select('*')
        .eq('article_id', articleId)
        .single()

    if (existingVote) {
        if (!oldVoteValue) {
            return { error: 'Vote change requires old vote value for verification.' }
        }

        if (oldVoteValue === vote) return { success: true }

        // Swap votes
        const updates: any = {}
        if (oldVoteValue === 'approve') updates.nb_approve = (currentCounts.nb_approve || 0) - 1
        else updates.nb_reject = (currentCounts.nb_reject || 0) - 1

        if (vote === 'approve') updates.nb_approve = (updates.nb_approve !== undefined ? updates.nb_approve : (currentCounts.nb_approve || 0)) + 1
        else updates.nb_reject = (updates.nb_reject !== undefined ? updates.nb_reject : (currentCounts.nb_reject || 0)) + 1

        await supabase
            .from('voting_opened_result')
            .update(updates)
            .eq('article_id', articleId)

        await supabase
            .from('voting_history')
            .update({
                votevalue: hashedValue, // Update with new hash
                votedate: new Date().toISOString()
            })
            .eq('id', existingVote.id)

    } else {
        // New vote
        const updates: any = {}
        if (vote === 'approve') updates.nb_approve = (currentCounts.nb_approve || 0) + 1
        else updates.nb_reject = (currentCounts.nb_reject || 0) + 1

        await supabase
            .from('voting_opened_result')
            .update(updates)
            .eq('article_id', articleId)

        // Insert history with user_id and hashed vote value
        const voterHash = generateVoterHash(user.id, articleId, 'Voting_opened')
        await supabase
            .from('voting_history')
            .insert({
                article_id: articleId,
                voter_id: voterHash,
                user_id: userId,
                typevote: 'Voting_opened',
                votevalue: hashedValue,
                votedate: new Date().toISOString()
            })
    }

    revalidatePath(`/articles/${articleId}`)
    return { success: true }
}

export async function updateArticleContent(articleId: number, goal: string, content: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    console.log('updateArticleContent called with:', { articleId, goalLength: goal.length, contentLength: content.length })

    if (!user) return { error: 'Unauthorized' }

    const { data: article } = await supabase
        .from('articles')
        .select('author_id, status')
        .eq('id', articleId)
        .single()

    if (!article) return { error: 'Article not found' }
    if (article.author_id !== user.id) return { error: 'You are not the author' }
    if (article.status !== 'Debate Duration voting opened') return { error: 'Editing is no longer allowed' }

    console.log('Attempting to update article...')

    const { data, error } = await supabase
        .from('articles')
        .update({ goal, content })
        .eq('id', articleId)
        .select()

    console.log('Update response:', { data, error })

    if (error) {
        console.error('Update error:', error)
        return { error: `Failed to update: ${error.message}` }
    }

    console.log('Article updated successfully!', data)

    revalidatePath(`/articles/${articleId}`)
    return { success: true }
}

export async function getUrgentVotingArticles() {
    const supabase = await createClient()

    const { data: articles, error } = await supabase
        .from('articles')
        .select(`
            id,
            title,
            type,
            status,
            statuschangedate,
            author:users!articles_author_id_fkey (
                pseudo
            ),
            debate_duration_voting_opened_result (
                voted_debate_duration
            )
        `)
        .in('status', ['Voting opened', 'Debate Duration voting opened'])
        .order('statuschangedate', { ascending: true })
        .limit(20) // Fetch more than needed, we'll filter client-side

    if (error) {
        console.error('Error fetching urgent articles:', error)
        return []
    }

    if (!articles) return []

    // Filter articles with less than 3 days remaining
    const now = new Date()
    const threeDaysInMs = 3 * 24 * 60 * 60 * 1000

    const urgentArticles = articles
        .map(article => {
            let deadline: Date

            if (article.status === 'Voting opened') {
                // 14 days from status change
                deadline = new Date(new Date(article.statuschangedate).getTime() + 14 * 24 * 60 * 60 * 1000)
            } else {
                // Debate Duration voting opened: 7 days from status change
                deadline = new Date(new Date(article.statuschangedate).getTime() + 7 * 24 * 60 * 60 * 1000)
            }

            const timeRemaining = deadline.getTime() - now.getTime()

            // Handle author which might be returned as an array or object depending on Supabase client typing
            const authorData = Array.isArray(article.author) ? article.author[0] : article.author

            return {
                id: article.id,
                title: article.title,
                type: article.type,
                status: article.status,
                statuschangedate: article.statuschangedate,
                author: authorData ? {
                    pseudo: authorData.pseudo
                } : null,
                deadline: deadline.toISOString(),
                timeRemaining
            }
        })
        .filter(article => article.timeRemaining > 0 && article.timeRemaining <= threeDaysInMs)
        .sort((a, b) => a.timeRemaining - b.timeRemaining) // Most urgent first
        .slice(0, 10) // Limit to 10

    return urgentArticles
}

/**
 * Transition a single article's status when its countdown expires.
 * This replicates the cron job logic but for a specific article.
 */
export async function transitionArticleStatus(articleId: number): Promise<{ success: boolean; newStatus?: string; error?: string }> {
    const supabase = await createClient()

    // Get the article's current status and related data
    const { data: article, error: articleError } = await supabase
        .from('articles')
        .select(`
            id,
            status,
            type,
            statuschangedate,
            debate_duration_voting_opened_result (
                voted_debate_duration,
                votecount_one_month,
                votecount_two_months,
                votecount_three_months,
                votecount_four_months,
                votecount_five_months,
                votecount_six_months
            ),
            voting_opened_result (
                nb_approve,
                nb_reject
            )
        `)
        .eq('id', articleId)
        .single()

    if (articleError || !article) {
        return { success: false, error: 'Article not found' }
    }

    const now = new Date()
    let newStatus: string | null = null
    let updateData: Record<string, unknown> = {}

    // Handle different status transitions
    if (article.status === 'Debate Duration voting opened') {
        // Get first vote date
        const { data: firstVote } = await supabase
            .from('voting_history')
            .select('votedate')
            .eq('article_id', articleId)
            .eq('typevote', 'Debate_Duration_voting')
            .order('votedate', { ascending: true })
            .limit(1)
            .single()

        if (firstVote) {
            const firstVoteDate = new Date(firstVote.votedate)
            const deadline = new Date(firstVoteDate.getTime() + 7 * 24 * 60 * 60 * 1000)

            if (now >= deadline) {
                // Determine winning duration
                const durationResult = Array.isArray(article.debate_duration_voting_opened_result)
                    ? article.debate_duration_voting_opened_result[0]
                    : article.debate_duration_voting_opened_result

                if (durationResult) {
                    const counts = {
                        'One Month': durationResult.votecount_one_month || 0,
                        'Two Months': durationResult.votecount_two_months || 0,
                        'Three Months': durationResult.votecount_three_months || 0,
                        'Four Month': durationResult.votecount_four_months || 0,
                        'Five Month': durationResult.votecount_five_months || 0,
                        'Six Month': durationResult.votecount_six_months || 0,
                    }

                    // Find winning duration (longest in case of tie)
                    const durations = ['Six Month', 'Five Month', 'Four Month', 'Three Months', 'Two Months', 'One Month'] as const
                    let winningDuration = 'One Month'
                    let maxVotes = 0

                    for (const dur of durations) {
                        if (counts[dur] >= maxVotes) {
                            maxVotes = counts[dur]
                            winningDuration = dur
                        }
                    }

                    // Update voted_debate_duration
                    await supabase
                        .from('debate_duration_voting_opened_result')
                        .update({ voted_debate_duration: winningDuration })
                        .eq('article_id', articleId)

                    newStatus = 'Debate ongoing'
                    updateData = { status: newStatus, statuschangedate: now.toISOString() }
                }
            }
        }
    } else if (article.status === 'Debate ongoing') {
        const durationResult = Array.isArray(article.debate_duration_voting_opened_result)
            ? article.debate_duration_voting_opened_result[0]
            : article.debate_duration_voting_opened_result

        if (durationResult?.voted_debate_duration && article.statuschangedate) {
            const durationDays: Record<string, number> = {
                'One Month': 30,
                'Two Months': 60,
                'Three Months': 90,
                'Four Month': 120,
                'Five Month': 150,
                'Six Month': 180,
            }

            const days = durationDays[durationResult.voted_debate_duration] || 30
            const deadline = new Date(new Date(article.statuschangedate).getTime() + days * 24 * 60 * 60 * 1000)

            if (now >= deadline) {
                newStatus = 'Voting opened'
                updateData = { status: newStatus, statuschangedate: now.toISOString() }
            }
        }
    } else if (article.status === 'Voting opened') {
        if (article.statuschangedate) {
            const deadline = new Date(new Date(article.statuschangedate).getTime() + 14 * 24 * 60 * 60 * 1000)

            if (now >= deadline) {
                const voteResult = Array.isArray(article.voting_opened_result)
                    ? article.voting_opened_result[0]
                    : article.voting_opened_result

                const approves = voteResult?.nb_approve || 0
                const rejects = voteResult?.nb_reject || 0

                newStatus = (approves + rejects === 0)
                    ? 'Ignored'
                    : (approves > rejects ? 'Approved' : 'Rejected')
                updateData = { status: newStatus, statuschangedate: now.toISOString() }

                // For constitutional articles being approved, assign official number
                if (article.type === 'constitutional' && newStatus === 'Approved') {
                    const { data: maxNumber } = await supabase
                        .from('articles')
                        .select('official_article_number')
                        .eq('type', 'constitutional')
                        .eq('status', 'Approved')
                        .not('official_article_number', 'is', null)
                        .order('official_article_number', { ascending: false })
                        .limit(1)
                        .single()

                    const nextNumber = (maxNumber?.official_article_number || 0) + 1
                    updateData.official_article_number = nextNumber
                }
            }
        }
    }

    if (newStatus && Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
            .from('articles')
            .update(updateData)
            .eq('id', articleId)

        if (updateError) {
            return { success: false, error: updateError.message }
        }

        revalidatePath(`/articles/${articleId}`)
        return { success: true, newStatus }
    }

    return { success: false, error: 'Article not ready for transition' }
}
