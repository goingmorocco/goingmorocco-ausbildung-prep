-- Supabase Migration: Initial Schema for Ausbildung Test Prep
-- Creates all necessary tables for user management, subscriptions, and test system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policies for users
CREATE POLICY "Users can view their own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    stripe_customer_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active', -- active, canceled, past_due, unpaid
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies for subscriptions
CREATE POLICY "Users can view their own subscriptions"
    ON public.subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions"
    ON public.subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
    ON public.subscriptions FOR UPDATE
    USING (auth.uid() = user_id);

-- Tests table
CREATE TABLE IF NOT EXISTS public.tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    test_type VARCHAR(50) NOT NULL, -- goethe_b1, goethe_b2, telc_b1_beruf, telc_b2_beruf, osd_b1, osd_b2
    level VARCHAR(10) NOT NULL, -- A1, A2, B1, B2, C1
    duration_minutes INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    passing_score INTEGER DEFAULT 60, -- percentage
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on tests
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;

-- Policies for tests
CREATE POLICY "Anyone can view active tests"
    ON public.tests FOR SELECT
    USING (is_active = TRUE);

-- Test questions table
CREATE TABLE IF NOT EXISTS public.test_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID REFERENCES public.tests(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL, -- multiple_choice, true_false, fill_in_blank, matching
    points INTEGER DEFAULT 1,
    explanation TEXT,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on test questions
ALTER TABLE public.test_questions ENABLE ROW LEVEL SECURITY;

-- Policies for test questions
CREATE POLICY "Anyone can view questions for active tests"
    ON public.test_questions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.tests WHERE tests.id = test_id AND tests.is_active = TRUE
    ));

-- Test answers table
CREATE TABLE IF NOT EXISTS public.test_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID REFERENCES public.test_questions(id) ON DELETE CASCADE,
    answer_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    explanation TEXT,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on test answers
ALTER TABLE public.test_answers ENABLE ROW LEVEL SECURITY;

-- Policies for test answers
CREATE POLICY "Anyone can view answers for active test questions"
    ON public.test_answers FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.test_questions
        JOIN public.tests ON test_questions.test_id = tests.id
        WHERE test_questions.id = question_id AND tests.is_active = TRUE
    ));

-- User test attempts table
CREATE TABLE IF NOT EXISTS public.user_test_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    test_id UUID REFERENCES public.tests(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    score DECIMAL(5,2), -- percentage
    passed BOOLEAN,
    time_taken_seconds INTEGER,
    answers JSONB, -- stores user's answers for review
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user test attempts
ALTER TABLE public.user_test_attempts ENABLE ROW LEVEL SECURITY;

-- Policies for user test attempts
CREATE POLICY "Users can view their own test attempts"
    ON public.user_test_attempts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own test attempts"
    ON public.user_test_attempts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own test attempts"
    ON public.user_test_attempts FOR UPDATE
    USING (auth.uid() = user_id);

-- Insert initial test data
INSERT INTO public.tests (title, description, test_type, level, duration_minutes, total_questions, passing_score) VALUES
('Goethe-Zertifikat B1', 'Official Goethe-Institut B1 German language certification', 'goethe_b1', 'B1', 65, 65, 60),
('Goethe-Zertifikat B2', 'Official Goethe-Institut B2 German language certification', 'goethe_b2', 'B2', 80, 70, 60),
('telc Deutsch B1 Beruf', 'telc German B1 for professional/vocational contexts', 'telc_b1_beruf', 'B1', 90, 100, 60),
('telc Deutsch B2 Beruf', 'telc German B2 for professional/vocational contexts', 'telc_b2_beruf', 'B2', 90, 100, 60),
('ÖSD Zertifikat B1', 'Österreichisches Sprachdiplom B1 German certification', 'osd_b1', 'B1', 90, 80, 60),
('ÖSD Zertifikat B2', 'Österreichisches Sprachdiplom B2 German certification', 'osd_b2', 'B2', 90, 80, 60)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_tests_type_level ON public.tests(test_type, level);
CREATE INDEX IF NOT EXISTS idx_test_questions_test_id ON public.test_questions(test_id);
CREATE INDEX IF NOT EXISTS idx_test_answers_question_id ON public.test_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_user_attempts_user_id ON public.user_test_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_attempts_test_id ON public.user_test_attempts(test_id);
CREATE INDEX IF NOT EXISTS idx_user_attempts_completed_at ON public.user_test_attempts(completed_at);

-- Comment on tables and columns
COMMENT ON TABLE public.users IS 'Extended user profiles';
COMMENT ON TABLE public.subscriptions IS 'Subscription and payment information';
COMMENT ON TABLE public.tests IS 'Available language proficiency tests';
COMMENT ON TABLE public.test_questions IS 'Questions for each test';
COMMENT ON TABLE public.test_answers IS 'Answer options for each question';
COMMENT ON TABLE public.user_test_attempts IS 'Records of users taking tests';