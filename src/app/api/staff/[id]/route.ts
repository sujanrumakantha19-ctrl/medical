import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User, Appointment, Billing } from '@/models';
import { requireAuth, hashPassword } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(['admin']);
    if (authResult instanceof NextResponse) return authResult;

    await connectDB();
    const { id } = await params;

    const user = await User.findById(id).select('-password');

    if (!user) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // Get stats
    const stats = {
      appointments: await Appointment.countDocuments({ doctorId: id }),
      pendingBilling: await Billing.countDocuments({ createdBy: id, status: 'pending' }),
    };

    return NextResponse.json({
      success: true,
      user,
      stats,
    });
  } catch (error) {
    console.error('Get staff error:', error);
    return NextResponse.json({ error: 'Failed to fetch staff member' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(['admin']);
    if (authResult instanceof NextResponse) return authResult;

    await connectDB();
    const { id } = await params;
    const data = await request.json();

    // If updating email, check for duplicates
    if (data.email) {
      const existingUser = await User.findOne({ 
        email: data.email.toLowerCase(), 
        _id: { $ne: id } 
      });
      if (existingUser) {
        return NextResponse.json(
          { error: 'A user with this email already exists' },
          { status: 400 }
        );
      }
      data.email = data.email.toLowerCase();
    }

    // If updating password, hash it
    if (data.password) {
      data.password = await hashPassword(data.password);
    }

    const user = await User.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user,
      message: 'Staff member updated successfully',
    });
  } catch (error) {
    console.error('Update staff error:', error);
    return NextResponse.json({ error: 'Failed to update staff member' }, { status: 500 });
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

    // Check for related appointments
    const appointments = await Appointment.countDocuments({ doctorId: id });
    
    if (appointments > 0) {
      // Soft delete - just deactivate
      const user = await User.findByIdAndUpdate(
        id,
        { isActive: false, updatedAt: new Date() },
        { new: true }
      ).select('-password');

      if (!user) {
        return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: 'Staff member deactivated (has existing appointments)',
        user,
      });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Staff member deleted successfully',
    });
  } catch (error) {
    console.error('Delete staff error:', error);
    return NextResponse.json({ error: 'Failed to delete staff member' }, { status: 500 });
  }
}
