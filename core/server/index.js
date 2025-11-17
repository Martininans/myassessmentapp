// Lightweight local replacement for @app-core/server
// Exposes createHandler and createServer used by endpoints in this scaffold
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { AppError } = require('../errors');

function createHandler({ path = '*', method = '', handler }) {
  return { path, method: method.toLowerCase(), handler };
}

function registerEndpoint(app, endpointModule) {
  const def = endpointModule;
  if (!def || !def.path || typeof def.handler !== 'function') return;
  const method = (def.method || 'post').toLowerCase();
  app[method](def.path, async (req, res) => {
    try {
      const rc = {
        body: req.body,
        headers: req.headers,
        params: req.params,
        query: req.query,
        properties: {}
      };

      const helpers = coreHelpers();

      const result = await def.handler(rc, helpers);

      res.status(result.status || 200).json(result.data || {});
    } catch (err) {
      if (err && err.isAppError) {
        const status = err.status || 400;
        const payload = err.data || { error: err.message };
        res.status(status).json(payload);
        return;
      }
      console.error(err);
      res.status(500).json({ error: 'Unexpected error' });
    }
  });
}

function coreHelpers() {
  return {
    http_statuses: {
      HTTP_200_OK: 200,
      HTTP_201_CREATED: 201,
      HTTP_400_BAD_REQUEST: 400,
      HTTP_404_NOT_FOUND: 404
    }
  };
}

function createServer({ endpointConfigs = [] } = {}) {
  const app = express();
  app.use(bodyParser.json());

  endpointConfigs.forEach((cfg) => {
    const fullPath = pathJoinSafe(cfg.path);
    try {
      // we expect an index.js exporting an array of endpoints
      const endpoints = require(fullPath);
      if (Array.isArray(endpoints)) {
        endpoints.forEach((ep) => registerEndpoint(app, ep));
      }
    } catch (e) {
      console.warn(`Endpoint folder not loaded: ${fullPath}`, e.message);
    }
  });

  // basic 404
  app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });

  return app;
}

function pathJoinSafe(p) {
  try {
    const resolved = path.resolve(p);
    return resolved;
  } catch (e) {
    return p;
  }
}

module.exports = { createHandler, createServer };
