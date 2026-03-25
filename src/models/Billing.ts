import mongoose, { Schema, Document } from 'mongoose';

export interface IBilling extends Document {
  patientId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  status: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  dueDate: Date;
  paidDate?: Date;
  paymentMethod?: 'cash' | 'card' | 'insurance' | 'plan';
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BillingSchema: Schema = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    invoiceNumber: { type: String, required: true, unique: true },
    items: [{
      description: { type: String, required: true },
      quantity: { type: Number, required: true, default: 1 },
      unitPrice: { type: Number, required: true },
      total: { type: Number, required: true },
    }],
    subtotal: { type: Number, required: true },
    discountPercent: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    taxPercent: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    balanceDue: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'overdue', 'cancelled'],
      default: 'pending',
    },
    dueDate: { type: Date, required: true },
    paidDate: { type: Date },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'insurance', 'plan'],
    },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

BillingSchema.index({ patientId: 1 });
BillingSchema.index({ invoiceNumber: 1 });
BillingSchema.index({ status: 1 });
BillingSchema.index({ dueDate: 1 });

export const Billing =
  mongoose.models.Billing || mongoose.model<IBilling>('Billing', BillingSchema);
