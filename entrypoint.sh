#!/bin/sh
./node_modules/.bin/prisma db push --accept-data-loss
node reset-admin.js
node server.js