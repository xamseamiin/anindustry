import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db'; // Haddii aad isticmaasho "@/lib/prisma" beddel sida kuugu habboon
import { isValidEmail } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // 1. Xaqiijinta Input-ka
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Fadlan buuxi dhammaan beeraha waajibka ah.' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { message: 'Email-ka ama password-ka waa qaldan yahay.' },
        { status: 401 }
      );
    }

    // 2. Raadi User-ka
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        company: { select: { name: true } }
      }
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Email-ka ama password-ka waa qaldan yahay.' },
        { status: 401 }
      );
    }

    // 3. Hubi Password-ka
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json(
        { message: 'Email-ka ama password-ka waa qaldan yahay.' },
        { status: 401 }
      );
    }

    // 4. Hubi Xaaladda User-ka
    if (user.status === 'Inactive') {
      return NextResponse.json(
        { message: 'Akoonkaagu waa la damiyay. Fadlan la xiriir maamulaha.' },
        { status: 403 }
      );
    }

    // 5. Jawaab Guul ah
    return NextResponse.json(
      {
        message: 'Si guul leh ayaad u soo gashay!',
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          companyName: user.company?.name,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Cilad ayaa dhacday marka user-ka la soo gelinayay:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}