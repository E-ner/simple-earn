#!/bin/sh
./node_modules/.bin/prisma migrate deploy
node reset-admin.js
node server.js