import path from 'path';
import swaggerJsdoc, { type Options } from 'swagger-jsdoc';
import { config } from '../utils/config';

const definition = {
  openapi: '3.0.3',
  info: {
    title: 'Yoga App REST API',
    version: '1.0.0',
    description: 'RESTful API for the Yoga application, including authentication, class management, bookings, payments, and notifications.',
  },
  servers: [
    {
      url: `http://localhost:${config.PORT}`,
      description: 'Local development',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      HealthResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'ok' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          phoneNumber: { type: 'string', nullable: true },
          bio: { type: 'string', nullable: true },
          role: { type: 'string', enum: ['ADMIN', 'TEACHER', 'STUDENT'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      SignupRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          firstName: { type: 'string', minLength: 1, nullable: true },
          lastName: { type: 'string', minLength: 1, nullable: true },
          phoneNumber: { type: 'string' },
          bio: { type: 'string' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      AuthTokens: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          user: { $ref: '#/components/schemas/User' },
          tokens: { $ref: '#/components/schemas/AuthTokens' },
        },
      },
      UpdateUserRequest: {
        type: 'object',
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          phoneNumber: { type: 'string' },
          bio: { type: 'string' },
        },
      },
      Tag: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          kind: { type: 'string', enum: ['LEVEL', 'FOCUS', 'EQUIPMENT'] },
          name: { type: 'string' },
          slug: { type: 'string' },
        },
      },
      ProgramSession: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          order: { type: 'integer' },
          title: { type: 'string' },
          durationMin: { type: 'integer' },
          videoUrl: { type: 'string', nullable: true },
          poseIds: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
      ProgramSummary: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          level: { type: 'string', enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] },
          durationMin: { type: 'integer' },
          coverUrl: { type: 'string', nullable: true },
          sessionCount: { type: 'integer' },
          tags: {
            type: 'array',
            items: { $ref: '#/components/schemas/Tag' },
          },
        },
      },
      ProgramDetail: {
        allOf: [
          { $ref: '#/components/schemas/ProgramSummary' },
          {
            type: 'object',
            properties: {
              sessions: {
                type: 'array',
                items: { $ref: '#/components/schemas/ProgramSession' },
              },
            },
          },
        ],
      },
      ProgramUpsertRequest: {
        type: 'object',
        required: ['title', 'description', 'level', 'durationMin'],
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          level: { type: 'string', enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] },
          durationMin: { type: 'integer' },
          coverUrl: { type: 'string', nullable: true },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of tag slugs to associate with the program',
          },
        },
      },
      ProgramSessionUpsertRequest: {
        type: 'object',
        required: ['order', 'title', 'durationMin'],
        properties: {
          order: { type: 'integer' },
          title: { type: 'string' },
          durationMin: { type: 'integer' },
          videoUrl: { type: 'string', nullable: true },
          poseIds: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
      ChallengeSummary: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          startAt: { type: 'string', format: 'date-time' },
          endAt: { type: 'string', format: 'date-time' },
          targetDays: { type: 'integer' },
          coverUrl: { type: 'string', nullable: true },
          enrollmentCount: { type: 'integer' },
          enrolled: { type: 'boolean' },
        },
      },
      ChallengeDetail: {
        allOf: [
          { $ref: '#/components/schemas/ChallengeSummary' },
          {
            type: 'object',
            properties: {
              completedDays: { type: 'integer', nullable: true },
              totalCompletions: { type: 'integer' },
            },
          },
        ],
      },
      ChallengeCreateRequest: {
        type: 'object',
        required: ['title', 'description', 'startAt', 'endAt', 'targetDays'],
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          startAt: { type: 'string', format: 'date-time' },
          endAt: { type: 'string', format: 'date-time' },
          targetDays: { type: 'integer' },
          coverUrl: { type: 'string' },
        },
      },
      ChallengeUpdateRequest: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          startAt: { type: 'string', format: 'date-time' },
          endAt: { type: 'string', format: 'date-time' },
          targetDays: { type: 'integer' },
          coverUrl: { type: 'string' },
        },
      },
      ChallengeCheckRequest: {
        type: 'object',
        properties: {
          date: { type: 'string', format: 'date-time' },
          programSessionId: { type: 'string' },
        },
      },
      DailyCheck: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          challengeId: { type: 'string', nullable: true },
          programSessionId: { type: 'string', nullable: true },
          date: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      ProgressSummary: {
        type: 'object',
        properties: {
          totalMinutes: { type: 'integer' },
          completedSessions: { type: 'integer' },
          streak: { type: 'integer' },
        },
      },
      PlannerEntry: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          itemType: { type: 'string', enum: ['PROGRAM_SESSION', 'CLASS'] },
          plannedAt: { type: 'string', format: 'date-time' },
          programSession: {
            type: 'object',
            nullable: true,
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              durationMin: { type: 'integer' },
              program: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                },
              },
            },
          },
          class: {
            type: 'object',
            nullable: true,
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string', nullable: true },
              schedule: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      PlannerEntryCreateRequest: {
        type: 'object',
        required: ['itemType', 'itemId', 'plannedAt'],
        properties: {
          itemType: { type: 'string', enum: ['PROGRAM_SESSION', 'CLASS'] },
          itemId: { type: 'string' },
          plannedAt: { type: 'string', format: 'date-time' },
        },
      },
      Pose: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          sanskritName: { type: 'string', nullable: true },
          englishName: { type: 'string' },
          difficulty: { type: 'string', enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] },
          bodyArea: { type: 'string' },
          description: { type: 'string' },
          imageUrl: { type: 'string', nullable: true },
        },
      },
      PoseUpsertRequest: {
        type: 'object',
        required: ['englishName', 'difficulty', 'bodyArea', 'description'],
        properties: {
          sanskritName: { type: 'string' },
          englishName: { type: 'string' },
          difficulty: { type: 'string', enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] },
          bodyArea: { type: 'string' },
          description: { type: 'string' },
          imageUrl: { type: 'string' },
        },
      },
      Class: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          description: { type: 'string', nullable: true },
          schedule: { type: 'string', format: 'date-time' },
          instructorId: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      ClassCreateRequest: {
        type: 'object',
        required: ['title', 'schedule', 'instructorId'],
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          schedule: { type: 'string', format: 'date-time' },
          instructorId: { type: 'string', format: 'uuid' },
        },
      },
      ClassUpdateRequest: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          schedule: { type: 'string', format: 'date-time' },
          instructorId: { type: 'string', format: 'uuid' },
        },
      },
      Booking: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          classId: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'CANCELLED'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      BookingRequest: {
        type: 'object',
        required: ['classId'],
        properties: {
          classId: { type: 'string', format: 'uuid' },
        },
      },
      Payment: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          provider: { type: 'string', enum: ['STRIPE', 'IYZICO'] },
          amount: { type: 'number', format: 'float' },
          currency: { type: 'string' },
          status: { type: 'string', enum: ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'] },
          transactionId: { type: 'string', nullable: true },
          bookingId: { type: 'string', nullable: true },
          subscriptionId: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CheckoutRequest: {
        type: 'object',
        required: ['plan'],
        properties: {
          plan: { type: 'string' },
          provider: { type: 'string', enum: ['stripe', 'iyzico'], default: 'stripe' },
          successUrl: { type: 'string', format: 'uri' },
          cancelUrl: { type: 'string', format: 'uri' },
        },
      },
      CheckoutResponse: {
        type: 'object',
        properties: {
          paymentId: { type: 'string' },
          provider: { type: 'string', enum: ['STRIPE', 'IYZICO'] },
          checkoutSessionId: { type: 'string', nullable: true },
          checkoutUrl: { type: 'string', nullable: true },
        },
      },
      StripeWebhookPayload: {
        type: 'object',
        required: ['type', 'data'],
        properties: {
          type: { type: 'string', example: 'invoice.paid' },
          data: {
            type: 'object',
            properties: {
              userId: { type: 'string' },
              plan: { type: 'string' },
              amount: { type: 'number', format: 'float' },
              currency: { type: 'string' },
              transactionId: { type: 'string' },
              currentPeriodEnd: { type: 'string', format: 'date-time' },
              cancelAtPeriodEnd: { type: 'boolean' },
              status: { type: 'string' },
            },
          },
        },
      },
      NotificationTestRequest: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          phoneNumber: { type: 'string' },
          deviceToken: { type: 'string' },
          message: { type: 'string' },
          subject: { type: 'string' },
        },
      },
      ReminderRequest: {
        type: 'object',
        properties: {
          classId: { type: 'string' },
          programSessionId: { type: 'string' },
          sendAt: { type: 'string', format: 'date-time' },
          channel: { type: 'string', enum: ['email', 'sms', 'push'], default: 'email' },
        },
        anyOf: [
          { required: ['classId'] },
          { required: ['programSessionId'] },
        ],
      },
      MediaUploadRequest: {
        type: 'object',
        required: ['filename', 'contentType'],
        properties: {
          filename: { type: 'string' },
          contentType: { type: 'string' },
        },
      },
      MediaUploadResponse: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          uploadUrl: { type: 'string' },
          fileUrl: { type: 'string' },
          expiresAt: { type: 'string', format: 'date-time' },
        },
      },
      AdminUsageReport: {
        type: 'object',
        properties: {
          generatedAt: { type: 'string', format: 'date-time' },
          totalUsers: { type: 'integer', example: 1280 },
          activeUsersLast7d: { type: 'integer', example: 312 },
          streakDistribution: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                length: {
                  type: 'integer',
                  description: 'Longest streak of consecutive booking days',
                  example: 4,
                },
                count: {
                  type: 'integer',
                  description: 'Number of users who reached this streak',
                  example: 47,
                },
              },
            },
          },
          topChallenges: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'chlg_123' },
                title: { type: 'string', example: 'Spring Detox Challenge' },
                enrollmentCount: { type: 'integer', example: 87 },
              },
            },
          },
        },
      },
      AdminUsageReportResponse: {
        type: 'object',
        properties: {
          report: { $ref: '#/components/schemas/AdminUsageReport' },
        },
      },
      AdminRevenueReport: {
        type: 'object',
        properties: {
          generatedAt: { type: 'string', format: 'date-time' },
          mrr: { type: 'number', format: 'float', example: 4280.5 },
          arr: { type: 'number', format: 'float', example: 51366 },
          activeSubscriptions: { type: 'integer', example: 640 },
          failedPayments: {
            type: 'object',
            properties: {
              countLast30d: { type: 'integer', example: 12 },
              totalAmountLast30d: { type: 'number', format: 'float', example: 599.88 },
              recent: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: 'pay_789' },
                    userId: { type: 'string', example: 'usr_456' },
                    amount: { type: 'number', format: 'float', example: 49.99 },
                    createdAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
      AdminRevenueReportResponse: {
        type: 'object',
        properties: {
          report: { $ref: '#/components/schemas/AdminRevenueReport' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          details: { type: 'object', additionalProperties: true },
        },
      },
    },
  },
};

const options: Options = {
  definition,
  apis: [
    path.join(__dirname, '../routes/*.{ts,js}'),
    path.join(__dirname, '../controllers/*.{ts,js}'),
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
