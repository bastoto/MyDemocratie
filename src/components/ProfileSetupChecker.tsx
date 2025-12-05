'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ProfileSetupModal from './ProfileSetupModal'

interface ProfileSetupCheckerProps {
    userId: string
    userEmail: string
    userMetadata: any
    hasProfile: boolean
}

export default function ProfileSetupChecker({
    userId,
    userEmail,
    userMetadata,
    hasProfile
}: ProfileSetupCheckerProps) {
    const [showModal, setShowModal] = useState(false)
    const router = useRouter()

    useEffect(() => {
        console.log('ProfileSetupChecker:', { userId, hasProfile, userMetadata })

        // Show modal if user is authenticated but doesn't have a profile
        // AND has firstname/lastname in metadata
        if (!hasProfile && userMetadata?.firstname && userMetadata?.lastname) {
            console.log('Showing profile setup modal')
            setShowModal(true)
        } else {
            console.log('Not showing modal:', {
                hasProfile,
                hasFirstname: !!userMetadata?.firstname,
                hasLastname: !!userMetadata?.lastname
            })
        }
    }, [hasProfile, userMetadata, userId])

    const handleComplete = () => {
        setShowModal(false)
        router.refresh() // Refresh to load user profile
    }

    if (!showModal) return null

    return (
        <ProfileSetupModal
            userId={userId}
            userEmail={userEmail}
            firstname={userMetadata.firstname}
            lastname={userMetadata.lastname}
            onComplete={handleComplete}
        />
    )
}
