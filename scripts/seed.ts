import pg from 'pg';
const {Client}=pg;
const url=process.env.DATABASE_URL;
if(!url)throw new Error('DATABASE_URL is required');
if(process.env.NODE_ENV==='production')throw new Error('Seed refuses to run with NODE_ENV=production.');
async function main(){const client=new Client({connectionString:url});
await client.connect();
try{
 await client.query('BEGIN');
 await client.query("INSERT INTO roles(name,permissions) VALUES ('Super Admin','[\"*\"]'::jsonb) ON CONFLICT(name) DO NOTHING");
 const categories=[
  ['art-and-design','Art & Design'],['auto-and-vehicles','Auto and Vehicles'],['beauty','Beauty'],['books','Books'],['books-and-reference','Books & Reference'],['business','Business'],['comics','Comics'],['communications','Communications'],['dating','Dating'],['developer-tools','Developer Tools'],['education','Education'],['entertainment','Entertainment'],['events','Events'],['finance','Finance'],['food-and-drink','Food & Drink'],['games','Games'],['graphics-and-design','Graphics & Design'],['health-and-fitness','Health & Fitness'],['house-and-home','House & Home'],['libraries-and-demo','Libraries & Demo'],['lifestyle','Lifestyle'],['magazines-and-newspapers','Magazines & Newspapers'],['maps-and-navigation','Maps & Navigation'],['medical','Medical'],['music','Music'],['music-and-audio','Music & Audio'],['news','News'],['news-and-magazines','News & Magazines'],['parenting','Parenting'],['personalization','Personalization'],['photo-and-video','Photo & Video'],['photography','Photography'],['productivity','Productivity'],['reference','Reference'],['shopping','Shopping'],['social','Social'],['social-networking','Social Networking'],['sports','Sports'],['tools','Tools'],['travel','Travel'],['travel-and-local','Travel & Local'],['utilities','Utilities'],['video-players-and-editors','Video Players & Editors'],['weather','Weather'],
  ...['Action','Adventure','Arcade','Board','Card','Casino','Casual','Dice','Educational','Family','Music','Puzzle','Racing','Role Playing','Simulation','Sports','Strategy','Trivia','Word'].map(name=>[`game-${name.toLowerCase().replaceAll(' ','-')}`,`Game: ${name}`])
 ];
 for(const [sortOrder,[slug,name]] of categories.entries())await client.query('INSERT INTO categories(name,slug,sort_order) VALUES($1,$2,$3) ON CONFLICT(slug) DO UPDATE SET name=EXCLUDED.name,sort_order=EXCLUDED.sort_order',[name,slug,sortOrder]);
 const platforms=[['ios','iOS',0],['ipados','iPadOS',1],['macos','macOS',2],['android','Android',3],['windows','Windows',4],['linux','Linux',5],['web','Web',6]];
 for(const [slug,name,i] of platforms)await client.query('INSERT INTO platforms(name,slug,sort_order) VALUES($1,$2,$3) ON CONFLICT(slug) DO NOTHING',[name,slug,i]);
 const pages=[['home','Home',{heroTitle:'Software made with care.',heroBody:'Independent software, thoughtfully made.',introTitle:'A small, independent software studio.',introBody:'ElarioLabs is an independent software studio.'}],['about','About',{title:'An independent software studio.',intro:'ElarioLabs is an independent software studio.',body:'We build software with care and attention to the people who use it.'}],['contact','Contact',{title:'Contact ElarioLabs',intro:'Send a message to the studio.'}],['support','Support',{title:'How can we help?',intro:'Browse help articles or send a message to ElarioLabs.'}]];
 for(const [slug,title,content] of pages)await client.query('INSERT INTO pages(slug,title,content,published) VALUES($1,$2,$3::jsonb,true) ON CONFLICT(slug) DO NOTHING',[slug,title,JSON.stringify(content)]);
 const nav=[['Apps','/apps',0],['About','/about',1],['Contact','/contact',3]];
 for(const [label,href,order] of nav){await client.query('INSERT INTO navigation_items(label,href,"group",sort_order) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING',[label,href,'header',order]);await client.query('INSERT INTO navigation_items(label,href,"group",sort_order) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING',[label,href,'footer',order]);}
 const settings={copyright:'© ElarioLabs','home.tagline':'Independent software, thoughtfully made.','seo.title':'ElarioLabs — Independent Software Studio','seo.description':'ElarioLabs is an independent software studio.'};
 for(const [key,value] of Object.entries(settings))await client.query('INSERT INTO site_settings(key,value) VALUES($1,$2::jsonb) ON CONFLICT(key) DO NOTHING',[key,JSON.stringify(value)]);
 await client.query('COMMIT');console.log('System defaults created. No applications were added.');
}catch(e){await client.query('ROLLBACK');throw e}finally{await client.end()}}
main().catch(error=>{console.error(error);process.exitCode=1});
