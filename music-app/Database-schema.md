# Music Practice App Database Schema

## Project Overview
**Application**: Music Practice App  
**Database**: PostgreSQL with Supabase  
**Purpose**: Track user practice sessions, recordings, and AI chat interactions  

## Database Schema

### Core Tables

#### 1. **profiles** (User Profiles)
```sql
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    total_practice_time INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    total_recordings INTEGER DEFAULT 0,
    preferences JSONB DEFAULT '{"defaultTempo": 120, "defaultTimeSignature": "4/4", "defaultSubdivision": 1}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Purpose**: Extends Supabase auth.users with practice statistics and user preferences  
**Key Features**:
- Links to Supabase authentication system
- Tracks cumulative practice data
- Stores user settings in JSONB format
- Auto-updates timestamp on modifications

#### 2. **practice_sessions** (Practice Tracking)
```sql
CREATE TABLE public.practice_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    session_type VARCHAR(50) NOT NULL, -- 'metronome', 'tuner', 'general'
    duration_seconds INTEGER NOT NULL,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Purpose**: Records individual practice sessions with different tools  
**Session Types**: metronome, tuner, general practice  
**Settings**: Stores tempo, time signature, and other session-specific data

#### 3. **recordings** (Audio Recordings)
```sql
CREATE TABLE public.recordings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    duration_seconds INTEGER NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Purpose**: Manages user audio recordings and metadata  
**Features**: User-defined titles, duration tracking, flexible metadata storage

#### 4. **chat_history** (AI Conversations)
```sql
CREATE TABLE public.chat_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    is_user_message BOOLEAN DEFAULT TRUE,
    ai_response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Purpose**: Stores AI chat conversations for music practice guidance  
**Structure**: Alternating user messages and AI responses with timestamps

## Security Implementation

### Row Level Security (RLS)
All tables implement comprehensive RLS policies:

```sql
-- Example policy structure
CREATE POLICY "Users can view their own data" ON table_name
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own data" ON table_name
    FOR INSERT WITH CHECK (auth.uid() = user_id);
```

**Security Features**:
- ✅ User data isolation
- ✅ Authentication required for all operations
- ✅ No cross-user data access
- ✅ Automatic user association

## Database Functions & Triggers

### 1. **Automatic Profile Creation**
```sql
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 2. **Timestamp Updates**
```sql
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';
```

## Performance Optimization

### Database Indexes
```sql
-- User-based queries
CREATE INDEX idx_practice_sessions_user_id ON practice_sessions(user_id);
CREATE INDEX idx_recordings_user_id ON recordings(user_id);
CREATE INDEX idx_chat_history_user_id ON chat_history(user_id);

-- Time-based queries
CREATE INDEX idx_practice_sessions_created_at ON practice_sessions(created_at);
CREATE INDEX idx_recordings_created_at ON recordings(created_at);
CREATE INDEX idx_chat_history_created_at ON chat_history(created_at);
```

## Data Analytics View

### User Statistics View
```sql
CREATE VIEW user_statistics AS
SELECT 
    p.id as user_id,
    p.total_practice_time,
    p.total_sessions,
    p.total_recordings,
    COUNT(DISTINCT ps.id) as session_count,
    COUNT(DISTINCT r.id) as recording_count,
    COALESCE(SUM(ps.duration_seconds), 0) as actual_practice_time
FROM profiles p
LEFT JOIN practice_sessions ps ON p.id = ps.user_id
LEFT JOIN recordings r ON p.id = r.user_id
GROUP BY p.id, p.total_practice_time, p.total_sessions, p.total_recordings;
```

## Entity Relationship Diagram

```
auth.users (Supabase Built-in)
    ↓ (1:1)
profiles
    ↓ (1:many)
    ├── practice_sessions
    ├── recordings
    └── chat_history
```

## Implementation Notes

### Database Platform
- **Primary**: PostgreSQL 14+ via Supabase
- **Authentication**: Supabase Auth (JWT-based)
- **Real-time**: Supabase Realtime for live updates
- **Storage**: Supabase Storage for audio files

### JSONB Usage
- **Flexible Schema**: Allows evolution without migrations
- **Complex Queries**: Support for JSON operations
- **Performance**: Indexed JSON queries for user preferences

### Scalability Considerations
- UUID primary keys for distributed systems
- Efficient indexing strategy for user-based queries
- Automatic cleanup via CASCADE deletes
- Optimized for mobile app usage patterns

## Setup Instructions

1. **Create Supabase Project**
2. **Execute Schema**: Run `database-schema-safe.sql`
3. **Verify Security**: Test RLS policies
4. **Configure Client**: Set up application connection
5. **Test Operations**: Verify CRUD operations work correctly

This schema provides a robust foundation for a music practice application with user authentication, practice tracking, recording management, and AI chat functionality.