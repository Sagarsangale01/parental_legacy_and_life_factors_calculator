import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  preferences: {
    theme: 'dark' | 'light';
    defaultExportFormat: 'pdf' | 'csv';
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false // Exclude from query results by default to protect credentials
    },
    preferences: {
      theme: {
        type: String,
        enum: ['dark', 'light'],
        default: 'dark'
      },
      defaultExportFormat: {
        type: String,
        enum: ['pdf', 'csv'],
        default: 'pdf'
      }
    }
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
