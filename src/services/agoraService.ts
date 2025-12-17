import crypto from 'crypto';
import { config } from '../utils/config';
import { logger } from '../utils/logger';

// ============================================
// Agora Configuration
// ============================================

const agoraConfig = {
  appId: config.AGORA_APP_ID || '',
  appCertificate: config.AGORA_APP_CERTIFICATE || '',
  customerId: config.AGORA_CUSTOMER_ID || '',
  customerSecret: config.AGORA_CUSTOMER_SECRET || '',
  recordingBucket: config.AGORA_RECORDING_BUCKET || '',
  recordingAccessKey: config.AGORA_RECORDING_ACCESS_KEY || '',
  recordingSecretKey: config.AGORA_RECORDING_SECRET_KEY || '',
  recordingRegion: config.AGORA_RECORDING_REGION || 'eu',
};

// ============================================
// Role Definitions
// ============================================

export enum RtcRole {
  PUBLISHER = 1,
  SUBSCRIBER = 2,
}

export enum RtmRole {
  USER = 'Rtm_User',
}

// ============================================
// Token Generation
// ============================================

function generatePrivilege(
  appId: string,
  appCertificate: string,
  channelName: string,
  uid: number | string,
  role: RtcRole,
  privilegeExpiredTs: number,
): string {
  const message = {
    salt: Math.floor(Math.random() * 100000),
    ts: Math.floor(Date.now() / 1000) + privilegeExpiredTs,
    privileges: {
      [role === RtcRole.PUBLISHER ? 1 : 2]: privilegeExpiredTs,
    },
  };

  const messageStr = JSON.stringify(message);
  const signature = crypto
    .createHmac('sha256', appCertificate)
    .update(`${appId}${channelName}${uid}${messageStr}`)
    .digest('base64');

  const content = Buffer.from(messageStr).toString('base64');
  return `006${appId}${Buffer.from(signature).toString('base64')}${content}`;
}

export function generateRtcToken(
  channelName: string,
  uid: number,
  role: RtcRole = RtcRole.SUBSCRIBER,
  expiresIn: number = 3600,
): string {
  if (!agoraConfig.appId || !agoraConfig.appCertificate) {
    logger.warn('Agora credentials not configured, returning mock token');
    return `mock_rtc_token_${channelName}_${uid}_${Date.now()}`;
  }

  try {
    // Use Agora's RtcTokenBuilder
    const { RtcTokenBuilder, RtcRole: AgoraRtcRole } = require('agora-access-token');

    const privilegeExpiredTs = Math.floor(Date.now() / 1000) + expiresIn;
    const agoraRole = role === RtcRole.PUBLISHER
      ? AgoraRtcRole.PUBLISHER
      : AgoraRtcRole.SUBSCRIBER;

    const token = RtcTokenBuilder.buildTokenWithUid(
      agoraConfig.appId,
      agoraConfig.appCertificate,
      channelName,
      uid,
      agoraRole,
      privilegeExpiredTs,
    );

    logger.info({ channelName, uid, role, expiresIn }, 'Generated RTC token');
    return token;
  } catch (error) {
    logger.error({ error }, 'Failed to generate RTC token, using fallback');
    return generatePrivilege(
      agoraConfig.appId,
      agoraConfig.appCertificate,
      channelName,
      uid,
      role,
      expiresIn,
    );
  }
}

export function generateRtmToken(userId: string, expiresIn: number = 3600): string {
  if (!agoraConfig.appId || !agoraConfig.appCertificate) {
    logger.warn('Agora credentials not configured, returning mock RTM token');
    return `mock_rtm_token_${userId}_${Date.now()}`;
  }

  try {
    const { RtmTokenBuilder, RtmRole } = require('agora-access-token');

    const privilegeExpiredTs = Math.floor(Date.now() / 1000) + expiresIn;
    const token = RtmTokenBuilder.buildToken(
      agoraConfig.appId,
      agoraConfig.appCertificate,
      userId,
      RtmRole.Rtm_User,
      privilegeExpiredTs,
    );

    logger.info({ userId, expiresIn }, 'Generated RTM token');
    return token;
  } catch (error) {
    logger.error({ error }, 'Failed to generate RTM token');
    return `mock_rtm_token_${userId}_${Date.now()}`;
  }
}

export function generateRecordingToken(
  channelName: string,
  uid: number,
  expiresIn: number = 86400, // 24 hours for recording
): string {
  return generateRtcToken(channelName, uid, RtcRole.SUBSCRIBER, expiresIn);
}

// ============================================
// Channel Management
// ============================================

export function createChannelName(streamId: string): string {
  const prefix = config.NODE_ENV === 'production' ? 'prod' : 'dev';
  return `${prefix}_stream_${streamId}`;
}

interface ChannelStatus {
  channelExist: boolean;
  mode: number;
  total: number;
  users: Array<{ uid: number }>;
}

export async function getChannelStatus(channelName: string): Promise<ChannelStatus> {
  if (!agoraConfig.customerId || !agoraConfig.customerSecret) {
    logger.warn('Agora REST credentials not configured');
    return { channelExist: false, mode: 0, total: 0, users: [] };
  }

  try {
    const auth = Buffer.from(
      `${agoraConfig.customerId}:${agoraConfig.customerSecret}`,
    ).toString('base64');

    const response = await fetch(
      `https://api.agora.io/dev/v1/channel/user/${agoraConfig.appId}/${channelName}`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Agora API error: ${response.status}`);
    }

    const data = await response.json() as { data?: ChannelStatus };
    logger.info({ channelName, data }, 'Got channel status');
    return data.data || { channelExist: false, mode: 0, total: 0, users: [] };
  } catch (error) {
    logger.error({ error, channelName }, 'Failed to get channel status');
    return { channelExist: false, mode: 0, total: 0, users: [] };
  }
}

export async function kickUser(channelName: string, uid: number): Promise<boolean> {
  if (!agoraConfig.customerId || !agoraConfig.customerSecret) {
    logger.warn('Agora REST credentials not configured');
    return false;
  }

  try {
    const auth = Buffer.from(
      `${agoraConfig.customerId}:${agoraConfig.customerSecret}`,
    ).toString('base64');

    const response = await fetch(
      `https://api.agora.io/dev/v1/kicking-rule`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appid: agoraConfig.appId,
          cname: channelName,
          uid,
          time: 0, // permanent until rule is deleted
          privileges: ['join_channel'],
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Agora API error: ${response.status}`);
    }

    logger.info({ channelName, uid }, 'Kicked user from channel');
    return true;
  } catch (error) {
    logger.error({ error, channelName, uid }, 'Failed to kick user');
    return false;
  }
}

export async function muteUser(
  channelName: string,
  uid: number,
  mute: boolean = true,
): Promise<boolean> {
  // Agora doesn't have a direct mute API - this is typically handled client-side
  // through signaling. We'll use RTM or Socket.IO to communicate mute status.
  logger.info({ channelName, uid, mute }, 'Mute user request (handled via signaling)');
  return true;
}

// ============================================
// Cloud Recording
// ============================================

interface RecordingConfig {
  channelName: string;
  uid: number;
  token: string;
}

interface AcquireResponse {
  resourceId: string;
}

interface StartRecordingResponse {
  sid: string;
  resourceId: string;
}

interface RecordingStatusResponse {
  resourceId: string;
  sid: string;
  serverResponse: {
    status: number;
    fileList?: Array<{
      filename: string;
      trackType: string;
      uid: string;
      mixedAllUser: boolean;
      isPlayable: boolean;
      sliceStartTime: number;
    }>;
  };
}

export async function acquireRecordingResource(
  channelName: string,
  uid: number = 0,
): Promise<string | null> {
  if (!agoraConfig.customerId || !agoraConfig.customerSecret) {
    logger.warn('Agora REST credentials not configured');
    return null;
  }

  try {
    const auth = Buffer.from(
      `${agoraConfig.customerId}:${agoraConfig.customerSecret}`,
    ).toString('base64');

    const response = await fetch(
      `https://api.agora.io/v1/apps/${agoraConfig.appId}/cloud_recording/acquire`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cname: channelName,
          uid: uid.toString(),
          clientRequest: {
            resourceExpiredHour: 24,
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Agora API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as AcquireResponse;
    logger.info({ channelName, resourceId: data.resourceId }, 'Acquired recording resource');
    return data.resourceId;
  } catch (error) {
    logger.error({ error, channelName }, 'Failed to acquire recording resource');
    return null;
  }
}

export async function startRecording(
  channelName: string,
  resourceId: string,
  uid: number = 0,
  token?: string,
): Promise<StartRecordingResponse | null> {
  if (!agoraConfig.customerId || !agoraConfig.customerSecret) {
    logger.warn('Agora REST credentials not configured');
    return null;
  }

  try {
    const auth = Buffer.from(
      `${agoraConfig.customerId}:${agoraConfig.customerSecret}`,
    ).toString('base64');

    const recordingToken = token || generateRecordingToken(channelName, uid);

    const response = await fetch(
      `https://api.agora.io/v1/apps/${agoraConfig.appId}/cloud_recording/resourceid/${resourceId}/mode/mix/start`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cname: channelName,
          uid: uid.toString(),
          clientRequest: {
            token: recordingToken,
            recordingConfig: {
              maxIdleTime: 300,
              streamTypes: 2, // both audio and video
              channelType: 1, // live broadcast
              videoStreamType: 0, // high-quality
              transcodingConfig: {
                height: 720,
                width: 1280,
                bitrate: 2260,
                fps: 30,
                mixedVideoLayout: 1, // adaptive layout
                backgroundColor: '#000000',
              },
            },
            recordingFileConfig: {
              avFileType: ['hls', 'mp4'],
            },
            storageConfig: {
              vendor: 1, // AWS S3
              region: getAWSRegionCode(agoraConfig.recordingRegion),
              bucket: agoraConfig.recordingBucket,
              accessKey: agoraConfig.recordingAccessKey,
              secretKey: agoraConfig.recordingSecretKey,
              fileNamePrefix: ['recordings', channelName],
            },
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Agora API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as StartRecordingResponse;
    logger.info({ channelName, resourceId, sid: data.sid }, 'Started recording');
    return data;
  } catch (error) {
    logger.error({ error, channelName, resourceId }, 'Failed to start recording');
    return null;
  }
}

export async function stopRecording(
  channelName: string,
  resourceId: string,
  sid: string,
  uid: number = 0,
): Promise<boolean> {
  if (!agoraConfig.customerId || !agoraConfig.customerSecret) {
    logger.warn('Agora REST credentials not configured');
    return false;
  }

  try {
    const auth = Buffer.from(
      `${agoraConfig.customerId}:${agoraConfig.customerSecret}`,
    ).toString('base64');

    const response = await fetch(
      `https://api.agora.io/v1/apps/${agoraConfig.appId}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/mix/stop`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cname: channelName,
          uid: uid.toString(),
          clientRequest: {},
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Agora API error: ${response.status} - ${errorText}`);
    }

    logger.info({ channelName, resourceId, sid }, 'Stopped recording');
    return true;
  } catch (error) {
    logger.error({ error, channelName, resourceId, sid }, 'Failed to stop recording');
    return false;
  }
}

export async function queryRecordingStatus(
  resourceId: string,
  sid: string,
): Promise<RecordingStatusResponse | null> {
  if (!agoraConfig.customerId || !agoraConfig.customerSecret) {
    logger.warn('Agora REST credentials not configured');
    return null;
  }

  try {
    const auth = Buffer.from(
      `${agoraConfig.customerId}:${agoraConfig.customerSecret}`,
    ).toString('base64');

    const response = await fetch(
      `https://api.agora.io/v1/apps/${agoraConfig.appId}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/mix/query`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Agora API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as RecordingStatusResponse;
    logger.info({ resourceId, sid, status: data.serverResponse?.status }, 'Got recording status');
    return data;
  } catch (error) {
    logger.error({ error, resourceId, sid }, 'Failed to query recording status');
    return null;
  }
}

// ============================================
// Helper Functions
// ============================================

function getAWSRegionCode(region: string): number {
  const regionMap: Record<string, number> = {
    'us-east-1': 0,
    'us-east-2': 1,
    'us-west-1': 2,
    'us-west-2': 3,
    'eu-west-1': 4,
    'eu-west-2': 5,
    'eu-west-3': 6,
    'eu-central-1': 7,
    'ap-southeast-1': 8,
    'ap-southeast-2': 9,
    'ap-northeast-1': 10,
    'ap-northeast-2': 11,
    'sa-east-1': 12,
    'ca-central-1': 13,
    'ap-south-1': 14,
    'cn-north-1': 15,
    'cn-northwest-1': 16,
    'us-gov-west-1': 17,
    eu: 7, // default to eu-central-1
  };
  return regionMap[region] ?? 7;
}

export function generateUniqueUid(): number {
  // Generate a unique UID for Agora (must be a positive 32-bit integer)
  return Math.floor(Math.random() * 2147483647) + 1;
}

export function isAgoraConfigured(): boolean {
  return Boolean(agoraConfig.appId && agoraConfig.appCertificate);
}

export function getAgoraAppId(): string {
  return agoraConfig.appId;
}
