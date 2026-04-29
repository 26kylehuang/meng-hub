import { error, redirect } from '@sveltejs/kit';

export const load = async ({ params, locals: { supabase, session } }) => {
    if (!session) throw redirect(303, '/auth');

    const { data: post } = await supabase
        .from('posts')
        .select('*, profiles(full_name, email)')
        .eq('slug', params.slug)
        .eq('published', true)
        .single();

    if (!post) throw error(404, 'Post not found.');

    return { post };
};
