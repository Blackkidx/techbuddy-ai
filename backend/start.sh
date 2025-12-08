#!/bin/sh
# TechBuddy Backend Startup Script
# Runs database migrations before starting the server

echo "🔄 Running Prisma migrations..."
npx prisma migrate deploy

echo "🚀 Starting TechBuddy Backend..."
npm start
