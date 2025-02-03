// src/lib/api/index.ts
export * from "./types";
export * from "./errors";
export * from "./utils";
export * from "./client";

import AuthApi from "./auth";
import ContentApi from "./content";
import SubscriptionApi from "./subscriptions";
import LanguageApi from "./language";
import ArtistApi from "./artist";

export const authApi = new AuthApi();
export const contentApi = new ContentApi();
export const subscriptionApi = new SubscriptionApi();
export const languageApi = new LanguageApi();
export const artistApi = new ArtistApi();
