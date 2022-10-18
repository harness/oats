import { defineConfig } from '@harnessio/oats-cli/config';
import reactQueryPlugin from '@harnessio/oats-plugin-react-query';

export default defineConfig({
	plugins: [reactQueryPlugin({})],
	services: {
		'petstore-swagger': {
			output: './output/petstore-swagger',
			url: 'https://petstore.swagger.io/v2/swagger.json',
		},
		'petstore-openapi-v3.0': {
			output: './output/petstore-openapi-v3.0',
			file: './schemas/petstore-v3.yaml',
		},
	},
});
