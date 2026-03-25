import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Billing } from '@/models';
import { requireAuth } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(['admin', 'staff']);
    if (authResult instanceof NextResponse) return authResult;

    await connectDB();
    const { id } = await params;
    const { amount, paymentMethod } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid payment amount is required' },
        { status: 400 }
      );
    }

    const billing = await Billing.findById(id);

    if (!billing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (billing.status === 'paid') {
      return NextResponse.json(
        { error: 'This invoice is already fully paid' },
        { status: 400 }
      );
    }

    if (billing.status === 'cancelled') {
      return NextResponse.json(
        { error: 'This invoice has been cancelled' },
        { status: 400 }
      );
    }

    // Calculate new payment
    const newAmountPaid = billing.amountPaid + amount;
    const newBalanceDue = billing.total - newAmountPaid;

    // Determine new status
    let newStatus = 'partial';
    let paidDate = null;

    if (newBalanceDue <= 0) {
      newStatus = 'paid';
      paidDate = new Date();
    } else if (newBalanceDue < billing.balanceDue) {
      newStatus = 'partial';
    }

    const updatedBilling = await Billing.findByIdAndUpdate(
      id,
      {
        amountPaid: newAmountPaid,
        balanceDue: Math.max(0, newBalanceDue),
        status: newStatus,
        paidDate,
        paymentMethod: paymentMethod || billing.paymentMethod,
        updatedAt: new Date(),
      },
      { new: true }
    )
      .populate('patientId', 'name mrn phone email')
      .populate('createdBy', 'name');

    return NextResponse.json({
      success: true,
      billing: updatedBilling,
      message: `Payment of $${amount.toFixed(2)} processed successfully`,
    });
  } catch (error) {
    console.error('Process payment error:', error);
    return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 });
  }
}
