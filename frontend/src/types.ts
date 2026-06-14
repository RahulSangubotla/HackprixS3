// src/types.ts\
/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type {
  GoogleGenAIOptions,
  Part,
} from "@google/genai";
import {
  LiveClientToolResponse,
  LiveServerMessage,
} from "@google/genai";

/**
 * the options to initiate the client, ensure apiKey is required
 */
export type LiveClientOptions = GoogleGenAIOptions & { apiKey: string };

/** log types */
export type StreamingLog = {
  date: Date;
  type: string;
  count?: number;
  message:
    | string
    | ClientContentLog
    | Omit<LiveServerMessage, "text" | "data">
    | LiveClientToolResponse;
};

export type ClientContentLog = {
  turns: Part[];
  turnComplete: boolean;
};

export interface User {
    id: number;
    username: string;
    email: string;
    role: "student" | "teacher" | "admin";
    institution: number | null;
    institution_name: string | null;
    class_group: number | null;
    class_group_name: string | null;
    wallet_address: string | null;
    mobile_number: string | null;
    profile_image: string | null;
    gender: "male" | "female" | "other" | null;
    date_of_birth: string | null;
    bio: string | null;
  }
  
export interface ProductCategory {
    id: number;
    name: string;
    slug: string;
    description: string;
    is_active: boolean;
  }
  
export interface Product {
    id: number;
    category: number;
    category_name: string;
    name: string;
    description: string;
    product_type: string;
    points_price: number;
    stock: number | null;
    is_digital: boolean;
    digital_file: string | null;
    external_url: string | null;
    thumbnail: string | null;
    metadata: any | null;
    is_active: boolean;
    featured: boolean;
    created_at: string;
    updated_at: string;
    is_unlimited: boolean;
  }
  
export interface CartItem {
    id: number;
    product: Product;
    quantity: number;
    total_points: number;
  }
  
export interface Cart {
    id: number;
    user: number;
    items: CartItem[];
    total_cart_points: number;
    created_at: string;
  }
  
export interface Redemption {
    id: number;
    user: number;
    user_username: string;
    product: number;
    product_name: string;
    quantity: number;
    points_spent: number;
    status: string;
    tx_hash: string | null;
    delivery_email: string | null;
    delivery_notes: string | null;
    shipping_address: string | null;
    contact_phone: string | null;
    created_at: string;
    updated_at: string;
  }