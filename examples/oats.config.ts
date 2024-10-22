import { defineConfig } from '@harnessio/oats-cli';
import reactQueryPlugin from '@harnessio/oats-plugin-react-query';

export default defineConfig({
	plugins: [reactQueryPlugin({})],
	services: {
		'petstore-swagger': {
			output: './output/petstore-swagger',
			url: 'https://petstore.swagger.io/v2/swagger.json',
			fileHeader: '/* This is a sample header */',
			// genOnlyUsed: true,
			// plugins: [
			// 	reactQueryPlugin({
			// 		customFetcher: '../../../../custom-fetcher/index.js',
			// 	}),
			// ],
		},
		'petstore-openapi-v3.0': {
			output: './output/petstore-openapi-v3.0',
			file: './schemas/petstore-v3.yaml',
			// genOnlyUsed: true,
			// plugins: [
			// 	reactQueryPlugin({
			// 		customFetcher: '../../../../custom-fetcher/index.js',
			// 	}),
			// ],
		},
		github: {
			url: 'https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/api.github.com/api.github.com.yaml',
			output: './output/github',
			genOnlyUsed: true,
			plugins: [
				reactQueryPlugin({
					allowedOperationIds: ['repos/list-for-authenticated-user'],
					// customFetcher: '../../../../custom-fetcher/index.js',
				}),
			],
		},
	},
});
