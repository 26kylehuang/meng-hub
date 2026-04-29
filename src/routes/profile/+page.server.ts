import { redirect, fail } from '@sveltejs/kit';

export const load = async ({ locals: { supabase, session } }) => {
    if (!session) throw redirect(303, '/auth');

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email, role, created_at')
        .eq('id', session.user.id)
        .single();

    return { profile: profile ?? { email: session.user.email, role: 'student' } };
};

export const actions = {
    updateName: async ({ request, locals: { supabase, session } }) => {
        if (!session) return fail(403, { error: 'Unauthorized' });
        const data = await request.formData();
        const fullName = (data.get('full_name') as string)?.trim();
        if (!fullName) return fail(400, { nameError: 'Name cannot be empty.' });

        const { error } = await supabase
            .from('profiles')
            .update({ full_name: fullName })
            .eq('id', session.user.id);

        if (error) return fail(500, { nameError: error.message });
        return { nameSuccess: true };
    },

    updatePassword: async ({ request, locals: { supabase } }) => {
        const data = await request.formData();
        const password    = data.get('password') as string;
        const confirmPass = data.get('confirm_password') as string;

        if (!password || password.length < 6)
            return fail(400, { passError: 'Password must be at least 6 characters.' });
        if (password !== confirmPass)
            return fail(400, { passError: 'Passwords do not match.' });

        const { error } = await supabase.auth.updateUser({ password });
        if (error) return fail(500, { passError: error.message });
        return { passSuccess: true };
    },
};
