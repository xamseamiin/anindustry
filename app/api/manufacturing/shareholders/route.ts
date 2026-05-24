import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireManufacturingAccess } from '@/app/api/manufacturing/auth';

export const dynamic = 'force-dynamic';

// GET /api/manufacturing/shareholders
export async function GET(request: Request) {
    try {
        const { companyId } = await requireManufacturingAccess();
        
        const shareholders = await prisma.shareholder.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' }
        });
        
        return NextResponse.json({ shareholders });
    } catch (error: any) {
        console.error('Error fetching shareholders:', error);
        if (error.message && error.message.includes('Unauthorized')) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ message: 'Error fetching shareholders' }, { status: 500 });
    }
}

// POST /api/manufacturing/shareholders
export async function POST(request: Request) {
    try {
        const { companyId } = await requireManufacturingAccess();
        const body = await request.json();
        
        // Validations
        if (!body.name || !body.email) {
            return NextResponse.json({ message: 'Name and email are required' }, { status: 400 });
        }
        
        const sharePercentage = parseFloat(body.sharePercentage) || 0;
        const profitSplit = parseFloat(body.profitSplit) || 0;
        
        if (sharePercentage <= 0) {
            return NextResponse.json({ message: 'Saamiga boqolleyda (Share Percentage) waa in uu ka badnaadaa 0.' }, { status: 400 });
        }
        
        // Ensure total shares don't exceed 100%
        const existingShareholders = await prisma.shareholder.findMany({
            where: { companyId }
        });
        const currentTotalShares = existingShareholders.reduce((sum, sh) => sum + sh.sharePercentage, 0);
        if (currentTotalShares + sharePercentage > 100.01) { // Allowing tiny floating-point leeway
            return NextResponse.json({ 
                message: `Wadarta saamiyada dhammaan lama ogola in ay ka badato 100%. Saamiga hadda bannaan waa ${(100 - currentTotalShares).toFixed(1)}%.` 
            }, { status: 400 });
        }

        const shareholder = await prisma.shareholder.create({
            data: {
                companyId,
                name: body.name,
                email: body.email,
                sharePercentage,
                profitSplit,
                joinedDate: body.joinedDate ? new Date(body.joinedDate) : new Date(),
            }
        });
        
        return NextResponse.json({ shareholder, message: 'Saamilayda si guul leh ayaa loo diiwaangeliyey!' });
    } catch (error) {
        console.error('Error creating shareholder:', error);
        return NextResponse.json({ message: 'Cilad ayaa dhacday inta lagu guda jiray diiwaangelinta saamilayda.' }, { status: 500 });
    }
}
