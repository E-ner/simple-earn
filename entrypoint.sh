#!/bin/sh
npx prisma migrate deploy
node reset-admin.js
node server.js