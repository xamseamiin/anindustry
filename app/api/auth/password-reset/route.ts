// app/api/auth/password-reset/route.ts - User Password Reset API Route
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';
import { isValidEmail } from '@/lib/utils';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { email, token, newPassword, confirmNewPassword } = await request.json();

    // 1. Xaqiijinta Input-ka (Input Validation)
    if (!email || !token || !newPassword || !confirmNewPassword) {
      return NextResponse.json(
        { message: 'Fadlan buuxi dhammaan beeraha waajibka ah.' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { message: 'Fadlan geli email sax ah.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: 'Password-ka cusub waa inuu ugu yaraan 6 xaraf ka koobnaadaa.' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmNewPassword) {
      return NextResponse.json(
        { message: 'Password-ka cusub iyo xaqiijinta password-ka isku mid maaha.' },
        { status: 400 }
      );
    }

    // 2. Raadi User-ka (Find User)
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.resetToken || !user.resetTokenExpires) {
      return NextResponse.json(
        { message: 'Codsi dib u dejineed lama helin ama waa dhacay.' },
        { status: 400 }
      );
    }

    // Check expiry
    if (new Date() > user.resetTokenExpires) {
      return NextResponse.json(
        { message: 'Lambar-ka xaqiijinta waa dhacay. Fadlan codso mid cusub.' },
        { status: 400 }
      );
    }

    // Verify token (hashed OTP)
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    if (tokenHash !== user.resetToken) {
      return NextResponse.json(
        { message: 'Lambar-ka xaqiijintu waa khalad.' },
        { status: 400 }
      );
    }

    // 3. Siraynta Password-ka Cusub (Hash New Password)
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 4. Cusboonaysii Password-ka User-ka (Update User's Password and clear tokens)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null
      },
    });

    // 5. Jawaab Guul ah (Success Response)
    return NextResponse.json(
      { message: 'Password-kaaga si guul leh ayaa dib loogu dejiyay!' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Cilad ayaa dhacday marka password-ka dib loo dejinayay:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}
