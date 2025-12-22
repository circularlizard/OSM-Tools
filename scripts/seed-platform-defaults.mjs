#!/usr/bin/env node
import Redis from 'ioredis'

const kvUrl = process.env.KV_URL
const redisUrl = kvUrl ?? process.env.REDIS_URL ?? 'redis://localhost:6379'
const force = process.argv.includes('--force')

function createClient(url) {
  return new Redis(url, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000)
      return delay
    },
  })
}

const redis = createClient(redisUrl)

const defaults = {
  'platform:seeeSectionId': '43105',
  'platform:allowedOperators': JSON.stringify(['david.strachan@mac.com']),
}

async function seed() {
  try {
    console.log(`Seeding platform defaults using ${redisUrl}`)
    let writes = 0

    for (const [key, value] of Object.entries(defaults)) {
      const existing = await redis.get(key)
      if (existing === null || force) {
        await redis.set(key, value)
        writes += 1
        console.log(
          force
            ? `Set ${key} (force override)`
            : `Set ${key} (previously undefined)`
        )
      } else {
        console.log(`Skipped ${key}; already set to ${existing}`)
      }
    }

    console.log(
      writes === 0
        ? 'No changes required.'
        : `Seeded ${writes} key${writes === 1 ? '' : 's'}.`
    )
    await redis.quit()
    process.exit(0)
  } catch (error) {
    console.error('Failed to seed platform defaults:', error)
    await redis.quit()
    process.exit(1)
  }
}

await seed()
