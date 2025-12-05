'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { createArticle, getConstitutionalArticleCount, type ArticleType, type ArticleCategory } from '@/lib/article-actions'
import { getNextConstitutionalArticleNumber, formatConstitutionalArticleDesignation } from '@/lib/article-utils'

const CATEGORIES: { value: ArticleCategory; label: string }[] = [
    { value: 'fundamental_rights', label: 'Fundamental Rights' },
    { value: 'governance', label: 'Governance' },
    { value: 'judiciary', label: 'Judiciary' },
    { value: 'economy_finance', label: 'Economy & Finance' },
    { value: 'defense_security', label: 'Defense & Security' },
    { value: 'environment', label: 'Environment' },
    { value: 'education_culture', label: 'Education & Culture' },
    { value: 'public_administration', label: 'Public Administration' },
    { value: 'amendments_procedures', label: 'Amendments & Procedures' },
    { value: 'miscellaneous_provisions', label: 'Miscellaneous Provisions' },
    { value: 'criminal_law', label: 'Criminal Law' },
    { value: 'civil_rights', label: 'Civil Rights' },
    { value: 'tax_legislation', label: 'Tax Legislation' },
    { value: 'healthcare_policy', label: 'Healthcare Policy' },
    { value: 'infrastructure_development', label: 'Infrastructure Development' },
]

export default function CreateArticleForm() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Form fields
    const [title, setTitle] = useState('')
    const [type, setType] = useState<ArticleType>('constitutional')
    const [category, setCategory] = useState<ArticleCategory | ''>('')
    const [goal, setGoal] = useState('')

    // Constitutional article number
    const [constitutionalCount, setConstitutionalCount] = useState(0)

    // Track editor content for validation
    const [editorContent, setEditorContent] = useState('')

    // TipTap editor
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Write a detailed description of your article...',
            }),
        ],
        content: '',
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] p-4',
            },
        },
        onUpdate: ({ editor }) => {
            setEditorContent(editor.getText())
        },
    })

    // Load constitutional article count
    useEffect(() => {
        if (type === 'constitutional') {
            getConstitutionalArticleCount().then(setConstitutionalCount)
        }
    }, [type])

    // Get plain text from editor
    const plainTextDescription = editorContent

    // Validation states
    const titleValid = title.length >= 30 && title.length <= 200
    const categoryValid = category !== ''
    const goalValid = goal.length >= 30 && goal.length <= 500
    const descriptionValid = plainTextDescription.length >= 100 && plainTextDescription.length <= 3000

    const formValid = titleValid && categoryValid && goalValid && descriptionValid

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formValid || !editor) {
            setError('Please fix all validation errors before submitting')
            return
        }

        setLoading(true)
        setError(null)

        const result = await createArticle({
            title,
            type,
            category: category as ArticleCategory,
            goal,
            content: editor.getHTML()
        })

        if (result?.error) {
            setError(result.error)
            setLoading(false)
        }
        // If successful, the server action will redirect
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-800 p-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Create New Article</h1>
                <p className="text-slate-600 dark:text-slate-400 mb-8">
                    Propose a new {type === 'constitutional' ? 'constitutional article' : 'law'} for democratic review
                </p>

                {error && (
                    <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Title Field */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full p-3 border rounded-lg text-slate-900 dark:bg-slate-800 dark:text-white dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Enter a concise title for your article"
                            maxLength={200}
                        />
                        <div className="mt-2 flex items-center justify-between text-xs">
                            <div className={`flex items-center gap-2 ${titleValid ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>
                                <span>{titleValid ? '✓' : '○'}</span>
                                <span>30-200 characters required</span>
                            </div>
                            <span className={title.length < 30 ? 'text-red-500' : title.length > 200 ? 'text-red-500' : 'text-slate-500'}>
                                {title.length}/200
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Type Selector */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Type <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as ArticleType)}
                                className="w-full p-3 border rounded-lg text-slate-900 dark:bg-slate-800 dark:text-white dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="constitutional">Constitutional</option>
                                <option value="law">Law</option>
                            </select>
                        </div>

                        {/* Category Selector */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Category <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value as ArticleCategory)}
                                className="w-full p-3 border rounded-lg text-slate-900 dark:bg-slate-800 dark:text-white dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="" disabled>Select a category</option>
                                {CATEGORIES.map((cat) => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Constitutional Article Designation (conditional) */}
                    {type === 'constitutional' && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <label className="block text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                                Constitutional Article Designation
                            </label>
                            <div className="text-lg font-bold text-blue-700 dark:text-blue-400">
                                {formatConstitutionalArticleDesignation(getNextConstitutionalArticleNumber(constitutionalCount))}
                            </div>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                If approved, this article will be eligible to become {formatConstitutionalArticleDesignation(getNextConstitutionalArticleNumber(constitutionalCount))}
                            </p>
                        </div>
                    )}

                    {/* Goal Field */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Goal <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            className="w-full p-3 border rounded-lg text-slate-900 dark:bg-slate-800 dark:text-white dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            placeholder="Describe the main objective of this article"
                            rows={3}
                            maxLength={500}
                        />
                        <div className="mt-2 flex items-center justify-between text-xs">
                            <div className={`flex items-center gap-2 ${goalValid ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>
                                <span>{goalValid ? '✓' : '○'}</span>
                                <span>30-500 characters required</span>
                            </div>
                            <span className={goal.length < 30 ? 'text-red-500' : goal.length > 500 ? 'text-red-500' : 'text-slate-500'}>
                                {goal.length}/500
                            </span>
                        </div>
                    </div>

                    {/* Description Field (TipTap WYSIWYG) */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Description <span className="text-red-500">*</span>
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
                        <div className="border border-t-0 border-slate-300 dark:border-slate-700 rounded-b-lg bg-white dark:bg-slate-800 dark:text-white">
                            <EditorContent editor={editor} />
                        </div>

                        <div className="mt-2 flex items-center justify-between text-xs">
                            <div className={`flex items-center gap-2 ${descriptionValid ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>
                                <span>{descriptionValid ? '✓' : '○'}</span>
                                <span>100-3000 characters required</span>
                            </div>
                            <span className={plainTextDescription.length < 100 ? 'text-red-500' : plainTextDescription.length > 3000 ? 'text-red-500' : 'text-slate-500'}>
                                {plainTextDescription.length}/3000
                            </span>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-6 py-3 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!formValid || loading}
                            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold shadow-lg hover:shadow-xl"
                        >
                            {loading ? 'Creating Article...' : 'Create Article'}
                        </button>
                    </div>

                    {/* Validation Summary */}
                    {!formValid && (title || goal || plainTextDescription) && (
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                            <p className="text-sm font-medium text-amber-900 dark:text-amber-300 mb-2">
                                Please complete the following:
                            </p>
                            <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1">
                                {!titleValid && <li>• Title must be 30-200 characters</li>}
                                {!categoryValid && <li>• Please select a category</li>}
                                {!goalValid && <li>• Goal must be 30-500 characters</li>}
                                {!descriptionValid && <li>• Description must be 100-3000 characters</li>}
                            </ul>
                        </div>
                    )}
                </form>
            </div>

            <style jsx global>{`
        .ProseMirror {
          min-height: 200px;
          outline: none;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin-top: 0.5em;
          margin-bottom: 0.5em;
        }
        .ProseMirror h3 {
          font-size: 1.25em;
          font-weight: bold;
          margin-top: 0.5em;
          margin-bottom: 0.5em;
        }
        .ProseMirror ul, .ProseMirror ol {
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        .ProseMirror blockquote {
          border-left: 3px solid #cbd5e1;
          padding-left: 1em;
          margin: 0.5em 0;
          font-style: italic;
        }
      `}</style>
        </div>
    )
}
