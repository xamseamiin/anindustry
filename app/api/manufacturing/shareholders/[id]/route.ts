import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireManufacturingAccess } from '@/app/api/manufacturing/auth';

// PUT /api/manufacturing/shareholders/[id]
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const { companyId } = await requireManufacturingAccess();
        const body = await request.json();
        
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
            where: { 
                companyId,
                id: { not: params.id }
            }
        });
        const currentTotalShares = existingShareholders.reduce((sum, sh) => sum + sh.sharePercentage, 0);
        if (currentTotalShares + sharePercentage > 100.01) {
            return NextResponse.json({ 
                message: `Wadarta saamiyada dhammaan lama ogola in ay ka badato 100%. Saamiga hadda bannaan waa ${(100 - currentTotalShares).toFixed(1)}%.` 
            }, { status: 400 });
        }

        const shareholder = await prisma.shareholder.updateMany({
            where: { id: params.id, companyId },
            data: {
                name: body.name,
                email: body.email,
                sharePercentage,
                profitSplit,
                joinedDate: body.joinedDate ? new Date(body.joinedDate) : new Date(),
            }
        });
        
        if (shareholder.count === 0) {
            return NextResponse.json({ message: 'Saamilayda lama helin ama laguma guulaysan cusboonaysiinta.' }, { status: 404 });
        }
        
        return NextResponse.json({ message: 'Saamilayda si guul leh ayaa loo cusboonaysiiyey!' });
    } catch (error) {
        console.error('Error updating shareholder:', error);
        return NextResponse.json({ message: 'Cilad ayaa dhacday inta lagu guda jiray cusboonaysiinta saamilayda.' }, { status: 500 });
    }
}

// DELETE /api/manufacturing/shareholders/[id]
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const { companyId } = await requireManufacturingAccess();
        
        // Check if shareholder has active transactions before deleting
        const txCount = await prisma.transaction.count({
            where: { shareholderId: params.id, companyId }
        });
        
        if (txCount > 0) {
            return NextResponse.json({ 
                message: 'Ma tirtiri kartid saamilay leh dhaqdhaqaaqyo maaliyadeed (transactions) la xiriira.' 
            }, { status: 400 });
        }
        
        const count = await prisma.shareholder.deleteMany({
            where: { id: params.id, companyId }
        });
        
        if (count.count === 0) {
            return NextResponse.json({ message: 'Saamilayda lama helin ama laguma guulaysan tirtiriddeeda.' }, { status: 404 });
        }
        
        return NextResponse.json({ message: 'Saamilayda si guul leh ayaa loo tirtiray!' });
    } catch (error) {
        console.error('Error deleting shareholder:', error);
        return NextResponse.json({ message: 'Cilad ayaa dhacday inta lagu guda jiray tirtiridda saamilayda.' }, { status: 500 });
    }
}
