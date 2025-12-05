import { createClient } from '@/utils/supabase/server'
import { StatCard } from '@/components/StatCard'
import UrgentVotingSection from '@/components/UrgentVotingSection'
import ActivityPanel from '@/components/ActivityPanel'
import ProfileSetupChecker from '@/components/ProfileSetupChecker'
import { getArticleStats, getUserActivity } from '@/lib/dashboard-data'
import { getUrgentVotingArticles } from '@/lib/article-actions'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const stats = await getArticleStats()
  const urgentArticles = await getUrgentVotingArticles()

  let userActivity = null
  let hasProfile = false

  if (user) {
    userActivity = await getUserActivity(user.id)

    // Check if user has a profile in the users table
    const { data: profile } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    hasProfile = !!profile
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Profile Setup Modal for new users */}
      {user && (
        <ProfileSetupChecker
          userId={user.id}
          userEmail={user.email || ''}
          userMetadata={user.user_metadata}
          hasProfile={hasProfile}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Urgent Voting Section */}
        <UrgentVotingSection articles={urgentArticles} />

        {/* Welcome Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Welcome to MyDemocratie
              </h1>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl">
                Participate in the democratic process. Review articles, debate proposals, and cast your vote to shape the future of our constitution.
              </p>
            </div>
            {user && hasProfile && (
              <Link
                href="/articles/create"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-sm hover:shadow-md flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Create Article
              </Link>
            )}
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Constitutional Articles */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
              Constitutional Articles
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <StatCard
                label="Approved"
                articles={stats.constitutional.approved}
                color="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                userId={user?.id}
              />
              <StatCard
                label="Rejected"
                articles={stats.constitutional.rejected}
                color="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                userId={user?.id}
              />
              <StatCard
                label="Ignored"
                articles={stats.constitutional.ignored}
                color="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
                userId={user?.id}
              />
              <StatCard
                label="In Debate"
                articles={stats.constitutional.debateOngoing}
                color="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                userId={user?.id}
              />
              <StatCard
                label="Voting Open"
                articles={stats.constitutional.votingOpened}
                color="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
                userId={user?.id}
              />
              <StatCard
                label="Duration Voting"
                articles={stats.constitutional.debateDurationVoting}
                color="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                userId={user?.id}
              />
            </div>
          </div>

          {/* Law Articles */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-8 bg-emerald-600 rounded-full"></span>
              Law Articles
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <StatCard
                label="Approved"
                articles={stats.law.approved}
                color="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                userId={user?.id}
              />
              <StatCard
                label="Rejected"
                articles={stats.law.rejected}
                color="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                userId={user?.id}
              />
              <StatCard
                label="Ignored"
                articles={stats.law.ignored}
                color="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
                userId={user?.id}
              />
              <StatCard
                label="In Debate"
                articles={stats.law.debateOngoing}
                color="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                userId={user?.id}
              />
              <StatCard
                label="Voting Open"
                articles={stats.law.votingOpened}
                color="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
                userId={user?.id}
              />
              <StatCard
                label="Duration Voting"
                articles={stats.law.debateDurationVoting}
                color="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                userId={user?.id}
              />
            </div>
          </div>
        </div>

        {/* User Activity Section */}
        {user && userActivity && (
          <div className="space-y-6 pt-8 border-t border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Your Activity</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ActivityPanel
                title="Last votes"
                items={userActivity.lastVotes}
                type="vote"
                userId={user.id}
              />
              <ActivityPanel
                title="Last articles created"
                items={userActivity.lastArticles}
                type="article"
                userId={user.id}
              />
              <ActivityPanel
                title="Last comments"
                items={userActivity.lastComments}
                type="comment"
                userId={user.id}
              />
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
