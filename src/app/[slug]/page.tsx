import {notFound} from 'next/navigation';
import {db} from '@/lib/db';
import {getNav,getSetting} from '@/lib/settings';
import {getSocialLinks} from '@/lib/social';
import {PublicFrame,SocialLinks} from '../components';

export const dynamic='force-dynamic';

export default async function ContentPage({params,searchParams}:{params:Promise<{slug:string}>;searchParams:Promise<{sent?:string;error?:string}>}){
 const {slug}=await params;
 const {sent,error}=await searchParams;
 if(!['about','contact'].includes(slug))notFound();
 const page=slug==='about'?null:await db.page.findUnique({where:{slug}});
 if(page&&!page.published)notFound();
 const [nav,copyright,logoUrl,socialLinks,supportEmail,contactPhone]=await Promise.all([
  getNav(),getSetting('copyright','© ElarioLabs'),getSetting<string>('brand.logoUrl',''),getSocialLinks(),getSetting<string>('contact.email',''),getSetting<string>('contact.phone','')
 ]);
 const data=(page?.content??{}) as {title?:string;body?:string;intro?:string};
 return <PublicFrame items={nav.filter((n:any)=>n.group==='header'&&n.href!=='/support')} copyright={copyright} logoUrl={logoUrl} socialLinks={socialLinks} contactEmail={supportEmail} contactPhone={contactPhone}>
  <div className="shell">
   {slug==='about'?<>
    <section className="hero"><span className="eyebrow">About ElarioLabs</span><h1>Designing software that makes sense.</h1><p>We build our own digital products and applications, turning simple ideas into polished, practical software.</p></section>
    <section className="about-lead"><span className="eyebrow">Our studio</span><h2>Our own products, from first idea to release.</h2><p>ElarioLabs is an independent software studio dedicated to building digital products and applications of our own. We turn simple ideas into polished, practical software people can use in everyday life.</p></section>
    <section className="about-grid"><article><span className="about-index">01 / HOW WE WORK</span><h2>Built in-house, with purpose.</h2><p>We develop and launch our own apps from the ground up—from the initial concept and product design through development, testing, and release. Each product has its own purpose and identity, guided by a shared commitment to simplicity, reliability, and thoughtful design.</p></article><article><span className="about-index">02 / OUR FOCUS</span><h2>Native iOS, made to feel natural.</h2><p>Our main focus is creating native iOS applications that feel at home on the platform, perform well, and solve real problems without unnecessary complexity. Good software should be clear from the first interaction and enjoyable to use over time.</p></article><article className="about-wide"><span className="about-index">03 / WHAT’S NEXT</span><h2>A growing portfolio.</h2><p>Our product portfolio is only the beginning. We continue to explore new ideas, technologies, and ways to build software that is genuinely useful.</p></article></section>
   </>:<>
    <section className="contact-intro"><span className="eyebrow">Contact the studio</span><h1>Let’s start a <span>conversation.</span></h1><p>Have a question about one of our apps, an idea to share, or simply want to say hello? Send us a note and we’ll get back to you.</p></section>
    {sent==='1'&&<div className="contact-success" role="status"><span aria-hidden="true">✓</span><div><strong>Your message is on its way.</strong><p>Thanks for reaching out. We’ve received your note.</p></div></div>}
    <section className="contact-grid" aria-label="Contact ElarioLabs">
     <aside className="contact-aside"><div><span className="contact-aside-orbit" aria-hidden="true">E</span><span className="eyebrow">A small studio, an open inbox</span><h2>Tell us what’s on your mind.</h2><p>We’re always glad to hear from the people who use our products.</p></div><div className="contact-details"><span className="contact-label">CONTACT THE STUDIO</span>{supportEmail&&<a href={`mailto:${supportEmail}`}>{supportEmail}<span aria-hidden="true">↗</span></a>}{contactPhone&&<a href={`tel:${contactPhone.replace(/[^+\d]/g,'')}`}>{contactPhone}<span aria-hidden="true">↗</span></a>}{!supportEmail&&!contactPhone&&<p>Use the message form and we’ll reply by email.</p>}{Object.values(socialLinks).some(Boolean)&&<div className="contact-social"><span className="contact-label">FIND US ONLINE</span><SocialLinks links={socialLinks}/></div>}</div></aside>
     <ContactForm error={error}/>
    </section>
   </>}
  </div>
 </PublicFrame>
}

function ContactForm({error}:{error?:string}){
 return <form action="/api/contact" method="post" className="contact-form">
  <div className="contact-form-heading"><span className="eyebrow">We’d love to hear from you</span><h2>Send us a message</h2><p>Fill in the details below and your message will go straight to our studio inbox.</p></div>
  {error&&<p className="contact-error" role="alert">Please check your details and try sending your message again.</p>}
  <div className="form-grid"><label className="field">Your name<input required name="name" maxLength={120} autoComplete="name" placeholder="Jane Smith"/></label><label className="field">Email address<input required type="email" name="email" maxLength={254} autoComplete="email" placeholder="jane@example.com"/></label></div>
  <label className="field">Subject<input required name="subject" maxLength={180} placeholder="What would you like to talk about?"/></label>
  <label className="field">Your message<textarea required name="message" maxLength={10000} placeholder="Write your message here…"/></label>
  <label className="sr-only">Leave blank<input tabIndex={-1} autoComplete="off" name="website"/></label>
  <div className="contact-submit"><button className="btn-primary">Send message <span aria-hidden="true">↗</span></button><span>Your details are only used to respond to your message.</span></div>
 </form>
}
