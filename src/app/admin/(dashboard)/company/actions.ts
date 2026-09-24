'use server';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function saveCompanyInfo(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const about = formData.get('about') as string;
  const phone = formData.get('phone') as string;
  const country = formData.get('country') as string;
  const city = formData.get('city') as string;
  const address = formData.get('address') as string;
  const copyrightText = formData.get('copyrightText') as string;
  const websiteName = formData.get('websiteName') as string;

  const data = { 
    name: name || 'ElarioLabs', 
    email: email || null,
    about: about || null,
    phone: phone || null,
    country: country || null,
    city: city || null,
    address: address || null,
    copyrightText: copyrightText || null,
    websiteName: websiteName || null,
  };

  const existing = await prisma.companyInformation.findFirst();
  if (existing) { 
    await prisma.companyInformation.update({ where: { id: existing.id }, data }); 
  } else { 
    await prisma.companyInformation.create({ data }); 
  }
  revalidatePath('/'); 
  revalidatePath('/admin/company');
}
