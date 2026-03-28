import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Patient, MedicalRecord, Appointment, Billing } from '@/models';
import { requireAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(['admin', 'staff', 'doctor', 'nurse']);
    if (authResult instanceof NextResponse) return authResult;

    await connectDB();
    const { id } = await params;

    const patient = await Patient.findById(id).populate('assignedDoctor', 'name department');

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Get medical records
    const records = await MedicalRecord.find({ patientId: id })
      .populate('doctorId', 'name')
      .sort({ date: -1 })
      .limit(10);

    // Get recent appointments
    const appointments = await Appointment.find({ patientId: id })
      .populate('doctorId', 'name')
      .sort({ date: -1 })
      .limit(5);

    // Get billing info
    const billing = await Billing.find({ patientId: id })
      .sort({ createdAt: -1 })
      .limit(5);

    return NextResponse.json({
      success: true,
      patient,
      records,
      appointments,
      billing,
    });
  } catch (error) {
    console.error('Get patient error:', error);
    return NextResponse.json({ error: 'Failed to fetch patient' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(['admin', 'staff', 'doctor']);
    if (authResult instanceof NextResponse) return authResult;

    await connectDB();
    const { id } = await params;
    const data = await request.json();

    // Handle medical history - use $push to add to array
    let updateQuery: any = { ...data, updatedAt: new Date() };
    
    if (data.medicalHistory && Array.isArray(data.medicalHistory)) {
      // Remove medicalHistory from the spread and use $push instead
      delete updateQuery.medicalHistory;
      updateQuery = {
        $push: { medicalHistory: { $each: data.medicalHistory } },
        updatedAt: new Date()
      };
    }

    // Parse dateOfBirth if string
    if (data.dateOfBirth && typeof data.dateOfBirth === 'string') {
      data.dateOfBirth = new Date(data.dateOfBirth);
    }

    const patient = await Patient.findByIdAndUpdate(
      id,
      updateQuery,
      { new: true, runValidators: true }
    );

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      patient,
      message: 'Patient updated successfully',
    });
  } catch (error: any) {
    console.error('Update patient error:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'A patient with this email or phone already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Failed to update patient' }, { status: 500 });
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

    // Check for related records
    const appointments = await Appointment.countDocuments({ patientId: id });
    const billing = await Billing.countDocuments({ patientId: id });

    if (appointments > 0 || billing > 0) {
      return NextResponse.json(
        { error: 'Cannot delete patient with existing appointments or billing records' },
        { status: 400 }
      );
    }

    const patient = await Patient.findByIdAndDelete(id);

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Patient deleted successfully',
    });
  } catch (error) {
    console.error('Delete patient error:', error);
    return NextResponse.json({ error: 'Failed to delete patient' }, { status: 500 });
  }
}
