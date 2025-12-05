import { createClient } from '@/utils/supabase/server'
import { generateVoterHash } from './voting-hash'

export type ArticleSummary = {
    id: number
    title: string
    goal: string
    author_id: string
    author: {
        firstname: string
        lastname: string
    } | null
    statuschangedate: string
}

export interface ArticleStats {
    constitutional: {
        approved: ArticleSummary[]
        rejected: ArticleSummary[]
        ignored: ArticleSummary[]
        debateDurationVoting: ArticleSummary[]
        votingOpened: ArticleSummary[]
        debateOngoing: ArticleSummary[]
    }
    law: {
        approved: ArticleSummary[]
        rejected: ArticleSummary[]
        ignored: ArticleSummary[]
        debateDurationVoting: ArticleSummary[]
        votingOpened: ArticleSummary[]
        debateOngoing: ArticleSummary[]
    }
}

export type UserActivity = {
    lastVotes: any[]
    lastArticles: any[]
    lastComments: any[]
}

export async function getArticleStats(): Promise<ArticleStats> {
    const supabase = await createClient()

    // Fetch all articles with relevant statuses and details
    const { data: articles, error } = await supabase
        .from('articles')
        .select(`
            id, 
            title, 
            goal, 
            type, 
            status, 
            statuschangedate,
            author_id,
            users:author_id (firstname, lastname)
        `)
        .order('statuschangedate', { ascending: false })

    if (error || !articles) {
        console.error('Error fetching article stats:', error)
        const emptyCategory = { approved: [], rejected: [], ignored: [], debateDurationVoting: [], votingOpened: [], debateOngoing: [] }
        return {
            constitutional: { ...emptyCategory },
            law: { ...emptyCategory }
        }
    }

    const stats: ArticleStats = {
        constitutional: { approved: [], rejected: [], ignored: [], debateDurationVoting: [], votingOpened: [], debateOngoing: [] },
        law: { approved: [], rejected: [], ignored: [], debateDurationVoting: [], votingOpened: [], debateOngoing: [] }
    }

    articles.forEach(article => {
        const typeKey = article.type === 'constitutional' ? 'constitutional' : 'law'
        const summary: ArticleSummary = {
            id: article.id,
            title: article.title,
            goal: article.goal,
            author_id: article.author_id,
            author: article.users as any,
            statuschangedate: article.statuschangedate
        }

        switch (article.status) {
            case 'Approved':
                if (stats[typeKey].approved.length < 5) stats[typeKey].approved.push(summary)
                break
            case 'Rejected':
                if (stats[typeKey].rejected.length < 5) stats[typeKey].rejected.push(summary)
                break
            case 'Ignored':
                if (stats[typeKey].ignored.length < 5) stats[typeKey].ignored.push(summary)
                break
            case 'Debate Duration voting opened':
                if (stats[typeKey].debateDurationVoting.length < 5) stats[typeKey].debateDurationVoting.push(summary)
                break
            case 'Voting opened':
                if (stats[typeKey].votingOpened.length < 5) stats[typeKey].votingOpened.push(summary)
                break
            case 'Debate ongoing':
                if (stats[typeKey].debateOngoing.length < 5) stats[typeKey].debateOngoing.push(summary)
                break
        }
    })

    return stats
}

export async function getUserActivity(userId: string): Promise<UserActivity> {
    const supabase = await createClient()

    // Query voting_history by user_id
    // We return the hashed votevalue so the client can verify it against their passphrase
    const { data: lastVotes } = await supabase
        .from('voting_history')
        .select('*, articles(title)')
        .eq('user_id', userId)
        .order('votedate', { ascending: false })
        .limit(5)

    const { data: lastArticles } = await supabase
        .from('articles')
        .select('*')
        .eq('author_id', userId)
        .order('creationdate', { ascending: false })
        .limit(5)

    const { data: lastComments } = await supabase
        .from('messages')
        .select('*, topics(title)')
        .eq('author_id', userId)
        .order('creationdate', { ascending: false })
        .limit(5)

    return {
        lastVotes: lastVotes || [],
        lastArticles: lastArticles || [],
        lastComments: lastComments || []
    }
}
