import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Patient } from '@/models';
import { requireAuth, generateMRN } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin', 'staff', 'doctor', 'nurse', 'medical']);
    if (authResult instanceof NextResponse) return authResult;

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const query: any = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    
    if (status) {
      query.status = status;
    }

    const total = await Patient.countDocuments(query);
    const patients = await Patient.find(query)
      .populate('assignedDoctor', 'name department')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      success: true,
      patients,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get patients error:', error);
    return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin', 'staff']);
    if (authResult instanceof NextResponse) return authResult;

    await connectDB();

    const data = await request.json();

    // Generate MRN
    data.mrn = generateMRN();

    // Validation
    if (!data.name || !data.dateOfBirth || !data.gender || !data.phone) {
      return NextResponse.json(
        { error: 'Name, date of birth, gender, and phone are required' },
        { status: 400 }
      );
    }

    // Parse dateOfBirth if string
    if (typeof data.dateOfBirth === 'string') {
      data.dateOfBirth = new Date(data.dateOfBirth);
    }

    const patient = await Patient.create(data);

    return NextResponse.json({
      success: true,
      patient,
      message: 'Patient registered successfully',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create patient error:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'A patient with this email or phone already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Failed to register patient' }, { status: 500 });
  }
}
