-- Advisory board and governance tracking tables

-- Advisory board decisions log
CREATE TABLE public.board_decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  decision_date DATE NOT NULL,
  topic TEXT NOT NULL,
  decision TEXT NOT NULL,
  rationale TEXT NOT NULL,
  voting_record JSONB, -- Array of {member_id, vote: 'for'|'against'|'abstain'}
  meeting_minutes_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Conflict of interest disclosures
CREATE TABLE public.conflict_disclosures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id TEXT NOT NULL,
  disclosure_date DATE NOT NULL,
  conflict_description TEXT NOT NULL,
  mitigation_steps TEXT,
  reviewed_by_chair BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Press inquiries and responses
CREATE TABLE public.press_inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inquiry_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  journalist_name TEXT NOT NULL,
  journalist_organization TEXT,
  inquiry_type TEXT NOT NULL, -- 'data_request', 'interview', 'methodology', 'other'
  inquiry_text TEXT NOT NULL,
  response_text TEXT,
  assigned_to TEXT, -- Board member or staff
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'responded', 'follow_up'
  response_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Data access requests (for transparency)
CREATE TABLE public.data_access_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_name TEXT NOT NULL,
  requester_organization TEXT,
  requester_type TEXT NOT NULL, -- 'researcher', 'journalist', 'policymaker', 'public'
  request_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_requested TEXT NOT NULL,
  justification TEXT NOT NULL,
  access_granted BOOLEAN DEFAULT false,
  access_level TEXT, -- 'aggregated', 'anonymized', 'individual' (rare)
  board_approval_required BOOLEAN DEFAULT false,
  board_approval_date TIMESTAMP WITH TIME ZONE,
  board_approval_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Governance meeting minutes
CREATE TABLE public.governance_meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_date DATE NOT NULL,
  meeting_type TEXT NOT NULL, -- 'quarterly', 'special', 'emergency'
  attendees TEXT[] NOT NULL, -- Array of member IDs
  absentees TEXT[], -- Array of member IDs
  agenda_items TEXT[] NOT NULL,
  minutes_text TEXT NOT NULL,
  decisions_made TEXT[] NOT NULL,
  action_items JSONB, -- Array of {item, assigned_to, due_date}
  next_meeting_date DATE,
  minutes_approved BOOLEAN DEFAULT false,
  minutes_approval_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Platform principle adherence tracking
CREATE TABLE public.principle_adherence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  principle_category TEXT NOT NULL, -- 'independence', 'transparency', 'privacy', 'accuracy', 'accessibility'
  assessment_date DATE NOT NULL,
  adherence_score INTEGER NOT NULL CHECK (adherence_score >= 0 AND adherence_score <= 100),
  assessment_notes TEXT NOT NULL,
  assessed_by TEXT NOT NULL, -- Board member or external auditor
  improvement_areas TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_board_decisions_date ON public.board_decisions(decision_date DESC);
CREATE INDEX idx_board_decisions_topic ON public.board_decisions(topic);
CREATE INDEX idx_conflict_disclosures_member ON public.conflict_disclosures(member_id, disclosure_date DESC);
CREATE INDEX idx_press_inquiries_status ON public.press_inquiries(status, inquiry_date DESC);
CREATE INDEX idx_press_inquiries_journalist ON public.press_inquiries(journalist_organization, journalist_name);
CREATE INDEX idx_data_access_requests_type ON public.data_access_requests(requester_type, request_date DESC);
CREATE INDEX idx_data_access_requests_status ON public.data_access_requests(access_granted, board_approval_required);
CREATE INDEX idx_governance_meetings_date ON public.governance_meetings(meeting_date DESC);
CREATE INDEX idx_principle_adherence_category ON public.principle_adherence(principle_category, assessment_date DESC);

-- Enable RLS
ALTER TABLE public.board_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conflict_disclosures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.press_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.principle_adherence ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "System can manage board decisions"
ON public.board_decisions
FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view board decisions"
ON public.board_decisions
FOR SELECT
USING (auth.has_role('admin'));

CREATE POLICY "System can manage conflict disclosures"
ON public.conflict_disclosures
FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view conflict disclosures"
ON public.conflict_disclosures
FOR SELECT
USING (auth.has_role('admin'));

CREATE POLICY "System can manage press inquiries"
ON public.press_inquiries
FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Admins can manage press inquiries"
ON public.press_inquiries
FOR ALL
USING (auth.has_role('admin'));

CREATE POLICY "System can manage data access requests"
ON public.data_access_requests
FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Admins can manage data access requests"
ON public.data_access_requests
FOR ALL
USING (auth.has_role('admin'));

CREATE POLICY "System can manage governance meetings"
ON public.governance_meetings
FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view governance meetings"
ON public.governance_meetings
FOR SELECT
USING (auth.has_role('admin'));

CREATE POLICY "System can manage principle adherence"
ON public.principle_adherence
FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view principle adherence"
ON public.principle_adherence
FOR SELECT
USING (auth.has_role('admin'));

-- Function to get governance statistics
CREATE OR REPLACE FUNCTION get_governance_statistics()
RETURNS TABLE (
  total_decisions INTEGER,
  decisions_this_year INTEGER,
  total_meetings INTEGER,
  avg_adherence_score REAL,
  pending_press_inquiries INTEGER,
  pending_data_requests INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER,
    COUNT(*) FILTER (WHERE decision_date >= DATE_TRUNC('year', CURRENT_DATE))::INTEGER,
    (SELECT COUNT(*) FROM public.governance_meetings),
    AVG(adherence_score)::REAL,
    COUNT(*) FILTER (WHERE status = 'pending')::INTEGER,
    COUNT(*) FILTER (WHERE access_granted = false)::INTEGER
  FROM public.board_decisions, public.principle_adherence, public.press_inquiries, public.data_access_requests;
END;
$$ LANGUAGE plpgsql;

-- Function to get board member activity
CREATE OR REPLACE FUNCTION get_board_member_activity(p_member_id TEXT)
RETURNS TABLE (
  meetings_attended INTEGER,
  decisions_participated INTEGER,
  conflict_disclosures INTEGER,
  last_attendance DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE g.attendees @> ARRAY[p_member_id])::INTEGER,
    COUNT(*) FILTER (WHERE b.voting_record @> ('[{"member_id": "' || p_member_id || '"}]')::JSONB)::INTEGER,
    COUNT(*) FILTER (WHERE c.member_id = p_member_id)::INTEGER,
    MAX(g.meeting_date)
  FROM public.governance_meetings g, public.board_decisions b, public.conflict_disclosures c
  WHERE (g.attendees @> ARRAY[p_member_id] OR b.voting_record @> ('[{"member_id": "' || p_member_id || '"}]')::JSONB OR c.member_id = p_member_id);
END;
$$ LANGUAGE plpgsql;

-- View for governance dashboard
CREATE VIEW public.governance_dashboard AS
SELECT 
  (SELECT COUNT(*) FROM public.board_decisions WHERE decision_date >= CURRENT_DATE - INTERVAL '90 days') as recent_decisions,
  (SELECT COUNT(*) FROM public.governance_meetings WHERE meeting_date >= CURRENT_DATE - INTERVAL '90 days') as recent_meetings,
  (SELECT COUNT(*) FROM public.press_inquiries WHERE status = 'pending') as pending_inquiries,
  (SELECT COUNT(*) FROM public.data_access_requests WHERE access_granted = false) as pending_data_requests,
  (SELECT AVG(adherence_score) FROM public.principle_adherence WHERE assessment_date >= CURRENT_DATE - INTERVAL '1 year') as avg_adherence_score,
  (SELECT COUNT(*) FROM public.conflict_disclosures WHERE reviewed_by_chair = false) as unreviewed_disclosures;

-- Trigger for updated_at
CREATE TRIGGER update_board_decisions_updated_at
BEFORE UPDATE ON public.board_decisions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conflict_disclosures_updated_at
BEFORE UPDATE ON public.conflict_disclosures
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_press_inquiries_updated_at
BEFORE UPDATE ON public.press_inquiries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_data_access_requests_updated_at
BEFORE UPDATE ON public.data_access_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_governance_meetings_updated_at
BEFORE UPDATE ON public.governance_meetings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_principle_adherence_updated_at
BEFORE UPDATE ON public.principle_adherence
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();