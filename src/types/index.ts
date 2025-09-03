import { Document } from 'mongoose';
import { Request } from 'express';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  interests: string[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IArticle extends Document {
  title: string;
  content: string;
  author: string;
  summary?: string;
  tags: string[];
  createdBy: IUser['_id'];
  createdAt: Date;
  updatedAt: Date;
}

export interface IInteraction extends Document {
  userId: IUser['_id'];
  articleId: IArticle['_id'];
  interactionType: 'view' | 'like' | 'share';
  createdAt: Date;
}

export interface AuthRequest extends Request {
  user?: IUser;
}

export interface JWTPayload {
  userId: string;
  username: string;
  iat?: number;
  exp?: number;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  offset?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}