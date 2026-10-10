// Course example for the pinned snapshot; not compiled or installed by this lesson.
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { defineTool } from '@deepseek-ai/dsh-tools'

export const name = 'timeout-audit'
export const inject = ['tools']
export const Config = z.object({ minimum: z.number().default(30) })

export function apply(ctx: Context, config: { minimum: number }) {
  if (!Number.isFinite(config.minimum) || config.minimum <= 0)
    throw new Error('minimum must be positive and finite')
  ctx.tools.register(defineTool({
    name: 'audit_timeout',
    description: 'Check a supplied timeout against the configured minimum.',
    parameters: { timeout: { type: 'number', required: true } },
    output: {
      schema: {
        type: 'object', additionalProperties: false,
        properties: {
          ok: { type: 'boolean', required: true },
          actual: { type: 'number', required: true },
          minimum: { type: 'number', required: true },
        },
      },
      render: (_args, value) => [{
        type: 'text', text: JSON.stringify(value),
      }],
    },
    async execute(args, exec) {
      exec.signal.throwIfAborted()
      if (!Number.isFinite(args.timeout) || args.timeout <= 0)
        throw new Error('timeout must be positive and finite')
      return { ok: args.timeout >= config.minimum,
        actual: args.timeout, minimum: config.minimum }
    },
  }))
}
