[![https://travis-ci.org/taterbase/geppetto](https://travis-ci.org/taterbase/geppetto.svg)](https://travis-ci.org/taterbase/geppetto)
#Geppetto

*SOA local development made easy.*

Geppetto makes it simple to script the launch of all your local services with the desired environment variables

##Contents
- [Installation](#installation)
- [Usage](#usage)
	- [Common Globals](#common-globals)
	- [Commands](#commands)
		- [-r --run](#-r--run)
		- [-e --export-env](#-e--export-env)

##Installation

`npm install -g geppetto`

##Usage

If you have a `geppetto.json` in the local directory, you can just run `geppetto`. If you have a file named something other than `geppetto.json` use the `-f` or `--file` flag.

`geppetto -f config.json`

Define a json configuration file with the processes that you want running. You can define a:

- **Required**
	- `command` - The command being called to launch the process
- **Optional**
	- `dir` - The directory you want the process to be launched from. `dir` supports $ENVIRONMENT variable expansion.
	- `env` - A hash of process specific environment variables you want the process to have
	- `install` - A sub level of options to perform to install the necessary files (if `dir` is nonexistent)for the process (`install` overrides `git` option)
	- `postinstall` - A sub level of options to perform after installation
	- `git` - If `dir` is nonexistent it will be cloned down locally
	- `postgit` - Sub level options to run on directory after cloning down with `git`


```json
{
  "api_server": {
    "dir": "$PWD/node-server",
    "install": {
      "command": "curl",
      "arguments": ["-O", "https://example.com/api_server"]
    },
    "postinstall": {
      "command": "npm",
      "arguments": ["install"]
    },
    "command": "node",
    "arguments": [ "app.js" ],
    "env": {
      "PORT": "1337"
    },
  },
  "app_server": {
    "git": "https://github.com/me/app_server",
    "postgit": {
      "command": "bundle",
      "arguments": ["install"]
    },
    "command": "rails",
    "arguments": ["s"],
    "env": {
      "API_URL": "http://localhost:1337"
    }
  }
}
```

###Common Globals
There are also top level keys that can be defined to set global common options:

- `_env` Common environment variables for each service
```javascript
{
  "_env": {"LEVEL": "1", "BOSS": "SnapBack"},
  "game": {"command": "cat", "arguments": ["index.js"], "env": {"LEVEL": "2"}}
}
//game env will be `{LEVEL: 2, BOSS: "SnapBack"}
```

###Commands

#### `-r --run`
You can run select services from a configuration file by passing in the `-r` or `--run` flag specifying which services.

`geppetto -r worker -r webapp -r proxy`

#### `-e --export-env`
You can "export" the environment variables for an app using a -e or --export-env flag and an optional app name.

`geppetto -e [app-name]`

If no app is specificed all `_env` values will be printed, if an app is specified its specific `env` variables will be printed as well. You can pipe these into a file and `source` it in bash.

Example output:
```
export SOME_ENV=your_value
export SOME_OTHER_ENV=your_other_value
```


___

Made with ⚡️ by [@taterbase](https://twitter.com/taterbase)
