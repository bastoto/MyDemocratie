import { ArticleType, ArticleCategory } from '@/lib/article-actions'
import { formatConstitutionalArticleDesignation, getNextConstitutionalArticleNumber, toRoman } from '@/lib/article-utils'

interface ArticleHeaderProps {
    title: string
    type: ArticleType
    category: ArticleCategory
    status: string
    officialNumber?: number | null
    constitutionalCount: number
    creationDate: string
    authorName: string
}

export default function ArticleHeader({
    title,
    type,
    category,
    status,
    officialNumber,
    constitutionalCount,
    creationDate,
    authorName
}: ArticleHeaderProps) {

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getCategoryLabel = (cat: string) => {
        return cat.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    }

    const getConstitutionalBadge = () => {
        if (type !== 'constitutional') return null

        if (status === 'Approved' && officialNumber) {
            return (
                <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-sm font-semibold border border-green-200 dark:border-green-800">
                    Official {formatConstitutionalArticleDesignation(toRoman(officialNumber))}
                </div>
            )
        }

        if (status === 'Rejected' || status === 'Ignored') {
            return null
        }

        // For other statuses (Draft, Debate, Voting), show potential number
        const potentialNumber = getNextConstitutionalArticleNumber(constitutionalCount)
        return (
            <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium border border-blue-200 dark:border-blue-800">
                Eligible to become {formatConstitutionalArticleDesignation(potentialNumber)}
            </div>
        )
    }

    return (
        <div className="space-y-4 mb-8">
            <div className="flex flex-wrap gap-3 items-center">
                {/* Type Badge */}
                <span className={`px-3 py-1 rounded-full text-sm font-semibold uppercase tracking-wider ${type === 'constitutional'
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                    : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                    }`}>
                    {type}
                </span>

                {/* Category Badge */}
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {getCategoryLabel(category)}
                </span>

                {/* Constitutional Status Badge */}
                {getConstitutionalBadge()}
            </div>

            <h1 className="text-4xl font-bold text-slate-900 dark:text-white leading-tight">
                {title}
            </h1>

            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <span>By {authorName === 'You' ? (
                    <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full text-xs font-semibold">
                        You
                    </span>
                ) : (
                    <span className="font-medium text-slate-900 dark:text-slate-200">{authorName}</span>
                )}</span>
                <span>•</span>
                <span>{formatDate(creationDate)}</span>
            </div>
        </div>
    )
}
