/**
 * Voting Hash Utility
 * 
 * Provides cryptographic hashing for anonymous voting.
 * Uses SHA-256 to create one-way hashes of voter identities.
 */

import crypto from 'crypto'

/**
 * Generates an anonymous voter hash using SHA-256
 * 
 * Format: SHA256(userId + articleId + voteType + secretSalt)
 * 
 * This ensures:
 * - Same user voting on same article produces same hash (duplicate detection)
 * - Different articles produce different hashes (no cross-article tracking)
 * - Hash is non-reversible (complete anonymity)
 * 
 * @param userId - The user's UUID
 * @param articleId - The article ID being voted on
 * @param voteType - Type of vote ('Debate_Duration_voting' or 'Voting_opened')
 * @returns 64-character hex string (SHA-256 hash)
 * @throws Error if VOTING_SECRET_SALT is not configured
 */
export function generateVoterHash(
    userId: string,
    articleId: number,
    voteType: 'Debate_Duration_voting' | 'Voting_opened'
): string {
    const salt = process.env.VOTING_SECRET_SALT

    if (!salt) {
        throw new Error('VOTING_SECRET_SALT environment variable is not configured')
    }

    // Combine all inputs with the secret salt
    const input = `${userId}:${articleId}:${voteType}:${salt}`

    // Generate SHA-256 hash
    const hash = crypto.createHash('sha256').update(input).digest('hex')

    return hash
}
