import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	ssr: {
		// Prisma Client is CommonJS - don't bundle it, let Node.js handle it
		// By default, node_modules are external unless listed in noExternal
		noExternal: [],
		external: ['@aws-sdk/client-s3', '@aws-sdk/s3-request-presigner', 'cloudinary'] // Explicitly externalize these for SSR
	},
	optimizeDeps: {
		exclude: ['@prisma/client', '@aws-sdk/client-s3', '@aws-sdk/s3-request-presigner', 'cloudinary'] // Exclude from pre-bundling
	}
});
