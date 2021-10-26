const { exec } = require('child_process');
const { version } = require('./package.json');



console.log(version);

exec
(
	`git add . && git commit -m release/v${ version } && git push origin master && npm publish --access=public`,
	// `git commit --allow-empty -m release/v${ version } && git push origin master && npm publish --access=public`,

	(_err, stdout, stderr) =>
	{
		if (_err)
		{
			console.log(_err);
		}

		console.log(stdout);
		console.log(stderr);
	},
);
