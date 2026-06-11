import mongoose, { Schema } from 'mongoose';

export interface IReview {
  evId: mongoose.Types.ObjectId | string;
  userName: string;
  rating: number; // overall rating 1-5
  ratingBattery: number; // 1-5
  ratingPerformance: number; // 1-5
  ratingComfort: number; // 1-5
  pros: string;
  cons: string;
  comment: string;
  approved: boolean; // For moderation
  createdAt?: Date;
  updatedAt?: Date;
}


const ReviewSchema = new Schema<IReview>(
  {
    evId: { type: Schema.Types.ObjectId, ref: 'EV', required: true },
    userName: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    ratingBattery: { type: Number, required: true, min: 1, max: 5 },
    ratingPerformance: { type: Number, required: true, min: 1, max: 5 },
    ratingComfort: { type: Number, required: true, min: 1, max: 5 },
    pros: { type: String, required: true, trim: true },
    cons: { type: String, required: true, trim: true },
    comment: { type: String, required: true, trim: true },
    approved: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Review = mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);

export default Review;
