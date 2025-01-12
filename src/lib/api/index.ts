// src/lib/api/index.ts
export * from './types';
export * from './errors';
export * from './utils';
export * from './client';

import AuthApi from './auth';
import ContentApi from './content';
import SubscriptionApi from './subscriptions';

export const authApi = new AuthApi();
export const contentApi = new ContentApi();
export const subscriptionApi = new SubscriptionApi();
