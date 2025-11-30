export type ScamType = 'ponzi' | 'rug_pull' | 'pump_dump' | 'fake_ico' | 'phishing';
export type AgentType = 'red_team' | 'blue_team';
export type BattleStatus = 'pending' | 'analyzing' | 'resolved';
export type Recommendation = 'AVOID' | 'CAUTION' | 'INVESTIGATE' | 'SAFE';
export type Severity = 'high' | 'medium' | 'low';

export interface Agent {
    id: string;
    name: string;
    type: AgentType;
    wins: number;
    losses: number;
    points: number;
    accuracy: number;
    created_at: string;
    updated_at: string;
}

export interface ScamPitch {
    id: string;
    projectName: string;
    pitch: string;
    scamType: ScamType;
    psychTriggers: string[];
    technicalClaims: string[];
    redFlags: string[];
    timestamp: string;
}

export interface RedFlag {
    flag: string;
    severity: Severity;
    explanation: string;
}

export interface DetectionResult {
    isScam: boolean;
    confidence: number;
    scamType: ScamType | null;
    detectedFlags: RedFlag[];
    reasoning: string;
    recommendation: Recommendation;
    analysisTime: number;
}

export interface Battle {
    id: string;
    red_agent_id: string;
    blue_agent_id: string;
    status: BattleStatus;
    scam_pitch: ScamPitch;
    detection_result: DetectionResult | null;
    is_actually_scam: boolean;
    blue_team_correct: boolean | null;
    winner_id: string | null;
    points_awarded: number | null;
    created_at: string;
    resolved_at: string | null;
}
