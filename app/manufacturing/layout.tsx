import FactoryLayout from '@/components/layouts/FactoryLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
    return <FactoryLayout>{children}</FactoryLayout>;
}
