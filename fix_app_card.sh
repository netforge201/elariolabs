sed -i '' '/{app.heroImage && <img src={app.heroImage.url}/,/<div className="p-8 pt-6 flex-1 flex flex-col">/c\
                {app.heroImage ? <img src={app.heroImage.url} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" /> : <div className="absolute inset-0 w-full h-full bg-zinc-800" />}\
              </div>\
              <div className="p-8 pt-6 flex-1 flex flex-col">' src/app/\(public\)/page.tsx
sed -i '' 's/inline-flex items-center justify-center gap-2 w-full py-3 bg-zinc-900 border border-white\/10 rounded-full text-sm font-semibold hover:bg-zinc-800 transition-colors/inline-flex items-center justify-center gap-2 w-full py-3 bg-[#111] border border-white\/5 rounded-2xl text-sm font-semibold hover:bg-[#1a1a1a] transition-colors text-zinc-200/g' src/app/\(public\)/page.tsx
