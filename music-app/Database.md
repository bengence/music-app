# Database Schema Documentation

## Overview
This document describes the PostgreSQL database schema for the Music Practice App, designed to work with Supabase for authentication and data management.

## Database Tables

### 1. profiles
**Purpose**: Extends the built-in auth.users table with additional user information and practice statistics.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, references auth.users(id) |
| `total_practice_time` | INTEGER | Total practice time in seconds (default: 0) |
| `total_sessions` | INTEGER | Total number of practice sessions (default: 0) |
| `total_recordings` | INTEGER | Total number of recordings made (default: 0) |
| `preferences` | JSONB | User settings (tempo, time signature, etc.) |
| `created_at` | TIMESTAMP | Account creation timestamp |
| `updated_at` | TIMESTAMP | Last profile update timestamp |

**Default Preferences**:
```json
{
  "defaultTempo": 120,
  "defaultTimeSignature": "4/4", 
  "defaultSubdivision": 1
}
```

### 2. practice_sessions
**Purpose**: Tracks individual practice sessions with metronome, tuner, or general practice.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `user_id` | UUID | Foreign key to auth.users(id) |
| `session_type` | VARCHAR(50) | Type: 'metronome', 'tuner', or 'general' |
| `duration_seconds` | INTEGER | Session length in seconds |
| `settings` | JSONB | Session-specific settings (tempo, time sig, etc.) |
| `created_at` | TIMESTAMP | Session start timestamp |

### 3. recordings
**Purpose**: Stores metadata for user audio recordings.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `user_id` | UUID | Foreign key to auth.users(id) |
| `title` | VARCHAR(255) | User-defined recording title |
| `duration_seconds` | INTEGER | Recording length in seconds |
| `metadata` | JSONB | Additional info (format, quality, etc.) |
| `created_at` | TIMESTAMP | Recording creation timestamp |

### 4. chat_history
**Purpose**: Stores AI chat conversation history for each user.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `user_id` | UUID | Foreign key to auth.users(id) |
| `message` | TEXT | User's message to AI |
| `is_user_message` | BOOLEAN | True for user messages, false for AI responses |
| `ai_response` | TEXT | AI's response to the message |
| `created_at` | TIMESTAMP | Message timestamp |

## Security Features

### Row Level Security (RLS)
All tables have RLS enabled with policies ensuring:
- Users can only view, insert, update, and delete their own data
- Authentication is required for all operations
- No cross-user data access is possible

### Access Policies
Each table has comprehensive policies for:
- **SELECT**: Users can view their own records
- **INSERT**: Users can create records linked to their account
- **UPDATE**: Users can modify their own records
- **DELETE**: Users can remove their own records

## Database Indexes

Performance indexes are created on frequently queried columns:

```sql
-- Practice sessions
idx_practice_sessions_user_id
idx_practice_sessions_created_at

-- Recordings  
idx_recordings_user_id
idx_recordings_created_at

-- Chat history
idx_chat_history_user_id
idx_chat_history_created_at
```

## Triggers and Functions

### Automatic Profile Creation
- **Function**: `handle_new_user()`
- **Trigger**: `on_auth_user_created`
- **Purpose**: Automatically creates a profile record when a user registers

### Timestamp Updates
- **Function**: `update_updated_at_column()`
- **Trigger**: `update_profiles_updated_at`
- **Purpose**: Updates the `updated_at` field in profiles table on modifications

## Views

### user_statistics
Aggregated view providing user statistics:

```sql
SELECT 
    user_id,
    total_practice_time,
    total_sessions,
    total_recordings,
    session_count,
    recording_count,
    actual_practice_time
FROM user_statistics
WHERE user_id = auth.uid();
```

## Setup Instructions

1. **Navigate to Supabase SQL Editor**
2. **Execute the schema file**: `database-schema-safe.sql`
3. **Verify tables creation** in Table Editor
4. **Test authentication** and data operations
5. **Monitor logs** for any issues

## Data Relationships

```
auth.users (Supabase built-in)
    ↓ (1:1)
profiles
    ↓ (1:many)
├── practice_sessions
├── recordings  
└── chat_history
```

## Storage Considerations

- **JSONB fields** allow flexible schema evolution
- **UUID primary keys** ensure uniqueness and performance
- **Timestamps** enable audit trails and data analysis
- **Indexes** optimize query performance for user-specific data

## Backup and Maintenance

- Supabase handles automated backups
- Regular monitoring of table sizes recommended
- Consider archiving old chat_history and practice_sessions data
- Monitor JSONB field sizes for performance optimization