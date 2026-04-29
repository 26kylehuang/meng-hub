import { redirect } from '@sveltejs/kit';
export const load = async ({ locals: { session } }) => {
    if (!session) throw redirect(303, '/auth');
    return {};
};
