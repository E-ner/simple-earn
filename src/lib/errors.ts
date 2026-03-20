import { NextResponse } from 'next/server'
import { logger } from './logger'

export function handleApiError(error: unknown) {
  logger.error(error)
  const message = error instanceof Error ? error.message : "Internal Server Error"
  return NextResponse.json({ error: message }, { status: 500 })
}
