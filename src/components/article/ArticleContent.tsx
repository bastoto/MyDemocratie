'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { updateArticleContent } from '@/lib/article-actions'

interface ArticleContentProps {
    articleId: number
    initialGoal: string
    initialContent: string
    isAuthor: boolean
    status: string
}

export default function ArticleContent({
    articleId,
    initialGoal,
    initialContent,
    isAuthor,
    status
}: ArticleContentProps) {
    const router = useRouter()
    const [isEditing, setIsEditing] = useState(false)
    const [goal, setGoal] = useState(initialGoal)
    const [loading, setLoading] = useState(false)

    const canEdit = isAuthor && status === 'Debate Duration voting opened'
    const showLockedMessage = isAuthor && status !== 'Debate Duration voting opened'

    console.log('ArticleContent - isAuthor:', isAuthor)
    console.log('ArticleContent - status:', status)
    console.log('ArticleContent - canEdit:', canEdit)

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [StarterKit],
        content: initialContent,
        editable: isEditing,
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl max-w-none focus:outline-none dark:prose-invert',
            },
        },
    })

    const handleSave = async () => {
        if (!editor) return
        setLoading(true)

        const result = await updateArticleContent(articleId, goal, editor.getHTML())

        if (result.success) {
            setIsEditing(false)
            editor.setEditable(false)
            // Force a refresh to show updated content
            router.refresh()
        } else {
            alert(result.error || 'Failed to save changes')
        }
        setLoading(false)
    }

    return (
        <div className="space-y-8">
            {/* Locked Message */}
            {showLockedMessage && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-lg text-amber-800 dark:text-amber-300 text-sm">
                    Editing is no longer available because the debate duration voting has ended.
                </div>
            )}

            {/* Edit Button */}
            {canEdit && !isEditing && (
                <div className="mb-6">
                    <button
                        onClick={() => {
                            setIsEditing(true)
                            editor?.setEditable(true)
                        }}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        Edit Article
                    </button>
                </div>
            )}

            {/* Goal Section */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Goal</h3>
                {isEditing ? (
                    <textarea
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        className="w-full p-3 border rounded-lg dark:bg-slate-800 dark:text-white dark:border-slate-600"
                        rows={3}
                    />
                ) : (
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        {goal}
                    </p>
                )}
            </div>

            {/* Content Section */}
            <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Description</h3>

                {/* Editor Toolbar - Only show when editing */}
                {isEditing && editor && (
                    <div className="border border-slate-300 dark:border-slate-700 rounded-t-lg bg-slate-50 dark:bg-slate-800 p-2 flex gap-1 flex-wrap">
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${editor.isActive('bold')
                                ? 'bg-blue-600 text-white'
                                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                                }`}
                        >
                            Bold
                        </button>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${editor.isActive('italic')
                                ? 'bg-blue-600 text-white'
                                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                                }`}
                        >
                            Italic
                        </button>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleStrike().run()}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${editor.isActive('strike')
                                ? 'bg-blue-600 text-white'
                                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                                }`}
                        >
                            Strike
                        </button>
                        <div className="w-px bg-slate-300 dark:bg-slate-600 mx-1"></div>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${editor.isActive('heading', { level: 2 })
                                ? 'bg-blue-600 text-white'
                                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                                }`}
                        >
                            H2
                        </button>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${editor.isActive('heading', { level: 3 })
                                ? 'bg-blue-600 text-white'
                                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                                }`}
                        >
                            H3
                        </button>
                        <div className="w-px bg-slate-300 dark:bg-slate-600 mx-1"></div>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleBulletList().run()}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${editor.isActive('bulletList')
                                ? 'bg-blue-600 text-white'
                                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                                }`}
                        >
                            Bullet List
                        </button>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleOrderedList().run()}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${editor.isActive('orderedList')
                                ? 'bg-blue-600 text-white'
                                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                                }`}
                        >
                            Ordered List
                        </button>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleBlockquote().run()}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${editor.isActive('blockquote')
                                ? 'bg-blue-600 text-white'
                                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                                }`}
                        >
                            Quote
                        </button>
                    </div>
                )}

                {/* Editor Content */}
                <div className={`${isEditing
                    ? 'border border-t-0 border-slate-300 dark:border-slate-700 rounded-b-lg bg-white dark:bg-slate-800 p-4'
                    : 'prose dark:prose-invert max-w-none'
                    }`}>
                    <EditorContent editor={editor} />
                </div>
            </div>

            {/* Save Actions */}
            {isEditing && (
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={() => {
                            setIsEditing(false)
                            setGoal(initialGoal)
                            editor?.commands.setContent(initialContent)
                            editor?.setEditable(false)
                        }}
                        className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            )}
        </div>
    )
}
