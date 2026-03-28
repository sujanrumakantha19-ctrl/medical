import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Patient } from '@/models';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(['medical']);
    if (authResult instanceof NextResponse) return authResult;

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const patientId = searchParams.get('patientId');

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { mrn: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      query.status = status;
    }

    if (patientId) {
      query._id = patientId;
    }

    const patients = await Patient.find(query)
      .populate('assignedDoctor', 'name department')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      patients,
    });
  } catch (error) {
    console.error('Get patients error:', error);
    return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 });
  }
}
