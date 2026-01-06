-- Create the risk_assessments table for AI deletion risk assessment form
CREATE TABLE risk_assessments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    work_email VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    region VARCHAR(50) NOT NULL,
    ai_system_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_risk_assessments_work_email ON risk_assessments(work_email);
CREATE INDEX idx_risk_assessments_company ON risk_assessments(company);
CREATE INDEX idx_risk_assessments_region ON risk_assessments(region);
CREATE INDEX idx_risk_assessments_ai_system_type ON risk_assessments(ai_system_type);
CREATE INDEX idx_risk_assessments_created_at ON risk_assessments(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public insert (for form submissions)
CREATE POLICY "Allow public insert for risk assessments" ON risk_assessments
    FOR INSERT TO public WITH CHECK (true);

-- Create policy to allow authenticated users to view
CREATE POLICY "Allow authenticated users to view risk assessments" ON risk_assessments
    FOR SELECT TO authenticated USING (true);