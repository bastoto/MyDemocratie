/**
 * Client-Side Vote Hash Utility
 * 
 * Uses hashing (not encryption) to anonymize vote values while allowing verification.
 * 
 * Flow:
 * 1. User clicks vote button - we know the value, increment counter immediately
 * 2. Store hash(passphrase + userId + articleId + voteValue) in database
 * 3. To verify what user voted: compute hashes for all possible values, compare with stored hash
 */

// Word lists for passphrase generation
const ADJECTIVES = [
    'swift', 'brave', 'calm', 'bold', 'keen', 'wise', 'fair', 'true',
    'cool', 'warm', 'soft', 'firm', 'deep', 'pure', 'rich', 'wild',
    'blue', 'gold', 'jade', 'ruby', 'mint', 'sage', 'rose', 'snow'
]

const NOUNS = [
    'tiger', 'eagle', 'wolf', 'bear', 'hawk', 'lion', 'deer', 'fox',
    'oak', 'pine', 'elm', 'fern', 'reed', 'palm', 'vine', 'moss',
    'river', 'storm', 'flame', 'stone', 'wave', 'wind', 'star', 'moon'
]

/**
 * Generate a random passphrase like "swift-tiger-42"
 */
export function generatePassphrase(): string {
    const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
    const number = Math.floor(Math.random() * 100)
    return `${adjective}-${noun}-${number}`
}

/**
 * Hash a vote value using SHA-256
 * Format: SHA256(passphrase + userId + articleId + voteValue)
 */
export async function hashVoteValue(
    passphrase: string,
    userId: string,
    articleId: number,
    voteValue: string
): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(`${passphrase}:${userId}:${articleId}:${voteValue}`)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Verify what value a user voted for by comparing with possible value hashes
 * @returns The matching vote value or null if no match
 */
export async function verifyVoteValue(
    passphrase: string,
    userId: string,
    articleId: number,
    storedHash: string,
    possibleValues: string[]
): Promise<string | null> {
    // Check for legacy plaintext votes
    if (possibleValues.includes(storedHash)) {
        return storedHash
    }

    for (const value of possibleValues) {
        const computedHash = await hashVoteValue(passphrase, userId, articleId, value)
        if (computedHash === storedHash) {
            return value
        }
    }
    return null
}

/**
 * Verify an approve/reject vote
 */
export async function verifyApproveRejectVote(
    passphrase: string,
    userId: string,
    articleId: number,
    storedHash: string
): Promise<'approve' | 'reject' | null> {
    const result = await verifyVoteValue(passphrase, userId, articleId, storedHash, ['approve', 'reject'])
    return result as 'approve' | 'reject' | null
}

/**
 * Verify a duration vote
 */
export async function verifyDurationVote(
    passphrase: string,
    userId: string,
    articleId: number,
    storedHash: string
): Promise<string | null> {
    const durations = [
        'One Month', 'Two Months', 'Three Months',
        'Four Month', 'Five Month', 'Six Month'
    ]
    return verifyVoteValue(passphrase, userId, articleId, storedHash, durations)
}

// LocalStorage key for storing passphrase
const PASSPHRASE_KEY = 'voting_passphrase'

/**
 * Get stored passphrase from localStorage
 */
export function getStoredPassphrase(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(PASSPHRASE_KEY)
}

/**
 * Store passphrase in localStorage
 */
export function storePassphrase(passphrase: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(PASSPHRASE_KEY, passphrase)
}

/**
 * Check if user has a passphrase set
 */
export function hasPassphrase(): boolean {
    return getStoredPassphrase() !== null
}

/**
 * Clear stored passphrase (for testing/logout)
 */
export function clearPassphrase(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(PASSPHRASE_KEY)
}
