import { defineConfig } from '@harnessio/oats-cli';
import reactQueryPlugin from '@harnessio/oats-plugin-react-query';

export default defineConfig({
	plugins: [reactQueryPlugin({})],
	services: {
		'petstore-swagger': {
			output: './output/petstore-swagger',
			url: 'https://petstore.swagger.io/v2/swagger.json',
			fileHeader: '/* This is a sample header */',
		},
		'petstore-openapi-v3.0': {
			output: './output/petstore-openapi-v3.0',
			file: './schemas/petstore-v3.yaml',
		},
		'cd-ng': {
			url: 'https://stress.harness.io/ng/api/swagger.json',
			output: './output/cd-ng-rq',
			// transformer(spec) {
			// 	return {
			// 		...spec,
			// 		components: {
			// 			...spec.components,
			// 			schemas: omit(spec.components?.schemas, ['OauthSettings'])
			// 		},
			// 		paths: mapKeys(spec.paths, (_val, key) => `ng/api${key}`)
			// 	}
			// },
			genOnlyUsed: true,
			plugins: [
				reactQueryPlugin({
					customFetcher: 'services/fetcher',
					allowedOperationIds: ['getServicesYamlAndRuntimeInputs', 'getServiceAccessList'],
					overrides: {
						getServicesYamlAndRuntimeInputs: {
							useQuery: true,
						},
					},
				}),
			],
		},
	},
});
