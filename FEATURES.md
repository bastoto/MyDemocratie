# MyDemocratie - Feature Documentation

## User Anonymization System

### Overview
Complete user anonymization system with encrypted names, unique pseudonyms, and passphrase-based security.

### Signup Flow
1. User signs up with email, password, firstname, lastname
2. User receives confirmation email
3. User clicks confirmation link → redirected to home page
4. **ProfileSetupModal appears** with success message
5. User clicks "Get Started"
6. System generates secure passphrase (auto-copied, can email to self)
7. System generates unique pseudo (e.g., "BraveEagle1234") - user can regenerate
8. Names encrypted with passphrase, pseudo stored in database
9. Profile created, user can now access all features

### Key Components

#### ProfileSetupModal (`src/components/ProfileSetupModal.tsx`)
- Shows after email confirmation
- Displays success message: "Your account has been confirmed with success, we just need one more thing"
- Integrates PassphraseSetup component
- Generates and displays pseudo with regenerate option
- Encrypts names using `encryptText()` from `src/lib/encryption.ts`
- Creates user profile via `createUserProfile` server action

#### ProfileSetupChecker (`src/components/ProfileSetupChecker.tsx`)
- Client component that checks if user has profile
- Shows ProfileSetupModal if user confirmed email but no profile exists
- Integrated into home page

#### AuthForm (`src/components/AuthForm.tsx`)
- Simplified signup - only creates auth account with metadata
- Stores firstname/lastname in `user_metadata` temporarily
- No longer handles profile creation (moved to post-confirmation)

### Database Changes

#### Migrations
- `20251205_add_pseudo_and_encrypted_names.sql` - Added `pseudo`, `encrypted_firstname`, `encrypted_lastname` columns
- `20251205_drop_user_profile_trigger.sql` - Removed automatic profile creation trigger
- `20251205_users_rls_policies.sql` - RLS policies for users table (needs to be run)

#### Users Table Schema
```sql
- id (uuid, primary key)
- pseudo (text, unique) - Public display name
- encrypted_firstname (text) - AES-GCM encrypted
- encrypted_lastname (text) - AES-GCM encrypted
- creationdate (timestamp)
```

### Security Features

#### Encryption
- **Names**: AES-GCM encryption using user's passphrase
- **Votes**: SHA-256 hashing (not encryption) for verification
- **Passphrase**: Stored client-side in localStorage only
- **Recovery**: Email-to-self feature in PassphraseSetup

#### Access Control
- Action buttons hidden until profile is created
- "Create Article" button - hidden without profile
- Article creation page - redirects to home without profile
- VotingPanel - hidden without profile
- DebateSection - hidden without profile

### Display Features

#### Pseudo Display
All author displays now show `pseudo` instead of encrypted names:
- Article pages
- Stat cards on home page
- Topic lists
- Dashboard activity

#### "You" Badge
When viewing your own content, displays "You" in a yellow badge instead of your pseudo:
- **Styling**: Yellow background, rounded pill, semi-bold
- **Locations**: 
  - Article headers
  - Stat card lists
  - **Navbar** - Shows "You:" badge followed by pseudo badge (top right corner)
- **Logic**: Compares `author_id` with current `user.id`

### Pseudo Generation
- **Source**: `src/lib/pseudo-generator.ts`
- **Format**: Adjective + Noun + 4-digit number (e.g., "BraveEagle1234")
- **Combinations**: 300 adjectives × 300 nouns × 10,000 numbers = 900 million possibilities
- **Uniqueness**: Enforced by database unique constraint on `pseudo` column
- **Client function**: `generatePseudoClient()` for UI preview/regeneration
- **Server action**: `createUserProfile` handles uniqueness check and retry

### Server Actions

#### createUserProfile (`src/lib/user-actions.ts`)
```typescript
createUserProfile(
  userId: string,
  pseudo: string,
  encryptedFirstname: string,
  encryptedLastname: string
)
```
- Inserts user profile with encrypted data
- Handles pseudo uniqueness errors
- Uses server-side Supabase client for proper RLS context

### Important Notes

1. **Email Confirmation Required**: Users must confirm email before profile setup
2. **Passphrase Critical**: Without passphrase, user cannot decrypt their own name
3. **Pseudo is Public**: The only identifier shown throughout the platform
4. **RLS Migration**: Must run `20251205_users_rls_policies.sql` on Supabase
5. **Git Workflow**: Always commit after successful feature completion

### Files Modified

**Components:**
- `src/components/ProfileSetupModal.tsx` (new)
- `src/components/ProfileSetupChecker.tsx` (new)
- `src/components/AuthForm.tsx`
- `src/components/StatCard.tsx`
- `src/components/article/ArticleHeader.tsx`

**Pages:**
- `src/app/page.tsx`
- `src/app/articles/[id]/page.tsx`
- `src/app/articles/create/page.tsx`

**Libraries:**
- `src/lib/user-actions.ts` (new)
- `src/lib/pseudo-generator.ts`
- `src/lib/encryption.ts`
- `src/lib/article-actions.ts`
- `src/lib/dashboard-data.ts`
- `src/lib/debate-actions.ts`

**Migrations:**
- `supabase/migrations/20251205_add_pseudo_and_encrypted_names.sql`
- `supabase/migrations/20251205_drop_user_profile_trigger.sql`
- `supabase/migrations/20251205_users_rls_policies.sql`

### Next Steps
- Run RLS migration on Supabase
- Test full signup flow end-to-end
- Consider adding pseudo to more display locations if needed
