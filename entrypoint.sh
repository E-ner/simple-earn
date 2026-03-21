#!/bin/sh
npx prisma@5.22.0 migrate deploy
node reset-admin.js
node server.js