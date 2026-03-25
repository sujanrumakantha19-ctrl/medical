import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Appointment, Patient } from '@/models';
import { requireAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(['admin', 'staff', 'doctor']);
    if (authResult instanceof NextResponse) return authResult;

    await connectDB();
    const { id } = await params;

    const appointment = await Appointment.findById(id)
      .populate('patientId', 'name phone email mrn dateOfBirth gender address')
      .populate('doctorId', 'name department')
      .populate('staffId', 'name');

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      appointment,
    });
  } catch (error) {
    console.error('Get appointment error:', error);
    return NextResponse.json({ error: 'Failed to fetch appointment' }, { status: 500 });
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

    // Parse date if string
    if (data.date && typeof data.date === 'string') {
      data.date = new Date(data.date);
    }

    // Check for conflicts if rescheduling
    if (data.doctorId && data.date && data.time) {
      const existingAppointment = await Appointment.findOne({
        _id: { $ne: id },
        doctorId: data.doctorId,
        date: data.date,
        time: data.time,
        status: { $nin: ['cancelled', 'no-show'] },
      });

      if (existingAppointment) {
        return NextResponse.json(
          { error: 'This time slot is already booked' },
          { status: 400 }
        );
      }
    }

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
      .populate('patientId', 'name phone email mrn')
      .populate('doctorId', 'name department')
      .populate('staffId', 'name');

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      appointment,
      message: 'Appointment updated successfully',
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(['admin', 'staff', 'doctor']);
    if (authResult instanceof NextResponse) return authResult;

    await connectDB();
    const { id } = await params;
    const { action } = await request.json();

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    let newStatus: string;

    switch (action) {
      case 'check-in':
        newStatus = 'checked-in';
        break;
      case 'start':
        newStatus = 'in-progress';
        break;
      case 'complete':
        newStatus = 'completed';
        // Update patient to completed visit
        await Patient.findByIdAndUpdate(appointment.patientId, { status: 'outpatient' });
        break;
      case 'cancel':
        newStatus = 'cancelled';
        break;
      case 'no-show':
        newStatus = 'no-show';
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    appointment.status = newStatus;
    appointment.updatedAt = new Date();
    await appointment.save();

    const updatedAppointment = await Appointment.findById(id)
      .populate('patientId', 'name phone email mrn')
      .populate('doctorId', 'name department');

    return NextResponse.json({
      success: true,
      appointment: updatedAppointment,
      message: `Appointment marked as ${newStatus}`,
    });
  } catch (error) {
    console.error('Update appointment status error:', error);
    return NextResponse.json({ error: 'Failed to update appointment status' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(['admin', 'staff']);
    if (authResult instanceof NextResponse) return authResult;

    await connectDB();
    const { id } = await params;

    const appointment = await Appointment.findByIdAndDelete(id);

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Appointment deleted successfully',
    });
  } catch (error) {
    console.error('Delete appointment error:', error);
    return NextResponse.json({ error: 'Failed to delete appointment' }, { status: 500 });
  }
}
