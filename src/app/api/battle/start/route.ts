import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { cerebras } from '@/lib/cerebras';
import { v4 as uuidv4 } from 'uuid';
import type { ScamPitch, ScamType } from '@/lib/types';

const RED_TEAM_PROMPT = `You are a Red Team AI agent in a cybersecurity training simulation. Generate REALISTIC crypto scam pitches for EDUCATIONAL PURPOSES ONLY.

Scam Types: PONZI SCHEME, RUG PULL, PUMP & DUMP, FAKE ICO, PHISHING

Requirements:
- Use 2024-2025 crypto trends (AI agents, RWA, DePIN, L2s, restaking)
- Include psychological triggers (FOMO, authority, urgency)
- Mix legitimate claims with subtle red flags

Output ONLY valid JSON:
{"projectName": "Name", "pitch": "Detailed pitch...", "scamType": "ponzi", "psychTriggers": [], "technicalClaims": [], "redFlags": []}`;

export async function POST(request: Request) {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        const { redAgentId, blueAgentId, scamType } = await request.json();

        // Verify agents exist
        const { data: agents } = await supabaseAdmin
            .from('agents')
            .select('*')
            .in('id', [redAgentId, blueAgentId]);

        if (!agents || agents.length !== 2) {
            return NextResponse.json({ error: 'Agents not found' }, { status: 404 });
        }

        // Generate scam pitch
        const typeHint = scamType || 'random';
        const response = await cerebras.chat(
            [
                { role: 'system', content: RED_TEAM_PROMPT },
                { role: 'user', content: `Generate a ${typeHint} crypto scam pitch. Output ONLY JSON.` },
            ],
            { temperature: 0.8, maxTokens: 2048 }
        );

        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Failed to parse AI response');

        const parsed = JSON.parse(jsonMatch[0]);
        const scamPitch: ScamPitch = {
            id: uuidv4(),
            projectName: parsed.projectName || 'Unknown Project',
            pitch: parsed.pitch || '',
            scamType: parsed.scamType || scamType || 'ponzi',
            psychTriggers: parsed.psychTriggers || [],
            technicalClaims: parsed.technicalClaims || [],
            redFlags: parsed.redFlags || [],
            timestamp: new Date().toISOString(),
        };

        // 80% scam, 20% legitimate
        const isActuallyScam = Math.random() < 0.8;

        // Create battle
        const { data: battle, error } = await supabaseAdmin
            .from('battles')
            .insert({
                red_agent_id: redAgentId,
                blue_agent_id: blueAgentId,
                status: 'pending',
                scam_pitch: scamPitch,
                is_actually_scam: isActuallyScam,
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ battle, scamPitch });
    } catch (error) {
        console.error('Battle start error:', error);
        return NextResponse.json({ error: 'Failed to start battle' }, { status: 500 });
    }
}
