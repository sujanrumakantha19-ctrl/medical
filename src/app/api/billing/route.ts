import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Billing, Patient } from '@/models';
import { requireAuth, generateInvoiceNumber } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin', 'staff']);
    if (authResult instanceof NextResponse) return authResult;

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      const patients = await Patient.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { mrn: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');
      
      query.patientId = { $in: patients.map(p => p._id) };
    }

    const total = await Billing.countDocuments(query);
    const bills = await Billing.find(query)
      .populate('patientId', 'name mrn phone email')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Calculate stats
    const stats = {
      totalOutstanding: await Billing.aggregate([
        { $match: { status: { $in: ['pending', 'partial', 'overdue'] } } },
        { $group: { _id: null, total: { $sum: '$balanceDue' } } },
      ]),
      totalCollected: await Billing.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } },
      ]),
      pendingCount: await Billing.countDocuments({ status: 'pending' }),
      overdueAmount: await Billing.aggregate([
        { $match: { status: 'overdue' } },
        { $group: { _id: null, total: { $sum: '$balanceDue' } } },
      ]),
    };

    return NextResponse.json({
      success: true,
      bills,
      stats: {
        totalOutstanding: stats.totalOutstanding[0]?.total || 0,
        totalCollected: stats.totalCollected[0]?.total || 0,
        pendingCount: stats.pendingCount,
        overdueAmount: stats.overdueAmount[0]?.total || 0,
      },
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get bills error:', error);
    return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin', 'staff']);
    if (authResult instanceof NextResponse) return authResult;

    await connectDB();

    const data = await request.json();

    // Validation
    if (!data.patientId || !data.items || data.items.length === 0) {
      return NextResponse.json(
        { error: 'Patient and at least one item are required' },
        { status: 400 }
      );
    }

    // Calculate totals
    const subtotal = data.items.reduce((sum: number, item: any) => sum + item.total, 0);
    const discountAmount = (subtotal * (data.discountPercent || 0)) / 100;
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = (afterDiscount * (data.taxPercent || 0)) / 100;
    const total = afterDiscount + taxAmount;

    // Generate invoice number
    const invoiceNumber = generateInvoiceNumber();

    // Set due date (default 7 days from now)
    const dueDate = data.dueDate ? new Date(data.dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const billing = await Billing.create({
      ...data,
      invoiceNumber,
      subtotal,
      discountAmount,
      taxAmount,
      total,
      balanceDue: total,
      amountPaid: 0,
      status: 'pending',
      dueDate,
      createdBy: authResult.id,
    });

    const populatedBilling = await Billing.findById(billing._id)
      .populate('patientId', 'name mrn phone email')
      .populate('createdBy', 'name');

    return NextResponse.json({
      success: true,
      billing: populatedBilling,
      message: 'Invoice created successfully',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create bill error:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
