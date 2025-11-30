import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');

        const supabaseAdmin = getSupabaseAdmin();
        let query = supabaseAdmin
            .from('agents')
            .select('*')
            .order('points', { ascending: false });

        if (type) {
            query = query.eq('type', type);
        }

        const { data: agents, error } = await query;
        if (error) throw error;

        return NextResponse.json({ agents });
    } catch (error) {
        console.error('Get agents error:', error);
        return NextResponse.json({ error: 'Failed to get agents' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { name, type } = await request.json();

        const supabaseAdmin = getSupabaseAdmin();
        const { data: agent, error } = await supabaseAdmin
            .from('agents')
            .insert({ name, type })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ agent });
    } catch (error) {
        console.error('Create agent error:', error);
        return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 });
    }
}
