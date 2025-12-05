import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getArticle, getConstitutionalArticleCount, getUserVote, getFirstVoteDate } from '@/lib/article-actions'
import { getDebateSpace } from '@/lib/debate-actions'
import ArticleHeader from '@/components/article/ArticleHeader'
import ArticleContent from '@/components/article/ArticleContent'
import DebateSection from '@/components/article/DebateSection'
import VotingPanel from '@/components/article/VotingPanel'

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const article = await getArticle(id)

    if (!article) {
        notFound()
    }

    const constitutionalCount = await getConstitutionalArticleCount()
    const userVote = user ? await getUserVote(article.id, user.id) : null

    // Fetch first vote date if needed for countdown
    let firstVoteDate = null
    if (article.status === 'Debate Duration voting opened') {
        firstVoteDate = await getFirstVoteDate(article.id)
    }

    // Fetch debate space
    const debateSpace = await getDebateSpace(article.id)

    // Check if user has profile
    let hasProfile = false
    if (user) {
        const { data: profile } = await supabase
            .from('users')
            .select('id')
            .eq('id', user.id)
            .maybeSingle()
        hasProfile = !!profile
    }

    // Prepare data for voting panel
    const durationResults = article.debate_duration_voting_opened_result
    const votingResults = article.voting_opened_result
    const votedDuration = durationResults?.voted_debate_duration

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Content Column */}
                    <div className="lg:col-span-2 space-y-8">
                        <ArticleHeader
                            title={article.title}
                            type={article.type}
                            category={article.category}
                            status={article.status}
                            officialNumber={article.official_article_number}
                            constitutionalCount={constitutionalCount}
                            creationDate={article.creationdate}
                            authorName={`${article.author?.firstname || ''} ${article.author?.lastname || ''}`.trim() || 'Unknown Author'}
                        />

                        <ArticleContent
                            articleId={article.id}
                            initialGoal={article.goal}
                            initialContent={article.content}
                            isAuthor={user?.id === article.author_id}
                            status={article.status}
                        />

                        {/* Voting Panel - Mobile Only (appears after article content) */}
                        {hasProfile && (
                            <div className="lg:hidden">
                                <VotingPanel
                                    articleId={article.id}
                                    status={article.status}
                                    userVote={userVote}
                                    durationResults={durationResults}
                                    votingResults={votingResults}
                                    votedDuration={votedDuration}
                                    statusChangedDate={article.statuschangedate}
                                    firstVoteDate={firstVoteDate}
                                    userId={user?.id}
                                    userEmail={user?.email}
                                />
                            </div>
                        )}

                        {debateSpace && hasProfile && (
                            <DebateSection
                                debatespaceId={debateSpace.id}
                                userId={user?.id}
                            />
                        )}
                    </div>

                    {/* Sidebar Column - Desktop/Tablet Only */}
                    {hasProfile && (
                        <div className="hidden lg:block lg:col-span-1">
                            <div className="sticky top-8">
                                <VotingPanel
                                    articleId={article.id}
                                    status={article.status}
                                    userVote={userVote}
                                    durationResults={durationResults}
                                    votingResults={votingResults}
                                    votedDuration={votedDuration}
                                    statusChangedDate={article.statuschangedate}
                                    firstVoteDate={firstVoteDate}
                                    userId={user?.id}
                                    userEmail={user?.email}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
