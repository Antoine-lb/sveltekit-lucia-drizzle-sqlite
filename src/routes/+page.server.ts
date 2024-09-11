import { db } from '$lib/server/db'; // Import the database connection
import { ArticlesTable } from '$lib/server/schema';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { lucia } from '$lib/server/auth';

// Load all articles from the database to display on the page
export const load: PageServerLoad = async () => {
	const articles = await db.select().from(ArticlesTable).all();
	return { articles }; // Return articles to the page
};

// Handle form submissions for creating a new article
export const actions: Actions = {
	createArticle: async ({ request }) => {
		const formData = await request.formData();
		const title = formData.get('title') as string;
		const content = formData.get('content') as string;

		if (!title || title.trim().length === 0) {
			return fail(400, { error: 'Title is required' });
		}

		// Insert the new article into the database
		await db.insert(ArticlesTable).values({ title, content });

		return { success: true }; // Indicate that the article was created successfully
	},

	logout: async (event) => {
		if (!event.locals.session) {
			return fail(401);
		}
		await lucia.invalidateSession(event.locals.session.id);
		const sessionCookie = lucia.createBlankSessionCookie();
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});
		redirect(302, '/login');
	}
};
