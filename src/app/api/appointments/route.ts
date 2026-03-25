import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Appointment, Patient } from '@/models';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin', 'staff', 'doctor']);
    if (authResult instanceof NextResponse) return authResult;

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const date = searchParams.get('date') || '';
    const doctorId = searchParams.get('doctorId') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.date = { $gte: startDate, $lt: endDate };
    }

    if (doctorId) {
      query.doctorId = doctorId;
    }

    if (search) {
      const patients = await Patient.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');
      
      query.patientId = { $in: patients.map(p => p._id) };
    }

    const total = await Appointment.countDocuments(query);
    const appointments = await Appointment.find(query)
      .populate('patientId', 'name phone email mrn')
      .populate('doctorId', 'name department')
      .populate('staffId', 'name')
      .sort({ date: 1, time: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      success: true,
      appointments,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin', 'staff']);
    if (authResult instanceof NextResponse) return authResult;

    await connectDB();

    const data = await request.json();

    // Validation
    if (!data.patientId || !data.doctorId || !data.date || !data.time || !data.type || !data.reason) {
      return NextResponse.json(
        { error: 'Patient, doctor, date, time, type, and reason are required' },
        { status: 400 }
      );
    }

    // Parse date if string
    if (typeof data.date === 'string') {
      data.date = new Date(data.date);
    }

    // Check for conflicting appointments
    const existingAppointment = await Appointment.findOne({
      doctorId: data.doctorId,
      date: data.date,
      time: data.time,
      status: { $nin: ['cancelled', 'no-show'] },
    });

    if (existingAppointment) {
      return NextResponse.json(
        { error: 'This time slot is already booked for the selected doctor' },
        { status: 400 }
      );
    }

    // Add staff who created the appointment
    data.staffId = authResult.id;
    data.status = data.status || 'scheduled';

    const appointment = await Appointment.create(data);

    // Update patient status if needed
    await Patient.findByIdAndUpdate(data.patientId, { status: 'outpatient' });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patientId', 'name phone email mrn')
      .populate('doctorId', 'name department')
      .populate('staffId', 'name');

    return NextResponse.json({
      success: true,
      appointment: populatedAppointment,
      message: 'Appointment scheduled successfully',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create appointment error:', error);
    return NextResponse.json({ error: 'Failed to schedule appointment' }, { status: 500 });
  }
}
