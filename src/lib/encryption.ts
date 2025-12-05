// Encryption utilities for user data and votes
// Uses Web Crypto API for secure encryption

// Hash a vote value with passphrase (for vote anonymization)
export async function hashVoteValue(value: string, passphrase: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(value + passphrase)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return hashHex
}

// Verify a vote value against its hash
export async function verifyVoteValue(value: string, hash: string, passphrase: string): Promise<boolean> {
    const computedHash = await hashVoteValue(value, passphrase)
    return computedHash === hash
}

// Encrypt text (for firstname/lastname)
export async function encryptText(text: string, passphrase: string): Promise<string> {
    const encoder = new TextEncoder()

    // Derive key from passphrase
    const passphraseKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(passphrase),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
    )

    // Generate salt
    const salt = crypto.getRandomValues(new Uint8Array(16))

    // Derive encryption key
    const key = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        passphraseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
    )

    // Generate IV
    const iv = crypto.getRandomValues(new Uint8Array(12))

    // Encrypt
    const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encoder.encode(text)
    )

    // Combine salt + iv + encrypted data
    const encryptedArray = new Uint8Array(encryptedBuffer)
    const result = new Uint8Array(salt.length + iv.length + encryptedArray.length)
    result.set(salt, 0)
    result.set(iv, salt.length)
    result.set(encryptedArray, salt.length + iv.length)

    // Convert to base64
    return btoa(String.fromCharCode(...result))
}

// Decrypt text (for firstname/lastname)
export async function decryptText(encryptedText: string, passphrase: string): Promise<string> {
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    // Decode from base64
    const encryptedData = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0))

    // Extract salt, iv, and encrypted data
    const salt = encryptedData.slice(0, 16)
    const iv = encryptedData.slice(16, 28)
    const encrypted = encryptedData.slice(28)

    // Derive key from passphrase
    const passphraseKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(passphrase),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
    )

    // Derive decryption key
    const key = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        passphraseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
    )

    // Decrypt
    const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encrypted
    )

    return decoder.decode(decryptedBuffer)
}

// Verify approve/reject vote
export async function verifyApproveRejectVote(
    hashedValue: string,
    passphrase: string
): Promise<'approve' | 'reject' | null> {
    const approveMatch = await verifyVoteValue('approve', hashedValue, passphrase)
    if (approveMatch) return 'approve'

    const rejectMatch = await verifyVoteValue('reject', hashedValue, passphrase)
    if (rejectMatch) return 'reject'

    return null
}

// Verify duration vote
export async function verifyDurationVote(
    hashedValue: string,
    passphrase: string
): Promise<string | null> {
    const durations = ['One Month', 'Two Months', 'Three Months', 'Four Month', 'Five Month', 'Six Month']

    for (const duration of durations) {
        const match = await verifyVoteValue(duration, hashedValue, passphrase)
        if (match) return duration
    }

    return null
}
