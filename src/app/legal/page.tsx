import type { Metadata } from 'next';
import { getSocialLinks } from '@/lib/social';
import { db } from '@/lib/db';
import { getNav, getSetting } from '@/lib/settings';
import { PublicFrame } from '../components';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Legal & Policies | ElarioLabs',
  description:
    'Official legal documents, privacy policies and terms of use for ElarioLabs and its applications.',
  alternates: { canonical: '/legal' },
};

export default async function LegalIndexPage() {
  const [documents, nav, copyright, logoUrl, socialLinks, contactEmail, contactPhone] =
    await Promise.all([
      db.legalDocument.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: [{ type: 'asc' }, { title: 'asc' }],
        select: {
          id: true,
          title: true,
          slug: true,
          type: true,
          effectiveDate: true,
          updatedDate: true,
          application: { select: { name: true } },
        },
      }),
      getNav(),
      getSetting('copyright', '© ElarioLabs'),
      getSetting<string>('brand.logoUrl', ''),
      getSocialLinks(),
      getSetting<string>('contact.email', ''),
      getSetting<string>('contact.phone', ''),
    ]);

  return (
    <PublicFrame
      items={nav.filter((n: any) => n.group === 'header' && n.href !== '/support')}
      copyright={copyright}
      logoUrl={logoUrl}
      socialLinks={socialLinks}
      contactEmail={contactEmail}
      contactPhone={contactPhone}
    >
      <div className="shell">
        <section className="hero">
          <div className="eyebrow">ELARIOLABS / LEGAL</div>
          <h1>Legal &amp; Policies</h1>
          <p>
            Official legal documents for ElarioLabs and its applications.
            Select a document below to read its full terms and policies.
          </p>

          {documents.length === 0 ? (
            <div className="empty">
              <h2>No published documents yet</h2>
              <p>
                Documents will appear here automatically after publication
                through the administration panel.
              </p>
            </div>
          ) : (
            <div className="cards legal-document-grid">
              {documents.map((doc) => (
                <a className="card legal-document-card" href={`/legal/${doc.slug}`} key={doc.id}>
                  <div className="eyebrow">{doc.type}</div>
                  <h2>{doc.title}</h2>
                  {doc.application?.name && (
                    <p>Application: {doc.application.name}</p>
                  )}
                  <p className="legal-document-date">
                    {doc.effectiveDate
                      ? `Effective ${doc.effectiveDate.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}`
                      : doc.updatedDate
                        ? `Updated ${doc.updatedDate.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}`
                        : 'Official legal document'}
                  </p>
                  <span className="legal-document-link">Read document →</span>
                </a>
              ))}
            </div>
          )}
        </section>
      </div>
    </PublicFrame>
  );
}
