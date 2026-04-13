import { CircuitBreakerConfig } from '../types/index.js'

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

type CircuitEntry = {
  state: CircuitState
  failures: number
  openedAt: number
}

const circuits = new Map<string, CircuitEntry>()

function getEntry(key: string): CircuitEntry {
  if (!circuits.has(key)) {
    circuits.set(key, { state: 'CLOSED', failures: 0, openedAt: 0 })
  }
  return circuits.get(key)!
}

// Returns the current state, transitioning OPEN → HALF_OPEN if the cooldown has passed.
export function checkCircuit(key: string, config: CircuitBreakerConfig): CircuitState {
  const entry = getEntry(key)

  if (entry.state === 'OPEN') {
    if (Date.now() - entry.openedAt >= config.cooldown) {
      entry.state = 'HALF_OPEN'
      return 'HALF_OPEN'
    }
    return 'OPEN'
  }

  return entry.state
}

export function recordSuccess(key: string) {
  const entry = getEntry(key)
  entry.state = 'CLOSED'
  entry.failures = 0
}

export function recordFailure(key: string, config: CircuitBreakerConfig) {
  const entry = getEntry(key)
  entry.failures += 1

  if (entry.failures >= config.threshold) {
    entry.state = 'OPEN'
    entry.openedAt = Date.now()
  }
}

export function getCircuitStats(key: string): { state: CircuitState; failures: number } {
  const entry = getEntry(key)
  return { state: entry.state, failures: entry.failures }
}
