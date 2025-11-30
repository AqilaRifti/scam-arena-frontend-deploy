-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Agents table
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('red_team', 'blue_team')),
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  accuracy FLOAT DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Battles table
CREATE TABLE battles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  red_agent_id UUID REFERENCES agents(id),
  blue_agent_id UUID REFERENCES agents(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'analyzing', 'resolved')),
  scam_pitch JSONB NOT NULL,
  detection_result JSONB,
  is_actually_scam BOOLEAN,
  blue_team_correct BOOLEAN,
  winner_id UUID REFERENCES agents(id),
  points_awarded INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_agents_type ON agents(type);
CREATE INDEX idx_agents_points ON agents(points DESC);
CREATE INDEX idx_battles_status ON battles(status);
CREATE INDEX idx_battles_created ON battles(created_at DESC);

-- Function to update agent stats
CREATE OR REPLACE FUNCTION increment_agent_stats(
  agent_id UUID,
  win BOOLEAN,
  pts INTEGER
)
RETURNS void AS $$
BEGIN
  UPDATE agents
  SET 
    wins = CASE WHEN win THEN wins + 1 ELSE wins END,
    losses = CASE WHEN NOT win THEN losses + 1 ELSE losses END,
    points = agents.points + pts,
    accuracy = CASE 
      WHEN (wins + losses + 1) > 0 
      THEN (wins::FLOAT + CASE WHEN win THEN 1 ELSE 0 END) / (wins + losses + 1)
      ELSE 0
    END,
    updated_at = NOW()
  WHERE id = agent_id;
END;
$$ LANGUAGE plpgsql;

-- Enable realtime for battles
ALTER PUBLICATION supabase_realtime ADD TABLE battles;
