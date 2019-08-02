# SSE Livereload

Experimental livereload server that uses browserify to build and server side events to reload the page automatically.

## Installation

```
npm install sse-livereload
```

## Usage

Use the `sse-livereload template [path]` command to setup a boilerplate for your project and start hacking.

Then, just serve the directory with:

```
# with an index.js
sse-livereload
# or
sse-livereload main.js
```

In other words:

```
npm install sse-livereload
sse-livereload template
sse-livereload
# start hacking
```

## Options

Change the port and the host using `PORT` and `HOST` environment variables.
