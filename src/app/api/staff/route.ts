import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models';
import { requireAuth, hashPassword, generateEmployeeId } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin', 'staff', 'doctor', 'medical']);
    if (authResult instanceof NextResponse) return authResult;

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const department = searchParams.get('department') || '';
    const isActive = searchParams.get('isActive');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
      ];
    }

    if (role) {
      query.role = role;
    }

    if (department) {
      query.department = department;
    }

    if (isActive !== null && isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const total = await User.countDocuments(query);
    const staff = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      success: true,
      staff,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get staff error:', error);
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin']);
    if (authResult instanceof NextResponse) return authResult;

    await connectDB();

    const data = await request.json();

    // Validation
    if (!data.name || !data.email || !data.password || !data.role) {
      return NextResponse.json(
        { error: 'Name, email, password, and role are required' },
        { status: 400 }
      );
    }

    // Set default department if not provided
    if (!data.department) {
      data.department = data.role === 'Admin' ? 'Administration' : 'Front Desk';
    }

    // Check if email exists
    const existingUser = await User.findOne({ email: data.email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      );
    }

    // Generate employee ID
    data.employeeId = generateEmployeeId();
    
    // Hash password
    data.password = await hashPassword(data.password);

    // Normalize email
    data.email = data.email.toLowerCase();

    // Normalize role to lowercase
    data.role = data.role.toLowerCase();

    const user = await User.create(data);

    return NextResponse.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        department: user.department,
        phone: user.phone,
        isActive: user.isActive,
      },
      message: 'Staff member added successfully',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create staff error:', error);
    return NextResponse.json({ error: 'Failed to add staff member' }, { status: 500 });
  }
}
