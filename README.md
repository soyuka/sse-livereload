# SSE Livereload

Experimental livereload server that uses browserify to build and server side events to reload the page automatically.

## Installation

```
npm install sse-livereload
```

## Usage

```
# with an index.js
sse-livereload
# or
sse-livereload main.js
```

Will create a `bundle.js` file.

## Options

Change the port and the host using `PORT` and `HOST` environment variables.
