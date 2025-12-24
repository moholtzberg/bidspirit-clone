import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	ssr: {
		// Prisma Client is CommonJS - don't bundle it, let Node.js handle it
		// By default, node_modules are external unless listed in noExternal
		noExternal: []
	},
	optimizeDeps: {
		exclude: ['@prisma/client', '@aws-sdk/client-s3', 'cloudinary']
	}
});
