import mongoose, { Schema } from 'mongoose';
import { IInteraction } from '../types';

const interactionSchema = new Schema<IInteraction>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  articleId: {
    type: Schema.Types.ObjectId,
    ref: 'Article',
    required: [true, 'Article ID is required'],
  },
  interactionType: {
    type: String,
    required: [true, 'Interaction type is required'],
    enum: {
      values: ['view', 'like', 'share'],
      message: 'Interaction type must be view, like, or share',
    },
  },
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete (ret as any).__v;
      return ret;
    },
  },
});

interactionSchema.index({ userId: 1, articleId: 1, interactionType: 1 }, { unique: true });
interactionSchema.index({ articleId: 1 });
interactionSchema.index({ userId: 1 });
interactionSchema.index({ createdAt: -1 });

export const Interaction = mongoose.model<IInteraction>('Interaction', interactionSchema);