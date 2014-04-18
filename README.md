#Geppetto

*SOA local development made easy.*

Geppetto makes it simple to script the launch of all your local services with the desired environment variables

##Installation

`npm install -g geppetto`

##Usage

Define a json configuration file with the processes that you want running. You can define a:
- dir (the directory you want the process to be launched from)
- command (the command being called to launch the process)
- env (a hash of process specific environment variables you want the process to have)

There is also a top level key `_env` that can be used to set common environment variables that all the processes need.

```json
{
  "_env": {
    "MONGO_URL": "mongodb://localhost:27017/geppetto_db",
    "REDIS_URL": "redis://localhost:3333"
  },
  "Api Server": {
    "dir": "./node-server",
    "command": "node",
    "arguments": [ "app.js" ],
    "env": {
      "PORT": "1337"
    }
  },
  "App Server": {
    "command": "rails",
    "arguments": ["s"]
    "env": {
      "API_URL": "http://localhost:1337"
    }
  }
}
```

Then gust run `geppetto config.json`
