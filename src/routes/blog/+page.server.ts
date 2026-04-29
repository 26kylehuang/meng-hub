import { redirect } from '@sveltejs/kit';

export const load = async ({ locals: { supabase, session, userRole } }) => {
    if (!session) throw redirect(303, '/auth');

    const { data: posts } = await supabase
        .from('posts')
        .select('id, title, slug, excerpt, category, published_at, author_id, profiles(full_name)')
        .eq('published', true)
        .order('published_at', { ascending: false });

    return {
        userRole,
        posts: (posts ?? []).map((p: any) => ({
            ...p,
            date: p.published_at
                ? new Date(p.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : '',
            author_name: p.profiles?.full_name ?? 'Meng Hub Team',
            author_initials: (p.profiles?.full_name ?? 'MH')
                .split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(),
        })),
    };
};
