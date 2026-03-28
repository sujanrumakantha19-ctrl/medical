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
    const patientId = searchParams.get('patientId');

    const query: any = {};

    if (patientId) {
      query._id = patientId;
    }

    const patients = await Patient.find(query)
      .populate('assignedDoctor', 'name department')
      .sort({ createdAt: -1 });

    const prescriptions: any[] = [];
    
    for (const patient of patients) {
      if (patient.medicalHistory && patient.medicalHistory.length > 0) {
        for (const record of patient.medicalHistory) {
          if (record.prescription) {
            prescriptions.push({
              _id: record._id,
              patientId: {
                _id: patient._id,
                name: patient.name,
                mrn: patient.mrn,
                phone: patient.phone,
              },
              doctorId: patient.assignedDoctor,
              diagnosis: record.diagnosis,
              prescription: record.prescription,
              date: record.date,
              type: record.visitType || 'prescription',
            });
          }
        }
      }
    }

    prescriptions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      success: true,
      prescriptions,
    });
  } catch (error) {
    console.error('Get prescriptions error:', error);
    return NextResponse.json({ error: 'Failed to fetch prescriptions' }, { status: 500 });
  }
}
