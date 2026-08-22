import { LambdaClient, InvokeCommand, InvocationType } from '@aws-sdk/client-lambda'

const client = new LambdaClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const FUNCTION_NAME = process.env.GENERATE_PREVIEW_LAMBDA_NAME ?? ''

// Fire-and-forget async invocation — does not wait for Lambda to finish.
// Returns false if the function name is not configured (e.g. local dev).
export async function invokeGeneratePreview(s3Key: string): Promise<boolean> {
  if (!FUNCTION_NAME) return false
  try {
    await client.send(
      new InvokeCommand({
        FunctionName: FUNCTION_NAME,
        InvocationType: InvocationType.Event, // async — no response waited for
        Payload: Buffer.from(JSON.stringify({ key: s3Key })),
      }),
    )
    return true
  } catch (err) {
    console.error('[lambda] invokeGeneratePreview failed', err)
    return false
  }
}
