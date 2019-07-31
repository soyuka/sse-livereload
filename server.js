const watchify = require('watchify')
const appendify = require('appendify')
const serve = require('serve-handler')
const browserify = require('browserify')
const http = require('http')
const fs   = require('fs')
const argv = require('minimist')(process.argv.slice(2));

const SseStream = require('./ssestream.js')

const clients = new Map()

function send(data) {
  for (let [,client] of clients) {
    client.write(data)
  }
}

function bundle() {
  const write = fs.createWriteStream('bundle.js')
  b.bundle()
    .on('error', (err) => send({event: 'builderror', data: err}))
    .on('end', () => send({event: 'reload', data: {}}))
    .pipe(write)
}

function onRequest(req, res) {
  if (req.url == '/events') {
    const sse = new SseStream(req);
    sse.pipe(res);
    clients.set(req, sse)
    res.socket.on('close', function () {
      clients.delete(req)
    })
    return
  }

  return serve(req, res);
}

const PORT = process.env.PORT || 8080
const HOST = process.env.HOST || 'localhost'
const b = browserify({
  entries: argv._.length ? argv._ : ['index.js'],
  cache: {},
  packageCache: {},
  debug: true, //enables source maps
  plugin: [watchify]
})
.transform('babelify')
.transform(appendify, {
  glob: 'index.js',
  string: `
const es = new EventSource(window.location.origin + '/events')
es.addEventListener('reload', function(e) {
  window.location.reload()
})

es.addEventListener('builderror', function(e) {
  console.error(e.data)
})

es.onopen = function() {
  console.log('Communication with development server is open.')
}`
});

b.on('update', bundle);
bundle();

http.createServer(onRequest).listen(PORT, HOST);
