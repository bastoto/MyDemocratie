'use server'

import { createClient } from '@/utils/supabase/server'

export async function createUserProfile(
    userId: string,
    pseudo: string,
    encryptedFirstname: string,
    encryptedLastname: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    // Verify the user is authenticated and matches the userId
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.id !== userId) {
        return { success: false, error: 'Unauthorized' }
    }

    // Insert user profile
    const { error } = await supabase
        .from('users')
        .insert({
            id: userId,
            pseudo: pseudo,
            encrypted_firstname: encryptedFirstname,
            encrypted_lastname: encryptedLastname,
            creationdate: new Date().toISOString()
        })

    if (error) {
        console.error('Error creating user profile:', error)

        // Check for unique constraint violation
        if (error.code === '23505') {
            return { success: false, error: 'Pseudo already taken, please regenerate' }
        }

        return { success: false, error: error.message }
    }

    return { success: true }
}
