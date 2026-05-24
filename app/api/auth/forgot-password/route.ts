// app/api/auth/forgot-password/route.ts - Send Password Reset OTP
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { isValidEmail } from '@/lib/utils';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email || !isValidEmail(email)) {
            return NextResponse.json(
                { message: 'Fadlan geli email sax ah.' },
                { status: 400 }
            );
        }

        // 1. Find User
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // Security: Don't reveal if email exists
            return NextResponse.json(
                { message: 'Haddii email-kaagu uu ku jiro nidaamkeena, waxaad heli doontaa lambarka dib u dejinta.' },
                { status: 200 }
            );
        }

        // 2. Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
        const expires = new Date(Date.now() + 3600000); // 1 hour

        // 3. Save to database
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken: otpHash,
                resetTokenExpires: expires,
            },
        });

        // 4. Send Email
        const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #3498DB; text-align: center;">Revlo - Dib U Dejinta Password-ka</h2>
        <p>Salaan ${user.fullName},</p>
        <p>Waxaad codsatay inaad beddesho password-kaaga. Fadlan isticmaal lambarka hoose si aad u dhammaystirto habka dib u dejinta:</p>
        <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 5px; color: #333;">
          ${otp}
        </div>
        <p>Lambarkani wuxuu dhacayaa 1 saac ka dib.</p>
        <p>Haddii aadan adigu codsan beddelka password-ka, fadlan iska indha tir fariintan.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #777; text-align: center;">Revlo VR - Maamulka Ganacsigaaga</p>
      </div>
    `;

        const emailSent = await sendEmail({
            to: email,
            subject: 'Revlo - Lambarka Dib U Dejinta Password-ka',
            html: emailHtml,
            text: `Lambarkaaga dib u dejinta password-ka Revlo waa: ${otp}. Wuxuu dhacayaa 1 saac ka dib.`,
        });

        if (!emailSent) {
            console.log(`⚠️ Email sending failed. Generated OTP for ${email}: ${otp}`);
            if (process.env.NODE_ENV !== 'production') {
                return NextResponse.json(
                    { message: `(Dev Mode) Cod-kaagu waa: ${otp}. Email-ka lama diri karin.`, otp },
                    { status: 200 }
                );
            }
        }

        return NextResponse.json(
            { message: 'Haddii email-kaagu uu ku jiro nidaamkeena, waxaad heli doontaa lambarka dib u dejinta.' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json(
            { message: 'Cilad server ayaa dhacday.' },
            { status: 500 }
        );
    }
}
