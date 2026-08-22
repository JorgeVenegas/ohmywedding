import * as path from 'path'
import * as cdk from 'aws-cdk-lib'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as ssm from 'aws-cdk-lib/aws-ssm'
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from 'aws-cdk-lib/custom-resources'
import { Construct } from 'constructs'

export interface GuestPhotoPreviewProps extends cdk.StackProps {
  /** Name of the existing S3 bucket (e.g. process.env.AWS_S3_BUCKET) */
  bucketName: string
  /** Supabase project URL */
  supabaseUrl: string
  /**
   * SSM SecureString parameter path that holds the Supabase service role key.
   * Create it once:
   *   aws ssm put-parameter --name /ohmywedding/supabase-service-role-key \
   *     --type SecureString --value "<YOUR_KEY>"
   */
  supabaseKeyParam?: string
}

export class GuestPhotoPreviewStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: GuestPhotoPreviewProps) {
    super(scope, id, props)

    const {
      bucketName,
      supabaseUrl,
      supabaseKeyParam = '/ohmywedding/supabase-service-role-key',
    } = props

    const bucketArn = `arn:aws:s3:::${bucketName}`

    // ─── Supabase service role key from SSM SecureString ───────────────────────
    // valueForSecureStringParameter resolves at deploy time via CloudFormation
    // dynamic reference — the raw key never appears in the synthesised template.
    const supabaseServiceKey = ssm.StringParameter.valueForSecureStringParameter(
      this,
      supabaseKeyParam,
      1, // SSM parameter version (1 = initial; increment after rotating the key)
    )

    // ─── Lambda function ────────────────────────────────────────────────────────
    const previewFn = new lambda.Function(this, 'GeneratePreviewFn', {
      functionName: 'generate-guest-photo-preview',
      description: 'Generates a 1200px WebP preview for every guest photo original',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      // Bundle the lambda directory; Docker installs Sharp for linux-x64
      code: lambda.Code.fromAsset(
        path.join(__dirname, '../../lambda/generate-preview'),
        {
          bundling: {
            image: lambda.Runtime.NODEJS_20_X.bundlingImage,
            command: [
              'bash',
              '-c',
              [
                'cp -rT /asset-input /asset-output',
                'cd /asset-output',
                // Install Sharp binary for Lambda (Amazon Linux 2 / x86_64)
                'npm install --platform=linux --arch=x64 --libc=glibc sharp',
              ].join(' && '),
            ],
          },
        },
      ),
      timeout: cdk.Duration.minutes(1),
      memorySize: 512,
      environment: {
        S3_BUCKET: bucketName,
        SUPABASE_URL: supabaseUrl,
        SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey,
      },
    })

    // ─── S3 permissions ─────────────────────────────────────────────────────────
    previewFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject', 's3:PutObject'],
        resources: [`${bucketArn}/guest-photos/*`],
      }),
    )

    // Allow S3 to invoke the Lambda (required before adding the notification)
    previewFn.addPermission('AllowS3Invoke', {
      principal: new iam.ServicePrincipal('s3.amazonaws.com'),
      sourceArn: bucketArn,
      sourceAccount: this.account,
    })

    // ─── S3 event notification (ObjectCreated, prefix guest-photos/) ───────────
    // CDK cannot add notifications to imported (existing) buckets via high-level
    // constructs, so we use AwsCustomResource to call the S3 API directly.
    // IMPORTANT: putBucketNotificationConfiguration is a PUT (replaces all).
    // If you have other existing notifications on this bucket, add them here too.
    const s3Notification = new AwsCustomResource(this, 'S3GuestPhotoNotification', {
      resourceType: 'Custom::S3BucketNotification',
      onCreate: {
        service: 'S3',
        action: 'putBucketNotificationConfiguration',
        parameters: {
          Bucket: bucketName,
          NotificationConfiguration: {
            LambdaFunctionConfigurations: [
              {
                LambdaFunctionArn: previewFn.functionArn,
                Events: ['s3:ObjectCreated:*'],
                Filter: {
                  Key: {
                    FilterRules: [
                      { Name: 'prefix', Value: 'guest-photos/' },
                    ],
                  },
                },
              },
            ],
          },
        },
        physicalResourceId: PhysicalResourceId.of(`S3Notification-${bucketName}-guest-photos`),
      },
      onUpdate: {
        service: 'S3',
        action: 'putBucketNotificationConfiguration',
        parameters: {
          Bucket: bucketName,
          NotificationConfiguration: {
            LambdaFunctionConfigurations: [
              {
                LambdaFunctionArn: previewFn.functionArn,
                Events: ['s3:ObjectCreated:*'],
                Filter: {
                  Key: {
                    FilterRules: [
                      { Name: 'prefix', Value: 'guest-photos/' },
                    ],
                  },
                },
              },
            ],
          },
        },
        physicalResourceId: PhysicalResourceId.of(`S3Notification-${bucketName}-guest-photos`),
      },
      onDelete: {
        // Remove the notification on stack destroy
        service: 'S3',
        action: 'putBucketNotificationConfiguration',
        parameters: {
          Bucket: bucketName,
          NotificationConfiguration: {},
        },
        physicalResourceId: PhysicalResourceId.of(`S3Notification-${bucketName}-guest-photos`),
      },
      policy: AwsCustomResourcePolicy.fromStatements([
        new iam.PolicyStatement({
          actions: ['s3:PutBucketNotification', 's3:GetBucketNotification'],
          resources: [bucketArn],
        }),
      ]),
    })

    // Notification setup must happen after Lambda permission is granted
    s3Notification.node.addDependency(previewFn)

    // ─── S3 lifecycle rule — auto-delete guest photos after 60 months ──────────
    new AwsCustomResource(this, 'S3GuestPhotoLifecycle', {
      resourceType: 'Custom::S3LifecycleRule',
      onCreate: {
        service: 'S3',
        action: 'putBucketLifecycleConfiguration',
        parameters: {
          Bucket: bucketName,
          LifecycleConfiguration: {
            Rules: [
              {
                ID: 'guest-photos-60-month-ttl',
                Status: 'Enabled',
                Filter: { Prefix: 'guest-photos/' },
                Expiration: { Days: 1825 }, // 60 months ≈ 5 years
              },
            ],
          },
        },
        physicalResourceId: PhysicalResourceId.of(`S3Lifecycle-${bucketName}-guest-photos`),
      },
      onUpdate: {
        service: 'S3',
        action: 'putBucketLifecycleConfiguration',
        parameters: {
          Bucket: bucketName,
          LifecycleConfiguration: {
            Rules: [
              {
                ID: 'guest-photos-60-month-ttl',
                Status: 'Enabled',
                Filter: { Prefix: 'guest-photos/' },
                Expiration: { Days: 1825 },
              },
            ],
          },
        },
        physicalResourceId: PhysicalResourceId.of(`S3Lifecycle-${bucketName}-guest-photos`),
      },
      onDelete: {
        service: 'S3',
        action: 'deleteLifecycle',
        parameters: { Bucket: bucketName },
        physicalResourceId: PhysicalResourceId.of(`S3Lifecycle-${bucketName}-guest-photos`),
      },
      policy: AwsCustomResourcePolicy.fromStatements([
        new iam.PolicyStatement({
          actions: [
            's3:PutLifecycleConfiguration',
            's3:GetLifecycleConfiguration',
            's3:DeleteLifecycleConfiguration',
          ],
          resources: [bucketArn],
        }),
      ]),
    })

    // ─── Outputs ────────────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: previewFn.functionName,
      description: 'Set GENERATE_PREVIEW_LAMBDA_NAME to this value in your Next.js env',
    })

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: previewFn.functionArn,
    })
  }
}
