import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models';
import { comparePassword, setAuthCookie, authError } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return authError('Email and password are required');
    }
    
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return authError('Invalid email or password');
    }
    
    if (!user.isActive) {
      return authError('Your account has been deactivated. Please contact administrator.');
    }
    
    const isValidPassword = await comparePassword(password, user.password);
    
    if (!isValidPassword) {
      return authError('Invalid email or password');
    }
    
    const userData = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
      department: user.department,
    };
    
    const token = require('@/lib/auth').generateToken(userData);
    await setAuthCookie(token);
    
    return NextResponse.json({
      success: true,
      user: userData,
      message: 'Login successful',
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
