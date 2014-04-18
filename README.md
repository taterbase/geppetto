#Geppetto

*SOA local development made easy.*

Geppetto makes it simple to script the launch of all your local services with the desired environment variables

##Contents
- [Installation]
- [Usage]
	- [Common Globals]

##Installation

`npm install -g geppetto`

##Usage

`geppetto config.json`

Define a json configuration file with the processes that you want running. You can define a:

- `command` (required) The command being called to launch the process
- `dir` (optional) The directory you want the process to be launched from
- `env` (optional) A hash of process specific environment variables you want the process to have
- `git` (optional) If `dir` is not defined or the directory is nonexistent it will be cloned down locally


```json
{
  "api_server": {
    "dir": "./node-server",
    "command": "node",
    "arguments": [ "app.js" ],
    "env": {
      "PORT": "1337"
    },
  },
  "app_server": {
    "git": "https://github.com/me/app_server",
    "command": "rails",
    "arguments": ["s"],
    "env": {
      "API_URL": "http://localhost:1337"
    }
  }
}
```

###Common Globals
There are also top level keys that can be defined to set global commone options:

- `_dir` Prefix directory string, used in conjuction with each service's key in the config (overriden by `dir` key)
```javascript
{
  "_dir": "/Users/taterbase/projects/",
  "game": {"command": "cat", "arguments": ["index.js"]}
}
//game dir will be "/Users/taterbase/projects/game
```

- `_env` Commen environment variables for each service
```javascript
{
  "_env": {"LEVEL": "1", "BOSS": "SnapBack"},
  "game": {"command": "cat", "arguments": ["index.js"], "env": {"LEVEL": "2"}}
}
//game env will be `{LEVEL: 2, BOSS: "SnapBack"}
```

