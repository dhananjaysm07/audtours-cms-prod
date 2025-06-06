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
import StoreApi from "./store";
import TemplateApi from "./template";

export const authApi = new AuthApi();
export const contentApi = new ContentApi();
export const subscriptionApi = new SubscriptionApi();
export const languageApi = new LanguageApi();
export const artistApi = new ArtistApi();
export const storeApi = new StoreApi();
export const templateApi = new TemplateApi();
