'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createTopic(
    debatespaceId: number,
    title: string,
    firstMessage: string,
    userId: string,
    category: string
): Promise<{ success: boolean; topicId?: number; error?: string }> {
    const supabase = await createClient()

    if (!userId) {
        return { success: false, error: 'You must be logged in to create a topic' }
    }

    if (!title.trim()) {
        return { success: false, error: 'Title is required' }
    }

    if (!firstMessage.trim()) {
        return { success: false, error: 'Message is required' }
    }

    if (!category) {
        return { success: false, error: 'Category is required' }
    }

    // Create the topic
    const { data: topic, error: topicError } = await supabase
        .from('topics')
        .insert({
            debatespace_id: debatespaceId,
            title: title.trim(),
            category: category,
            author_id: userId,
            creationdate: new Date().toISOString(),
            lastupdate: new Date().toISOString()
        })
        .select()
        .single()

    if (topicError || !topic) {
        console.error('Error creating topic:', topicError)
        return { success: false, error: 'Failed to create topic' }
    }

    // Create the first message
    const { error: messageError } = await supabase
        .from('messages')
        .insert({
            topic_id: topic.id,
            author_id: userId,
            content: firstMessage.trim(),
            creationdate: new Date().toISOString()
        })

    if (messageError) {
        console.error('Error creating first message:', messageError)
        // Rollback: delete the topic
        await supabase.from('topics').delete().eq('id', topic.id)
        return { success: false, error: 'Failed to create first message' }
    }

    revalidatePath(`/articles/[id]`, 'page')
    return { success: true, topicId: topic.id }
}

export async function getTopics(
    debatespaceId: number,
    page: number = 1,
    search: string = '',
    sortBy: 'lastupdate' | 'creationdate' = 'lastupdate'
) {
    const supabase = await createClient()
    const pageSize = 10
    const offset = (page - 1) * pageSize

    let query = supabase
        .from('topics')
        .select(`
            id,
            title,
            category,
            creationdate,
            lastupdate,
            author_id,
            users:author_id (pseudo),
            messages (count)
        `, { count: 'exact' })
        .eq('debatespace_id', debatespaceId)

    // Apply search filter
    if (search.trim()) {
        query = query.or(`title.ilike.%${search}%,users.firstname.ilike.%${search}%,users.lastname.ilike.%${search}%`)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: false })

    // Apply pagination
    query = query.range(offset, offset + pageSize - 1)

    const { data: topics, error, count } = await query

    if (error) {
        console.error('Error fetching topics:', error)
        return { topics: [], total: 0, error: error.message }
    }

    // Transform data to include message count
    const transformedTopics = topics?.map(topic => ({
        id: topic.id,
        title: topic.title,
        category: topic.category,
        creationdate: topic.creationdate,
        lastupdate: topic.lastupdate,
        author_id: topic.author_id,
        author: topic.users as any,
        messageCount: Array.isArray(topic.messages) ? topic.messages.length : 0
    })) || []

    return {
        topics: transformedTopics,
        total: count || 0,
        error: null
    }
}

export async function getDebateSpace(articleId: number) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('debatespaces')
        .select('id')
        .eq('article_id', articleId)
        .maybeSingle()

    if (error) {
        console.error('Error fetching debate space:', error)
        return null
    }

    return data
}

export async function createMessage(
    topicId: number,
    content: string,
    userId: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    if (!userId) {
        return { success: false, error: 'You must be logged in to post a message' }
    }

    if (!content.trim()) {
        return { success: false, error: 'Message content is required' }
    }

    const { error } = await supabase
        .from('messages')
        .insert({
            topic_id: topicId,
            author_id: userId,
            content: content.trim(),
            creationdate: new Date().toISOString()
        })

    if (error) {
        console.error('Error creating message:', error)
        return { success: false, error: 'Failed to post message' }
    }

    // Update topic's lastupdate
    await supabase
        .from('topics')
        .update({ lastupdate: new Date().toISOString() })
        .eq('id', topicId)

    revalidatePath(`/articles/[id]`, 'page')
    return { success: true }
}
