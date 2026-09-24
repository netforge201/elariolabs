import { prisma } from '@/lib/db';
import { saveCompanyInfo } from './actions';
import SubmitButton from '@/components/admin/SubmitButton';
export default async function CompanyPage() {
  const company = await prisma.companyInformation.findFirst();
  
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Company Information</h1>
      <form action={saveCompanyInfo} className="space-y-6">
        <div className="bg-zinc-900 border-zinc-800 p-6 rounded-lg border shadow-sm">
          <div className="space-y-4">
            <div><label className="block text-sm font-medium mb-1">Company Name</label><input type="text" name="name" defaultValue={company?.name || 'ElarioLabs'} className="w-full border border-zinc-700 bg-zinc-800 p-2 rounded" /></div>
            <div><label className="block text-sm font-medium mb-1">Website Name</label><input type="text" name="websiteName" defaultValue={company?.websiteName || ''} className="w-full border border-zinc-700 bg-zinc-800 p-2 rounded" /></div>
            <div><label className="block text-sm font-medium mb-1">About Text</label><textarea name="about" defaultValue={company?.about || ''} rows={4} className="w-full border border-zinc-700 bg-zinc-800 p-2 rounded"></textarea></div>
            <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" name="email" defaultValue={company?.email || ''} className="w-full border border-zinc-700 bg-zinc-800 p-2 rounded" /></div>
            <div><label className="block text-sm font-medium mb-1">Phone</label><input type="text" name="phone" defaultValue={company?.phone || ''} className="w-full border border-zinc-700 bg-zinc-800 p-2 rounded" /></div>
            <div><label className="block text-sm font-medium mb-1">Country</label><input type="text" name="country" defaultValue={company?.country || ''} className="w-full border border-zinc-700 bg-zinc-800 p-2 rounded" /></div>
            <div><label className="block text-sm font-medium mb-1">City</label><input type="text" name="city" defaultValue={company?.city || ''} className="w-full border border-zinc-700 bg-zinc-800 p-2 rounded" /></div>
            <div><label className="block text-sm font-medium mb-1">Address</label><input type="text" name="address" defaultValue={company?.address || ''} className="w-full border border-zinc-700 bg-zinc-800 p-2 rounded" /></div>
            <div><label className="block text-sm font-medium mb-1">Copyright Text</label><input type="text" name="copyrightText" defaultValue={company?.copyrightText || ''} className="w-full border border-zinc-700 bg-zinc-800 p-2 rounded" /></div>
          </div>
        </div>
        <SubmitButton>Save Settings</SubmitButton>
      </form>
    </div>
  );
}
