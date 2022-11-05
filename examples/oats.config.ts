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
	},
});
