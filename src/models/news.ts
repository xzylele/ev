import mongoose, { Schema } from 'mongoose';

export interface INews {
  title: string;
  link: string;
  image: string;
  description: string;
  date: string;
  timestamp: number;
  source: string;
  hidden: boolean;
  isCustom: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const NewsSchema = new Schema<INews>(
  {
    title: { type: String, required: true, trim: true },
    link: { type: String, required: true, unique: true, trim: true },
    image: { type: String, default: '' },
    description: { type: String, default: '', trim: true },
    date: { type: String, required: true },
    timestamp: { type: Number, required: true },
    source: { type: String, required: true, default: 'Admin' },
    hidden: { type: Boolean, default: false },
    isCustom: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const News = mongoose.models.News || mongoose.model<INews>('News', NewsSchema);

export default News;
