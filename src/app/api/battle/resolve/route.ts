import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { cerebras } from '@/lib/cerebras';
import type { DetectionResult } from '@/lib/types';

const BLUE_TEAM_PROMPT = `You are a Blue Team AI agent detecting cryptocurrency scams.

Red Flags: UNREALISTIC RETURNS, VAGUE TECHNOLOGY, ANONYMOUS TEAMS, URGENCY TACTICS, PONZI STRUCTURE, NO PRODUCT, POOR COMMUNICATION, REGULATORY ISSUES, FAKE SOCIAL PROOF, EXIT LIQUIDITY

Output ONLY valid JSON:
{"isScam": true, "confidence": 85, "scamType": "ponzi", "detectedFlags": [{"flag": "Description", "severity": "high", "explanation": "Why"}], "reasoning": "Analysis...", "recommendation": "AVOID"}`;

export async function POST(request: Request) {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        const { battleId } = await request.json();

        // Get battle
        const { data: battle } = await supabaseAdmin
            .from('battles')
            .select('*')
            .eq('id', battleId)
            .single();

        if (!battle) {
            return NextResponse.json({ error: 'Battle not found' }, { status: 404 });
        }

        // Update status
        await supabaseAdmin
            .from('battles')
            .update({ status: 'analyzing' })
            .eq('id', battleId);

        // Blue Team analyzes
        const startTime = Date.now();
        const pitch = battle.scam_pitch;

        const response = await cerebras.chat(
            [
                { role: 'system', content: BLUE_TEAM_PROMPT },
                { role: 'user', content: `Analyze:\nPROJECT: ${pitch.projectName}\nPITCH: ${pitch.pitch}\n\nOutput ONLY JSON.` },
            ],
            { temperature: 0.4, maxTokens: 3072 }
        );

        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Failed to parse detection result');

        const parsed = JSON.parse(jsonMatch[0]);
        const detectionResult: DetectionResult = {
            isScam: Boolean(parsed.isScam),
            confidence: Math.min(100, Math.max(0, Number(parsed.confidence) || 50)),
            scamType: parsed.scamType || null,
            detectedFlags: parsed.detectedFlags || [],
            reasoning: parsed.reasoning || '',
            recommendation: parsed.recommendation || 'INVESTIGATE',
            analysisTime: Date.now() - startTime,
        };

        // Determine winner
        const blueTeamCorrect = detectionResult.isScam === battle.is_actually_scam;
        const basePoints = 10;
        const confidenceBonus = blueTeamCorrect ? Math.floor(detectionResult.confidence / 10) : 0;
        const pointsAwarded = basePoints + confidenceBonus;
        const winnerId = blueTeamCorrect ? battle.blue_agent_id : battle.red_agent_id;

        // Update battle
        const { data: resolvedBattle } = await supabaseAdmin
            .from('battles')
            .update({
                status: 'resolved',
                detection_result: detectionResult,
                blue_team_correct: blueTeamCorrect,
                winner_id: winnerId,
                points_awarded: pointsAwarded,
                resolved_at: new Date().toISOString(),
            })
            .eq('id', battleId)
            .select()
            .single();

        // Update agent stats
        if (blueTeamCorrect) {
            await supabaseAdmin.rpc('increment_agent_stats', {
                agent_id: battle.blue_agent_id,
                win: true,
                pts: pointsAwarded,
            });
            await supabaseAdmin.rpc('increment_agent_stats', {
                agent_id: battle.red_agent_id,
                win: false,
                pts: 0,
            });
        } else {
            await supabaseAdmin.rpc('increment_agent_stats', {
                agent_id: battle.red_agent_id,
                win: true,
                pts: pointsAwarded,
            });
            await supabaseAdmin.rpc('increment_agent_stats', {
                agent_id: battle.blue_agent_id,
                win: false,
                pts: 0,
            });
        }

        return NextResponse.json({
            battle: resolvedBattle,
            detectionResult,
            blueTeamCorrect,
            pointsAwarded,
        });
    } catch (error) {
        console.error('Battle resolve error:', error);
        return NextResponse.json({ error: 'Failed to resolve battle' }, { status: 500 });
    }
}
