import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Billing } from '@/models';
import { requireAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(['admin', 'staff']);
    if (authResult instanceof NextResponse) return authResult;

    await connectDB();
    const { id } = await params;

    const billing = await Billing.findById(id)
      .populate('patientId', 'name mrn phone email address')
      .populate('createdBy', 'name');

    if (!billing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      billing,
    });
  } catch (error) {
    console.error('Get bill error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(['admin', 'staff']);
    if (authResult instanceof NextResponse) return authResult;

    await connectDB();
    const { id } = await params;
    const data = await request.json();

    const billing = await Billing.findById(id);

    if (!billing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // If updating items, recalculate
    if (data.items) {
      const subtotal = data.items.reduce((sum: number, item: any) => sum + item.total, 0);
      const discountAmount = (subtotal * (data.discountPercent || 0)) / 100;
      const afterDiscount = subtotal - discountAmount;
      const taxAmount = (afterDiscount * (data.taxPercent || 0)) / 100;
      const total = afterDiscount + taxAmount;

      data.subtotal = subtotal;
      data.discountAmount = discountAmount;
      data.taxAmount = taxAmount;
      data.total = total;
      data.balanceDue = total - billing.amountPaid;
    }

    const updatedBilling = await Billing.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
      .populate('patientId', 'name mrn phone email')
      .populate('createdBy', 'name');

    return NextResponse.json({
      success: true,
      billing: updatedBilling,
      message: 'Invoice updated successfully',
    });
  } catch (error) {
    console.error('Update bill error:', error);
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(['admin']);
    if (authResult instanceof NextResponse) return authResult;

    await connectDB();
    const { id } = await params;

    const billing = await Billing.findById(id);

    if (!billing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (billing.status === 'paid' || billing.amountPaid > 0) {
      return NextResponse.json(
        { error: 'Cannot delete an invoice with payments' },
        { status: 400 }
      );
    }

    await Billing.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Invoice deleted successfully',
    });
  } catch (error) {
    console.error('Delete bill error:', error);
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}
