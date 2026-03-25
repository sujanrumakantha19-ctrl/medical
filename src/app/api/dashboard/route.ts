import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Patient, Appointment, User, Billing } from '@/models';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin', 'staff']);
    if (authResult instanceof NextResponse) return authResult;

    await connectDB();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    // Get counts
    const [
      totalPatients,
      todayAppointments,
      totalStaff,
      pendingBills,
    ] = await Promise.all([
      Patient.countDocuments(),
      Appointment.countDocuments({
        date: { $gte: today, $lt: tomorrow },
        status: { $nin: ['cancelled'] },
      }),
      User.countDocuments({ role: { $in: ['staff', 'doctor', 'nurse'] }, isActive: true }),
      Billing.countDocuments({ status: 'pending' }),
    ]);

    // Today's appointment list
    const todayAppointmentsList = await Appointment.find({
      date: { $gte: today, $lt: tomorrow },
      status: { $nin: ['cancelled', 'no-show'] },
    })
      .populate('patientId', 'name phone mrn')
      .populate('doctorId', 'name department')
      .sort({ time: 1 })
      .limit(10);

    // Recent patients
    const recentPatients = await Patient.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name mrn status createdAt');

    // Department occupancy (mock for now)
    const departments = [
      { name: 'Emergency', occupancy: 75, capacity: 30 },
      { name: 'General Medicine', occupancy: 60, capacity: 50 },
      { name: 'Cardiology', occupancy: 45, capacity: 20 },
      { name: 'Pediatrics', occupancy: 80, capacity: 25 },
      { name: 'Orthopedics', occupancy: 55, capacity: 20 },
      { name: 'Neurology', occupancy: 40, capacity: 15 },
    ];

    // Monthly revenue
    const monthlyRevenue = await Billing.aggregate([
      {
        $match: {
          status: 'paid',
          paidDate: { $gte: thisMonthStart },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amountPaid' },
        },
      },
    ]);

    // Last month revenue
    const lastMonthRevenue = await Billing.aggregate([
      {
        $match: {
          status: 'paid',
          paidDate: { $gte: lastMonthStart, $lt: lastMonthEnd },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amountPaid' },
        },
      },
    ]);

    // Outstanding balance
    const outstandingBalance = await Billing.aggregate([
      {
        $match: { status: { $in: ['pending', 'partial', 'overdue'] } },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$balanceDue' },
        },
      },
    ]);

    // Appointment status breakdown
    const appointmentStats = await Appointment.aggregate([
      { $match: { date: { $gte: thisMonthStart } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Weekly appointments for chart
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 6);
    
    const weeklyAppointments = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: weekStart, $lt: tomorrow },
          status: { $nin: ['cancelled'] },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalPatients,
        todayAppointments,
        totalStaff,
        pendingBills,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        lastMonthRevenue: lastMonthRevenue[0]?.total || 0,
        outstandingBalance: outstandingBalance[0]?.total || 0,
        departments,
        appointmentStats,
        weeklyAppointments,
      },
      todayAppointmentsList,
      recentPatients,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
