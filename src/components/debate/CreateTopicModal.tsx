'use client'

import { useState } from 'react'
import { createTopic } from '@/lib/debate-actions'
import { useRouter } from 'next/navigation'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'

interface CreateTopicModalProps {
    debatespaceId: number
    userId: string
    onClose: () => void
    onSuccess: () => void
}

export default function CreateTopicModal({ debatespaceId, userId, onClose, onSuccess }: CreateTopicModalProps) {
    const router = useRouter()
    const [title, setTitle] = useState('')
    const [category, setCategory] = useState<string>('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [editorContent, setEditorContent] = useState('')

    // TipTap editor for message
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Start the discussion with your first message...',
            }),
        ],
        content: '',
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg mx-auto focus:outline-none min-h-[200px] p-4',
            },
        },
        onUpdate: ({ editor }) => {
            setEditorContent(editor.getText())
        },
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!editor) return

        const messageHtml = editor.getHTML()
        const messagePlainText = editor.getText()

        if (messagePlainText.trim().length === 0) {
            setError('Message is required')
            return
        }

        if (!category) {
            setError('Category is required')
            return
        }

        setLoading(true)

        const result = await createTopic(debatespaceId, title, messageHtml, userId, category)

        if (result.success) {
            onSuccess()
            router.refresh()
            onClose()
        } else {
            setError(result.error || 'Failed to create topic')
        }

        setLoading(false)
    }

    const messageLength = editorContent.length

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Create New Topic
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Title Field */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Topic Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full p-3 border rounded-lg text-slate-900 dark:bg-slate-800 dark:text-white dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Enter a descriptive title for your topic"
                            maxLength={200}
                            required
                        />
                        <div className="mt-1 text-xs text-slate-500 text-right">
                            {title.length}/200
                        </div>
                    </div>

                    {/* Category Field */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Category <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full p-3 border rounded-lg text-slate-900 dark:bg-slate-800 dark:text-white dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                        >
                            <option value="">Select a category</option>
                            <option value="Approval">Approval</option>
                            <option value="Reject">Reject</option>
                            <option value="Doubt">Doubt</option>
                            <option value="Improvement">Improvement</option>
                        </select>
                    </div>

                    {/* Message Field with WYSIWYG */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Your Message <span className="text-red-500">*</span>
                        </label>

                        {/* Editor Toolbar */}
                        {editor && (
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
                        <div className="border border-t-0 border-slate-300 dark:border-slate-700 rounded-b-lg bg-white dark:bg-slate-800 dark:text-white">
                            <EditorContent editor={editor} />
                        </div>

                        <div className="mt-1 text-xs text-slate-500 text-right">
                            {messageLength} characters
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            disabled={loading || !title.trim() || !category || messageLength === 0}
                        >
                            {loading && (
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            {loading ? 'Creating...' : 'Create Topic'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
